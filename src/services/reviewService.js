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

  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      target_type: targetType,
      target_id: targetId,
      user_id: userId,
      user_name: userName || 'مستخدم المنصة',
      user_avatar: userAvatar || '',
      rating: numRating,
      comment: (comment || '').trim(),
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
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('updated_at', { ascending: false });

    callback(data || []);
  };

  fetchReviews();

  const channel = supabase
    .channel(`reviews_${targetType}_${targetId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
      fetchReviews();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
