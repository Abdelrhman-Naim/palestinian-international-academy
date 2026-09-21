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

    setLoading(true);
    const unsub = listenToUserSavedBooks(currentUser.uid, (list) => {
      setSavedList(list);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const savedBookIds = useMemo(() => {
    return new Set(savedList.map((item) => item.bookId));
  }, [savedList]);

  const isSaved = (bookId) => {
    if (!bookId) return false;
    return savedBookIds.has(bookId);
  };

  const handleToggleSave = async (book) => {
    if (!currentUser || !book) return { saved: false };
    return await toggleSaveBook(currentUser.uid, book);
  };

  const handleRemove = async (bookId) => {
    if (!currentUser || !bookId) return;
    await removeSavedBook(currentUser.uid, bookId);
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
