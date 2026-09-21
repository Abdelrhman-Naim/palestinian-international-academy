import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Toggle saving a book for a user
 * @param {string} userId - User UID
 * @param {object} book - Book object
 * @returns {Promise<{ saved: boolean }>}
 */
export async function toggleSaveBook(userId, book) {
  if (!userId || !book || !book.id) {
    throw new Error('User ID and valid Book object are required');
  }

  const docId = `${userId}_${book.id}`;
  const saveRef = doc(db, 'saved_books', docId);
  const snap = await getDoc(saveRef);

  if (snap.exists()) {
    // Already saved -> Remove it
    await deleteDoc(saveRef);
    return { saved: false };
  } else {
    // Not saved -> Save it
    await setDoc(saveRef, {
      userId,
      bookId: book.id,
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      type: book.type || '',
      year: book.year || '',
      pages: book.pages || '',
      downloads: book.downloads || 0,
      ratingAverage: book.ratingAverage || 0,
      ratingCount: book.ratingCount || 0,
      link: book.link || book.driveUrl || '',
      driveUrl: book.driveUrl || '',
      description: book.description || '',
      savedAt: serverTimestamp(),
    });
    return { saved: true };
  }
}

/**
 * Check if a book is saved by a user
 */
export async function isBookSaved(userId, bookId) {
  if (!userId || !bookId) return false;
  const docId = `${userId}_${bookId}`;
  const snap = await getDoc(doc(db, 'saved_books', docId));
  return snap.exists();
}

/**
 * Remove a saved book directly
 */
export async function removeSavedBook(userId, bookId) {
  if (!userId || !bookId) return;
  const docId = `${userId}_${bookId}`;
  await deleteDoc(doc(db, 'saved_books', docId));
}

/**
 * Real-time listener for all books saved by a user
 */
export function listenToUserSavedBooks(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'saved_books'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort client-side by savedAt descending
      list.sort((a, b) => {
        const timeA = a.savedAt?.toMillis?.() || 0;
        const timeB = b.savedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      callback(list);
    },
    (err) => {
      console.warn('Error listening to saved books:', err);
      callback([]);
    }
  );
}
