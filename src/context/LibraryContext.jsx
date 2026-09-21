import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [rawBooks, setRawBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'library'), (snapshot) => {
      const booksData = snapshot.docs.map(doc => sanitizeObject({
        id: doc.id,
        ...doc.data()
      }));
      setRawBooks(booksData);
      setLoading(false);
    }, (err) => {
      console.warn('Library snapshot listener error:', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const books = rawBooks.map(book => ({
    ...book,
    title: lang === 'en' ? (book.title_en || book.title) : book.title,
    author: lang === 'en' ? (book.author_en || book.author) : book.author,
    category: lang === 'en' ? (book.category_en || book.category) : book.category,
    originalData: book // keep original around just in case
  }));

  const addBook = async (book) => {
    try {
      if (book.title) book.title_en = await translateText(book.title);
      if (book.author) book.author_en = await translateText(book.author);
      if (book.category) book.category_en = await translateText(book.category);
      await addDoc(collection(db, 'library'), book);
    } catch (err) {
      console.error("Error adding book: ", err);
    }
  };

  const removeBook = async (id) => {
    try {
      await deleteDoc(doc(db, 'library', id));
    } catch (err) {
      console.error("Error deleting book: ", err);
    }
  };

  const updateBook = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;
      if (dataToUpdate.title) dataToUpdate.title_en = await translateText(dataToUpdate.title);
      if (dataToUpdate.author) dataToUpdate.author_en = await translateText(dataToUpdate.author);
      if (dataToUpdate.category) dataToUpdate.category_en = await translateText(dataToUpdate.category);
      await updateDoc(doc(db, 'library', id), dataToUpdate);
    } catch (err) {
      console.error("Error updating book: ", err);
    }
  };

  return (
    <LibraryContext.Provider value={{ books, rawBooks, loading, addBook, removeBook, updateBook }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}


