import { supabase } from '../supabase/client';

export async function toggleSaveBook(userId, book) {
  if (!userId || !book || !book.id) {
    throw new Error('User ID and valid Book object are required');
  }

  const { data: existing } = await supabase
    .from('saved_books')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', book.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_books').delete().eq('id', existing.id);
    return { saved: false };
  } else {
    await supabase.from('saved_books').insert([{
      user_id: userId,
      book_id: book.id,
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      description: book.description || ''
    }]);
    return { saved: true };
  }
}

export async function isBookSaved(userId, bookId) {
  if (!userId || !bookId) return false;
  const { data } = await supabase
    .from('saved_books')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();

  return Boolean(data);
}

export async function removeSavedBook(userId, bookId) {
  if (!userId || !bookId) return;
  await supabase.from('saved_books').delete().eq('user_id', userId).eq('book_id', bookId);
}

export function listenToUserSavedBooks(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const fetchSaved = async () => {
    const { data } = await supabase
      .from('saved_books')
      .select('*')
      .eq('user_id', userId);

    const formatted = (data || []).map(item => ({
      ...item,
      bookId: item.book_id || item.bookId || item.id,
      id: item.id
    }));

    callback(formatted);
  };

  fetchSaved();

  const channel = supabase
    .channel(`saved_books_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_books' }, () => {
      fetchSaved();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
