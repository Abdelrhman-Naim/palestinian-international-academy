import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

const LibraryContext = createContext(null);

const LOCAL_STORAGE_KEY = 'pia_local_books';

const getStoredLocalBooks = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalBooks = (booksArr) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(booksArr));
  } catch (e) {}
};

const isValidUUID = (str) => {
  if (!str) return false;
  const s = String(str);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || /^\d+$/.test(s);
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const safeTranslate = async (str) => {
  if (!str) return str;
  try {
    return await translateText(str);
  } catch {
    return str;
  }
};

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

      const localBooks = getStoredLocalBooks();
      let remoteBooks = [];

      if (error) {
        console.warn('Error fetching books from Supabase:', error.message);
      } else if (data) {
        remoteBooks = data.map(item => sanitizeObject(item));
      }

      // Merge remote + local custom books
      const mergedMap = new Map();
      remoteBooks.forEach(rb => {
        if (rb.id) mergedMap.set(rb.id, rb);
      });
      localBooks.forEach(lb => {
        if (lb.id && !mergedMap.has(lb.id)) {
          mergedMap.set(lb.id, sanitizeObject(lb));
        }
      });

      setRawBooks(Array.from(mergedMap.values()));
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

  const books = rawBooks.map(book => {
    const bookCategory = book.category || book.category_name || '';
    const bookCategoryEn = book.category_en || bookCategory;
    const bookLink = book.link || book.pdf_url || book.driveUrl || '';

    return {
      ...book,
      id: book.id,
      title: lang === 'en' ? (book.title_en || book.title) : book.title,
      author: lang === 'en' ? (book.author_en || book.author) : book.author,
      category: lang === 'en' ? bookCategoryEn : bookCategory,
      category_name: bookCategory,
      description: lang === 'en' ? (book.description_en || book.description || book.title) : (book.description || book.title),
      link: bookLink,
      pdf_url: bookLink,
      driveUrl: book.driveUrl || bookLink,
      coverUrl: book.coverUrl || book.cover_url || '',
      cover_url: book.cover_url || book.coverUrl || '',
      pages: Number(book.pages) || 120,
      downloads: book.downloads !== undefined ? book.downloads : (book.downloads_count || 0),
      downloads_count: book.downloads_count !== undefined ? book.downloads_count : (book.downloads || 0),
      year: book.year || (book.created_at ? new Date(book.created_at).getFullYear().toString() : new Date().getFullYear().toString()),
      rating: book.rating || 5.0,
      originalData: book
    };
  });

  const addBook = async (book) => {
    try {
      const bookId = (book.id && isValidUUID(book.id)) ? book.id : generateUUID();
      const fullBookObj = {
        ...book,
        id: bookId,
        created_at: book.created_at || new Date().toISOString(),
        year: book.year || new Date().getFullYear().toString(),
        pages: Number(book.pages) > 0 ? Number(book.pages) : 120,
        downloads: book.downloads || 0,
        downloads_count: book.downloads || 0,
        rating: 5.0,
        category: book.category || book.category_name || '',
        category_name: book.category_name || book.category || '',
        link: book.link || book.pdf_url || '',
        pdf_url: book.pdf_url || book.link || '',
        cover_url: book.cover_url || book.coverUrl || '',
        coverUrl: book.coverUrl || book.cover_url || '',
        description: book.description || book.title || ''
      };

      if (fullBookObj.title) fullBookObj.title_en = await safeTranslate(fullBookObj.title);
      if (fullBookObj.author) fullBookObj.author_en = await safeTranslate(fullBookObj.author);
      if (fullBookObj.category) fullBookObj.category_en = await safeTranslate(fullBookObj.category);
      if (fullBookObj.description) fullBookObj.description_en = await safeTranslate(fullBookObj.description);

      // Save locally first for guaranteed immediate UI availability
      const existingLocals = getStoredLocalBooks();
      saveLocalBooks([fullBookObj, ...existingLocals.filter(b => b.id !== fullBookObj.id)]);
      setRawBooks(prev => [fullBookObj, ...prev.filter(b => b.id !== fullBookObj.id)]);

      // Prepare Supabase payload
      let currentPayload = {
        id: fullBookObj.id,
        title: fullBookObj.title,
        author: fullBookObj.author,
        description: fullBookObj.description,
        category: fullBookObj.category,
        category_name: fullBookObj.category_name,
        pdf_url: fullBookObj.pdf_url,
        link: fullBookObj.link,
        cover_url: fullBookObj.cover_url,
        coverUrl: fullBookObj.coverUrl,
        pages: fullBookObj.pages,
        downloads_count: fullBookObj.downloads_count,
        downloads: fullBookObj.downloads,
        rating: fullBookObj.rating,
        created_at: fullBookObj.created_at,
        year: fullBookObj.year
      };

      if (fullBookObj.title_en) currentPayload.title_en = fullBookObj.title_en;
      if (fullBookObj.author_en) currentPayload.author_en = fullBookObj.author_en;
      if (fullBookObj.category_en) currentPayload.category_en = fullBookObj.category_en;
      if (fullBookObj.description_en) currentPayload.description_en = fullBookObj.description_en;

      if (!isValidUUID(currentPayload.id)) {
        delete currentPayload.id;
      }

      // Dynamic Auto-Repair loop for Supabase
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const { data, error } = await supabase
            .from('books')
            .insert([currentPayload])
            .select()
            .single();

          if (!error && data) {
            const updatedBook = { ...fullBookObj, ...data };
            saveLocalBooks([updatedBook, ...existingLocals.filter(b => b.id !== fullBookObj.id)]);
            setRawBooks(prev => [updatedBook, ...prev.filter(b => b.id !== fullBookObj.id)]);
            break;
          }

          if (error) {
            console.warn(`[addBook attempt ${attempt + 1}] Notice:`, error.message);
            const match = error.message?.match(/Could not find the '([^']+)' column/i);
            if (match && match[1]) {
              const badCol = match[1];
              delete currentPayload[badCol];
              continue;
            }

            if (error.message?.includes('category_id') || error.message?.includes('foreign key')) {
              delete currentPayload.category_id;
              continue;
            }

            if (error.message?.includes('type integer') || error.message?.includes('type numeric')) {
              if (currentPayload.pages) currentPayload.pages = parseInt(currentPayload.pages, 10) || 0;
              if (currentPayload.downloads_count) currentPayload.downloads_count = parseInt(currentPayload.downloads_count, 10) || 0;
              continue;
            }

            break;
          }
        } catch (e) {
          console.warn('[addBook insert catch]:', e);
          break;
        }
      }

      return fullBookObj;
    } catch (err) {
      console.error("Error adding book: ", err);
      return null;
    }
  };

  const removeBook = async (id) => {
    try {
      // Remove from local storage
      const existingLocals = getStoredLocalBooks();
      saveLocalBooks(existingLocals.filter(b => b.id !== id));
      setRawBooks(prev => prev.filter(b => b.id !== id));

      if (isValidUUID(id)) {
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', id);

        if (error) console.warn('Supabase book delete notice:', error.message);
      }
    } catch (err) {
      console.error("Error deleting book from Supabase: ", err);
    }
  };

  const updateBook = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;
      if (dataToUpdate.title) dataToUpdate.title_en = await safeTranslate(dataToUpdate.title);
      if (dataToUpdate.author) dataToUpdate.author_en = await safeTranslate(dataToUpdate.author);
      if (dataToUpdate.category) {
        dataToUpdate.category_en = await safeTranslate(dataToUpdate.category);
        dataToUpdate.category_name = dataToUpdate.category;
      }
      if (dataToUpdate.link) dataToUpdate.pdf_url = dataToUpdate.link;

      // Update local storage first
      const existingLocals = getStoredLocalBooks();
      const updatedLocalList = existingLocals.map(b => b.id === id ? { ...b, ...dataToUpdate } : b);
      saveLocalBooks(updatedLocalList);

      setRawBooks(prev => prev.map(b => b.id === id ? { ...b, ...dataToUpdate } : b));

      if (isValidUUID(id)) {
        let updatePayload = { ...dataToUpdate };
        for (let attempt = 0; attempt < 8; attempt++) {
          const { error } = await supabase
            .from('books')
            .update(updatePayload)
            .eq('id', id);

          if (!error) break;

          const match = error.message?.match(/Could not find the '([^']+)' column/i);
          if (match && match[1]) {
            delete updatePayload[match[1]];
            continue;
          }
          break;
        }
      }
    } catch (err) {
      console.error("Error updating book in Supabase: ", err);
    }
  };

  return (
    <LibraryContext.Provider value={{ books, rawBooks, loading, addBook, removeBook, updateBook, fetchBooks }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
