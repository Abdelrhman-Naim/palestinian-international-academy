import { supabase } from '../supabase/client';

const LOCAL_PREFIX = 'pia_saved_books_';

function getLocalSavedBooks(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLocalSavedBooks(userId, list) {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${userId}`, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pia_saved_books_changed', { detail: { userId, list } }));
  } catch (e) {}
}

export async function toggleSaveBook(userId, book) {
  if (!userId || !book || !book.id) {
    throw new Error('User ID and valid Book object are required');
  }

  const bId = String(book.id);
  const localList = getLocalSavedBooks(userId);
  const existingLocalIndex = localList.findIndex(item => String(item.bookId || item.book_id || item.id) === bId);

  let isSaved = false;

  if (existingLocalIndex >= 0) {
    // Remove locally
    localList.splice(existingLocalIndex, 1);
    setLocalSavedBooks(userId, localList);
    isSaved = false;

    // Try Supabase delete in background
    try {
      await supabase
        .from('saved_books')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bId);
    } catch (e) {
      console.warn('Supabase delete saved_books warning:', e);
    }
  } else {
    // Add locally
    const newItem = {
      id: `saved_${Date.now()}_${bId}`,
      book_id: bId,
      bookId: bId,
      title: book.title || '',
      author: book.author || '',
      category: book.category || book.category_name || '',
      description: book.description || '',
      cover_url: book.cover_url || book.coverUrl || '',
      coverUrl: book.coverUrl || book.cover_url || '',
      downloads: book.downloads || book.downloads_count || 0,
      downloads_count: book.downloads_count || book.downloads || 0,
      rating: book.rating || 5.0,
      ratingAverage: book.ratingAverage || book.rating || 5.0,
      saved_at: new Date().toISOString()
    };
    localList.unshift(newItem);
    setLocalSavedBooks(userId, localList);
    isSaved = true;

    // Try Supabase insert in background
    try {
      await supabase.from('saved_books').upsert({
        user_id: userId,
        book_id: bId,
        title: newItem.title,
        author: newItem.author,
        category: newItem.category,
        description: newItem.description
      }, { onConflict: 'user_id,book_id' });
    } catch (e) {
      console.warn('Supabase insert saved_books warning:', e);
    }
  }

  return { saved: isSaved };
}

export async function isBookSaved(userId, bookId) {
  if (!userId || !bookId) return false;
  const bId = String(bookId);
  const localList = getLocalSavedBooks(userId);
  const foundLocal = localList.some(item => String(item.bookId || item.book_id || item.id) === bId);
  if (foundLocal) return true;

  try {
    const { data } = await supabase
      .from('saved_books')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bId)
      .maybeSingle();

    return Boolean(data);
  } catch (e) {
    return false;
  }
}

export async function removeSavedBook(userId, bookId) {
  if (!userId || !bookId) return;
  const bId = String(bookId);
  const localList = getLocalSavedBooks(userId);
  const updated = localList.filter(item => String(item.bookId || item.book_id || item.id) !== bId);
  setLocalSavedBooks(userId, updated);

  try {
    await supabase.from('saved_books').delete().eq('user_id', userId).eq('book_id', bId);
  } catch (e) {
    console.warn('Supabase remove saved book warning:', e);
  }
}

export function listenToUserSavedBooks(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // 1. Immediately emit local data for instant responsive UI
  const localData = getLocalSavedBooks(userId);
  callback(localData);

  // 2. Event listener for local storage events across tabs or components
  const handleLocalChange = (e) => {
    if (e.detail?.userId === userId) {
      callback(e.detail.list);
    }
  };
  window.addEventListener('pia_saved_books_changed', handleLocalChange);

  // 3. Sync from Supabase
  const syncRemote = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_books')
        .select('*')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const remoteFormatted = data.map(item => ({
          ...item,
          bookId: String(item.book_id || item.bookId || item.id),
          id: item.id
        }));

        // Merge remote + local ensuring no loss of offline saves
        const mergedMap = new Map();
        remoteFormatted.forEach(item => mergedMap.set(String(item.bookId), item));
        getLocalSavedBooks(userId).forEach(item => {
          const key = String(item.bookId || item.book_id || item.id);
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        setLocalSavedBooks(userId, mergedList);
        callback(mergedList);
      }
    } catch (e) {
      console.warn('Supabase saved_books sync note:', e);
    }
  };

  syncRemote();

  // 4. Real-time Supabase subscription
  let channel = null;
  try {
    channel = supabase
      .channel(`saved_books_realtime_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_books' }, () => {
        syncRemote();
      })
      .subscribe();
  } catch (e) {}

  return () => {
    window.removeEventListener('pia_saved_books_changed', handleLocalChange);
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
