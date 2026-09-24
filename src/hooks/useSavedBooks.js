import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToUserSavedBooks, toggleSaveBook, removeSavedBook } from '../services/savedBooksService';

export function useSavedBooks() {
  const { currentUser } = useAuth();
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setSavedList([]);
      setLoading(false);
      return;
    }

    const userId = currentUser.id || currentUser.uid;
    setLoading(true);
    const unsub = listenToUserSavedBooks(userId, (list) => {
      setSavedList(list);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const savedBookIds = useMemo(() => {
    return new Set(savedList.map((item) => String(item.bookId || item.book_id || item.id)));
  }, [savedList]);

  const isSaved = (bookId) => {
    if (!bookId) return false;
    return savedBookIds.has(String(bookId));
  };

  const handleToggleSave = async (book) => {
    if (!currentUser || !book) return { saved: false };
    const userId = currentUser.id || currentUser.uid;
    const bId = String(book.id);

    // Optimistic UI state update immediately
    setSavedList((prev) => {
      const exists = prev.some((item) => String(item.bookId || item.book_id || item.id) === bId);
      if (exists) {
        return prev.filter((item) => String(item.bookId || item.book_id || item.id) !== bId);
      } else {
        const optimisticItem = {
          id: `saved_${Date.now()}_${bId}`,
          book_id: bId,
          bookId: bId,
          title: book.title || '',
          author: book.author || '',
          category: book.category || book.category_name || '',
          description: book.description || '',
          cover_url: book.cover_url || book.coverUrl || '',
          coverUrl: book.coverUrl || book.cover_url || '',
          downloads: book.downloads || 0,
          rating: book.rating || 5.0,
          saved_at: new Date().toISOString()
        };
        return [optimisticItem, ...prev];
      }
    });

    return await toggleSaveBook(userId, book);
  };

  const handleRemove = async (bookId) => {
    if (!currentUser || !bookId) return;
    const userId = currentUser.id || currentUser.uid;
    const bId = String(bookId);
    setSavedList((prev) => prev.filter((item) => String(item.bookId || item.book_id || item.id) !== bId));
    await removeSavedBook(userId, bookId);
  };

  return {
    savedList,
    savedBookIds,
    loading,
    isSaved,
    toggleSave: handleToggleSave,
    removeSaved: handleRemove,
  };
}
