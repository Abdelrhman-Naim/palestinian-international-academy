import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Recalculate and update the overall rating stats on the parent course or book document
 */
export async function recalculateTargetRating(targetType, targetId) {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId)
    );
    const snap = await getDocs(q);
    const totalCount = snap.size;

    let ratingSum = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    snap.forEach((d) => {
      const r = d.data();
      const val = Math.min(5, Math.max(1, Number(r.rating) || 5));
      ratingSum += val;
      breakdown[val] = (breakdown[val] || 0) + 1;
    });

    const ratingAverage = totalCount > 0 ? Number((ratingSum / totalCount).toFixed(1)) : 0;

    const parentCollection = targetType === 'course' ? 'courses' : 'library';
    const parentRef = doc(db, parentCollection, targetId);

    // Check if parent doc exists before updating
    const parentSnap = await getDoc(parentRef);
    if (parentSnap.exists()) {
      await updateDoc(parentRef, {
        ratingAverage,
        ratingCount: totalCount,
        ratingBreakdown: breakdown,
      });
    }

    return { ratingAverage, ratingCount: totalCount, breakdown };
  } catch (err) {
    console.error('Failed to recalculate rating stats:', err);
    return null;
  }
}

/**
 * Add or update a review
 */
export async function addOrUpdateReview({ targetType, targetId, userId, userName, userAvatar, rating, comment }) {
  if (!targetType || !targetId || !userId) {
    throw new Error('Missing targetType, targetId, or userId');
  }

  const reviewId = `${targetType}_${targetId}_${userId}`;
  const reviewRef = doc(db, 'reviews', reviewId);
  const existingSnap = await getDoc(reviewRef);

  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const reviewData = {
    targetType,
    targetId,
    userId,
    userName: userName || 'مستخدم المنصة',
    userAvatar: userAvatar || '',
    rating: numRating,
    comment: (comment || '').trim(),
    updatedAt: serverTimestamp(),
  };

  if (!existingSnap.exists()) {
    reviewData.createdAt = serverTimestamp();
  }

  await setDoc(reviewRef, reviewData, { merge: true });

  // Update overall rating stats on course / book
  await recalculateTargetRating(targetType, targetId);

  return { ok: true, reviewId };
}

/**
 * Delete a review
 */
export async function deleteReview({ targetType, targetId, userId }) {
  if (!targetType || !targetId || !userId) {
    throw new Error('Missing parameters to delete review');
  }

  const reviewId = `${targetType}_${targetId}_${userId}`;
  const reviewRef = doc(db, 'reviews', reviewId);
  
  await deleteDoc(reviewRef);

  // Recalculate stats
  await recalculateTargetRating(targetType, targetId);

  return { ok: true };
}

/**
 * Fetch a single user's existing review for a target
 */
export async function getUserReview(targetType, targetId, userId) {
  if (!targetType || !targetId || !userId) return null;
  const reviewId = `${targetType}_${targetId}_${userId}`;
  const snap = await getDoc(doc(db, 'reviews', reviewId));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Real-time listener for all reviews of a target
 */
export function listenToTargetReviews(targetType, targetId, callback) {
  if (!targetType || !targetId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'reviews'),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Client-side sort by updatedAt / createdAt descending
      list.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      callback(list);
    },
    (err) => {
      console.warn('Error listening to reviews:', err);
      callback([]);
    }
  );
}
