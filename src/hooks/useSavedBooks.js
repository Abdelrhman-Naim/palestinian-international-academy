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

  const handleToggleSave = async (book, explicitSavedState = null) => {
    if (!currentUser || !book) return { saved: false };
    const userId = currentUser.id || currentUser.uid;
    const bId = String(book.id);
    const currentlySaved = explicitSavedState !== null ? explicitSavedState : isSaved(bId);

    // Optimistic UI state update immediately
    setSavedList((prev) => {
      if (currentlySaved) {
        return prev.filter((item) => {
          const itemId = String(item.bookId || item.book_id || item.id);
          return itemId !== bId && !itemId.endsWith(`_${bId}`);
        });
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
        const cleaned = prev.filter((item) => {
          const itemId = String(item.bookId || item.book_id || item.id);
          return itemId !== bId && !itemId.endsWith(`_${bId}`);
        });
        return [optimisticItem, ...cleaned];
      }
    });

    return await toggleSaveBook(userId, book, currentlySaved);
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
