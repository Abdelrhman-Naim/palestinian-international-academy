import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [rawBooks, setRawBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching books from Supabase:', error.message);
      } else if (data) {
        setRawBooks(data.map(item => sanitizeObject(item)));
      }
    } catch (err) {
      console.warn('Books fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    const channel = supabase
      .channel('books_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        fetchBooks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const books = rawBooks.map(book => ({
    ...book,
    title: lang === 'en' ? (book.title_en || book.title) : book.title,
    author: lang === 'en' ? (book.author_en || book.author) : book.author,
    category: lang === 'en' ? (book.category_en || book.category) : book.category,
    originalData: book
  }));

  const addBook = async (book) => {
    try {
      if (book.title) book.title_en = await translateText(book.title);
      if (book.author) book.author_en = await translateText(book.author);
      if (book.category) book.category_en = await translateText(book.category);

      const { error } = await supabase
        .from('books')
        .insert([book]);

      if (error) throw error;
      await fetchBooks();
    } catch (err) {
      console.error("Error adding book to Supabase: ", err);
    }
  };

  const removeBook = async (id) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBooks();
    } catch (err) {
      console.error("Error deleting book from Supabase: ", err);
    }
  };

  const updateBook = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;
      if (dataToUpdate.title) dataToUpdate.title_en = await translateText(dataToUpdate.title);
      if (dataToUpdate.author) dataToUpdate.author_en = await translateText(dataToUpdate.author);
      if (dataToUpdate.category) dataToUpdate.category_en = await translateText(dataToUpdate.category);

      const { error } = await supabase
        .from('books')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;
      await fetchBooks();
    } catch (err) {
      console.error("Error updating book in Supabase: ", err);
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
