import { supabase } from '../supabase/client';

export async function recalculateTargetRating(targetType, targetId) {
  try {
    const table = targetType === 'course' ? 'courses' : 'books';
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (!reviews || reviews.length === 0) return null;

    const totalCount = reviews.length;
    const ratingSum = reviews.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
    const ratingAverage = Number((ratingSum / totalCount).toFixed(1));

    await supabase
      .from(table)
      .update({ rating: ratingAverage })
      .eq('id', targetId);

    return { ratingAverage, ratingCount: totalCount };
  } catch (err) {
    console.error('Failed to recalculate rating stats:', err);
    return null;
  }
}

export async function addOrUpdateReview({ targetType, targetId, userId, userName, userAvatar, rating, comment }) {
  if (!targetType || !targetId || !userId) {
    throw new Error('Missing targetType, targetId, or userId');
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new Error('Rating must be between 1 and 5 stars');
  }

  const trimmedComment = (comment || '').trim();
  const cleanRating = Math.min(5, Math.max(1, numRating));

  // Auto-resolve user name if missing or generic
  let resolvedName = (userName && userName !== 'طالب' && userName !== 'طالب المنصة') ? userName : '';
  let resolvedAvatar = userAvatar || '';

  if (!resolvedName) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        resolvedName = profile.full_name || profile.name || 'طالب المنصة';
        if (!resolvedAvatar) resolvedAvatar = profile.avatar_url || '';
      }
    } catch (e) {
      console.warn('Could not fetch profile for review:', e);
    }
  }

  if (!resolvedName) {
    resolvedName = 'طالب المنصة';
  }

  // Check if an existing review exists to prevent duplicates
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userId)
    .maybeSingle();

  const payload = {
    target_type: targetType,
    target_id: targetId,
    user_id: userId,
    user_name: resolvedName,
    user_avatar: resolvedAvatar,
    rating: cleanRating,
    comment: trimmedComment || null,
    updated_at: new Date().toISOString()
  };

  let reviewId = null;
  if (existing?.id) {
    const { data: updated, error } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) {
      console.error('Error updating review:', error);
      return { ok: false, error };
    }
    reviewId = updated?.id || existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from('reviews')
      .insert([payload])
      .select()
      .maybeSingle();
    if (error) {
      console.error('Error inserting review:', error);
      return { ok: false, error };
    }
    reviewId = inserted?.id;
  }

  await recalculateTargetRating(targetType, targetId);
  return { ok: true, reviewId };
}

export async function deleteReview({ targetType, targetId, userId }) {
  if (!targetType || !targetId || !userId) {
    throw new Error('Missing parameters to delete review');
  }

  try {
    await supabase
      .from('reviews')
      .delete()
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('user_id', userId);

    await recalculateTargetRating(targetType, targetId);
    return { ok: true };
  } catch (err) {
    console.error('Error deleting review:', err);
    return { ok: false, error: err };
  }
}

export async function getUserReview(targetType, targetId, userId) {
  if (!targetType || !targetId || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(id, full_name, avatar_url, email)')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    const resolvedName = data.user_name || data.profiles?.full_name || 'طالب المنصة';
    const resolvedAvatar = data.user_avatar || data.profiles?.avatar_url || '';
    return {
      ...data,
      id: data.id,
      userId: data.user_id,
      userName: resolvedName,
      user_name: resolvedName,
      userAvatar: resolvedAvatar,
      user_avatar: resolvedAvatar,
      rating: Number(data.rating) || 5,
      comment: data.comment || '',
      updatedAt: data.updated_at
    };
  } catch {
    return null;
  }
}

export function listenToTargetReviews(targetType, targetId, callback) {
  if (!targetType || !targetId) {
    callback([]);
    return () => {};
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(id, full_name, avatar_url, email)')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error fetching reviews:', error);
        callback([]);
        return;
      }

      const normalized = (data || []).map(r => {
        const resolvedName = r.user_name || r.profiles?.full_name || 'طالب المنصة';
        const resolvedAvatar = r.user_avatar || r.profiles?.avatar_url || '';
        return {
          ...r,
          id: r.id,
          userId: r.user_id,
          user_id: r.user_id,
          userName: resolvedName,
          user_name: resolvedName,
          userAvatar: resolvedAvatar,
          user_avatar: resolvedAvatar,
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          updatedAt: r.updated_at,
          createdAt: r.created_at
        };
      });

      callback(normalized);
    } catch (err) {
      console.warn('Error in listenToTargetReviews:', err);
      callback([]);
    }
  };

  fetchReviews();

  try {
    const channel = supabase
      .channel(`reviews_${targetType}_${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

