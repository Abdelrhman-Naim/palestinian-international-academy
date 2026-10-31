"use client";
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

import { safeStorage } from '../utils/safeStorage';

const LibraryContext = createContext(null);

const LOCAL_STORAGE_KEY = 'pia_local_books_v2';

const getStoredLocalBooks = () => {
  try {
    const saved = safeStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalBooks = (booksArr) => {
  try {
    safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(booksArr));
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

const normalizeBookKey = (title) => {
  if (!title) return '';
  return String(title)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
};

export function LibraryProvider({ children }) {
  const [rawBooks, setRawBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { lang } = useLanguage();
  const hasPrunedRef = useRef(false);

  const fetchBooks = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setFetchError(null);
    let isFinished = false;

    // Safety timeout prevents infinite spinner on aborted, stalled, or cancelled requests
    const timer = setTimeout(() => {
      if (!isFinished) {
        setLoading(false);
        const local = getStoredLocalBooks();
        if (local && local.length > 0) {
          setRawBooks(local);
        }
      }
    }, 10000);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      const local = getStoredLocalBooks();
      if (local && local.length > 0) {
        setRawBooks(local);
      }
      return;
    }

    try {
      const fetchChunkWithRetry = async (from, to, maxRetries = 2) => {
        let lastErr = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const { data, error } = await supabase
              .from('books')
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, to);

            if (error) {
              lastErr = error;
              if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
                continue;
              }
              return { data: [], error };
            }
            return { data: data || [], error: null };
          } catch (err) {
            lastErr = err;
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
              continue;
            }
            return { data: [], error: err };
          }
        }
        return { data: [], error: lastErr };
      };

      const fetchAllRemoteBooks = async () => {
        const chunkSize = 500;
        let all = [];
        let lastError = null;

        try {
          const { count, error: countErr } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true });

          if (count !== null && count !== undefined && !countErr && count > 0) {
            const chunkPromises = [];
            for (let from = 0; from < count; from += chunkSize) {
              const to = Math.min(from + chunkSize - 1, count - 1);
              chunkPromises.push(fetchChunkWithRetry(from, to, 2));
            }
            const results = await Promise.all(chunkPromises);
            results.forEach((res, idx) => {
              if (res.error) {
                console.warn(`Warning fetching books chunk ${idx * chunkSize}:`, res.error.message || res.error);
                lastError = res.error;
              }
              if (res.data && res.data.length > 0) {
                all.push(...res.data);
              }
            });
          } else {
            // Graceful fallback: loop until a page has fewer than 500 items
            let from = 0;
            while (true) {
              const { data, error } = await fetchChunkWithRetry(from, from + chunkSize - 1, 2);
              if (error) {
                lastError = error;
                break;
              }
              if (data && data.length > 0) {
                all.push(...data);
                if (data.length < chunkSize) break;
                from += chunkSize;
              } else {
                break;
              }
            }
          }
        } catch (err) {
          lastError = err;
        }

        // Always process all fetched books, even if one chunk had a non-fatal warning
        return { data: all, error: all.length > 0 ? null : lastError };
      };

      const [{ data, error }, { data: reviewRows }] = await Promise.all([
        fetchAllRemoteBooks(),
        supabase
          .from('reviews')
          .select('target_id, rating')
          .eq('target_type', 'book')
      ]);

      const reviewStatsMap = new Map();
      (reviewRows || []).forEach(r => {
        if (!r.target_id) return;
        if (!reviewStatsMap.has(r.target_id)) {
          reviewStatsMap.set(r.target_id, { count: 0, sum: 0 });
        }
        const s = reviewStatsMap.get(r.target_id);
        s.count += 1;
        s.sum += Number(r.rating || 5);
      });

      const localBooks = getStoredLocalBooks();
      let remoteBooks = [];

      if (error && (!data || data.length === 0)) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          console.warn('Error fetching books from Supabase:', error.message);
        }
      } else if (data) {
        remoteBooks = data.map(item => {
          const stats = reviewStatsMap.get(item.id);
          const rCount = stats ? stats.count : 0;
          const rAvg = rCount > 0 ? Number((stats.sum / rCount).toFixed(1)) : (Number(item.rating) || 5.0);
          const resolvedCategory = item.category_name || item.category || '';
          return sanitizeObject({
            ...item,
            category: resolvedCategory,
            category_name: resolvedCategory,
            downloads: item.downloads_count !== undefined ? Number(item.downloads_count) : (Number(item.downloads) || 0),
            downloads_count: item.downloads_count !== undefined ? Number(item.downloads_count) : (Number(item.downloads) || 0),
            link: item.link || item.pdf_url || '',
            driveUrl: item.driveUrl || item.pdf_url || item.link || '',
            pdf_url: item.pdf_url || item.driveUrl || item.link || '',
            ratingCount: rCount,
            rating_count: rCount,
            ratingAverage: rAvg,
            rating: rAvg
          });
        });
      }

      // Merge remote + local custom books strictly avoiding duplicates by canonical title
      const mergedMap = new Map();
      const existingCanonicals = new Set();
      const duplicateRemoteIdsToDelete = [];

      remoteBooks.forEach(rb => {
        const canonical = normalizeBookKey(rb.title);
        if (!canonical) return;

        if (existingCanonicals.has(canonical)) {
          if (rb.id) duplicateRemoteIdsToDelete.push(rb.id);
          return;
        }

        existingCanonicals.add(canonical);
        if (rb.id) mergedMap.set(rb.id, rb);
      });

      // Also deduplicate local books against existing canonicals
      const cleanedLocalBooks = [];
      localBooks.forEach(lb => {
        const canonical = normalizeBookKey(lb.title);
        if (!canonical) return;

        if (!existingCanonicals.has(canonical) && lb.id && !mergedMap.has(lb.id)) {
          existingCanonicals.add(canonical);
          const stats = reviewStatsMap.get(lb.id);
          const rCount = stats ? stats.count : (lb.ratingCount || 0);
          const rAvg = stats && stats.count > 0 ? Number((stats.sum / stats.count).toFixed(1)) : (Number(lb.ratingAverage ?? lb.rating) || 5.0);
          mergedMap.set(lb.id, sanitizeObject({
            ...lb,
            ratingCount: rCount,
            rating_count: rCount,
            ratingAverage: rAvg,
            rating: rAvg
          }));
          cleanedLocalBooks.push(lb);
        }
      });

      saveLocalBooks(cleanedLocalBooks);
      const finalBooks = Array.from(mergedMap.values());
      setRawBooks(finalBooks);

      if (error && finalBooks.length === 0) {
        setFetchError(error.message);
      }

      // Clean up remote duplicate rows if found (only once)
      if (duplicateRemoteIdsToDelete.length > 0 && !hasPrunedRef.current) {
        hasPrunedRef.current = true;
        supabase.from('books').delete().in('id', duplicateRemoteIdsToDelete).then(() => {
          console.log(`Pruned ${duplicateRemoteIdsToDelete.length} duplicate books from remote.`);
        }).catch(err => console.warn('Could not auto-prune duplicate books:', err));
      }
    } catch (err) {
      console.warn('Books fetch notice:', err?.message || err);
      setFetchError(err?.message || 'Fetch failed');
    } finally {
      isFinished = true;
      clearTimeout(timer);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    let debounceTimer = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchBooks(true), 1200);
    };

    const channel = supabase
      .channel('books_and_reviews_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, debouncedFetch)
      .subscribe();

    const onOnline = () => fetchBooks();
    window.addEventListener('online', onOnline);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const books = rawBooks.map(book => {
    const bookCategory = book.category_name || book.category || '';
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
      pages: Number(book.pages) || 0,
      downloads: book.downloads_count !== undefined ? Number(book.downloads_count) : (Number(book.downloads) || 0),
      downloads_count: book.downloads_count !== undefined ? Number(book.downloads_count) : (Number(book.downloads) || 0),
      year: book.year || (book.created_at ? new Date(book.created_at).getFullYear().toString() : new Date().getFullYear().toString()),
      rating: book.rating || 5.0,
      ratingCount: book.ratingCount || 0,
      rating_count: book.rating_count || 0,
      ratingAverage: book.ratingAverage || book.rating || 5.0,
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
        pages: Number(book.pages) > 0 ? Number(book.pages) : 0,
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

      // Prepare Supabase payload matching PostgreSQL schema
      let currentPayload = {
        title: fullBookObj.title,
        description: fullBookObj.description || fullBookObj.title || '',
        author: fullBookObj.author || '',
        category_name: fullBookObj.category_name || fullBookObj.category || '',
        pdf_url: fullBookObj.pdf_url || fullBookObj.link || '',
        cover_url: fullBookObj.cover_url || fullBookObj.coverUrl || '',
        pages: parseInt(fullBookObj.pages, 10) || 0,
        downloads_count: parseInt(fullBookObj.downloads_count ?? fullBookObj.downloads, 10) || 0,
        rating: Number(fullBookObj.rating) || 5.0,
        created_at: fullBookObj.created_at
      };

      if (isValidUUID(fullBookObj.id)) {
        currentPayload.id = fullBookObj.id;
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
        let updatePayload = {};
        if (dataToUpdate.title !== undefined) updatePayload.title = dataToUpdate.title;
        if (dataToUpdate.description !== undefined) updatePayload.description = dataToUpdate.description;
        if (dataToUpdate.author !== undefined) updatePayload.author = dataToUpdate.author;
        if (dataToUpdate.category !== undefined || dataToUpdate.category_name !== undefined) {
          updatePayload.category_name = dataToUpdate.category_name || dataToUpdate.category;
        }
        if (dataToUpdate.link !== undefined || dataToUpdate.pdf_url !== undefined) {
          updatePayload.pdf_url = dataToUpdate.pdf_url || dataToUpdate.link;
        }
        if (dataToUpdate.cover_url !== undefined || dataToUpdate.coverUrl !== undefined) {
          updatePayload.cover_url = dataToUpdate.cover_url || dataToUpdate.coverUrl;
        }
        if (dataToUpdate.pages !== undefined) updatePayload.pages = parseInt(dataToUpdate.pages, 10) || 0;
        if (dataToUpdate.downloads_count !== undefined || dataToUpdate.downloads !== undefined) {
          updatePayload.downloads_count = parseInt(dataToUpdate.downloads_count ?? dataToUpdate.downloads, 10) || 0;
        }
        if (dataToUpdate.rating !== undefined) updatePayload.rating = Number(dataToUpdate.rating) || 5.0;

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

  const incrementDownload = async (bookId) => {
    if (!bookId) return;
    try {
      // Optimistically update in state immediately
      setRawBooks(prev => prev.map(b => {
        if (b.id === bookId) {
          const nextCount = (Number(b.downloads_count ?? b.downloads) || 0) + 1;
          return {
            ...b,
            downloads: nextCount,
            downloads_count: nextCount
          };
        }
        return b;
      }));

      // Update cached local storage
      const locals = getStoredLocalBooks();
      const updatedLocals = locals.map(b => {
        if (b.id === bookId) {
          const nextCount = (Number(b.downloads_count ?? b.downloads) || 0) + 1;
          return {
            ...b,
            downloads: nextCount,
            downloads_count: nextCount
          };
        }
        return b;
      });
      saveLocalBooks(updatedLocals);

      // Persist to Supabase
      if (isValidUUID(bookId)) {
        const { data: curBook } = await supabase
          .from('books')
          .select('downloads_count')
          .eq('id', bookId)
          .maybeSingle();

        const currentDownloads = Number(curBook?.downloads_count || 0);
        const nextDownloads = currentDownloads + 1;

        const { error } = await supabase
          .from('books')
          .update({ downloads_count: nextDownloads })
          .eq('id', bookId);

        if (error) {
          console.warn('[incrementDownload] Notice:', error.message);
        }
      }
    } catch (err) {
      console.warn('[incrementDownload] Error:', err);
    }
  };

  return (
    <LibraryContext.Provider value={{ books, rawBooks, loading, error: fetchError, addBook, removeBook, updateBook, incrementDownload, fetchBooks, retryFetchBooks: fetchBooks }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
