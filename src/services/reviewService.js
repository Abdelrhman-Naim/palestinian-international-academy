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
  if (!trimmedComment || trimmedComment.length < 3) {
    throw new Error('Review comment must be at least 3 characters');
  }

  const cleanRating = Math.min(5, Math.max(1, numRating));

  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      target_type: targetType,
      target_id: targetId,
      user_id: userId,
      user_name: userName || 'مستخدم المنصة',
      user_avatar: userAvatar || '',
      rating: cleanRating,
      comment: trimmedComment,
      updated_at: new Date()
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding/updating review:', error);
    return { ok: false, error };
  }

  await recalculateTargetRating(targetType, targetId);
  return { ok: true, reviewId: data?.id };
}

export async function deleteReview({ targetType, targetId, userId }) {
  if (!targetType || !targetId || !userId) {
    throw new Error('Missing parameters to delete review');
  }

  await supabase
    .from('reviews')
    .delete()
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userId);

  await recalculateTargetRating(targetType, targetId);
  return { ok: true };
}

export async function getUserReview(targetType, targetId, userId) {
  if (!targetType || !targetId || !userId) return null;
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userId)
    .single();

  return data || null;
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
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('updated_at', { ascending: false });

      if (error) {
        callback([]);
        return;
      }
      callback(data || []);
    } catch {
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
