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
    return await toggleSaveBook(userId, book);
  };

  const handleRemove = async (bookId) => {
    if (!currentUser || !bookId) return;
    const userId = currentUser.id || currentUser.uid;
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
