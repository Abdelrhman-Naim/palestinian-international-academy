import { supabase } from '../supabase/client';

// Supabase compatibility bridge for legacy Firebase references
export const db = {
  collection: (name) => name,
  doc: (col, id) => `${col}/${id}`,
};

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? { uid: session.user.id, email: session.user.email, ...session.user } : null);
    });
    return subscription?.unsubscribe || (() => {});
  }
};

export const storage = {
  ref: (path) => path
};

// Helper mock functions for firestore compatibility if imported directly
export const collection = (dbObj, tableName) => ({ _table: tableName });
export const doc = (dbObj, tableName, id) => ({ _table: tableName, _id: id });
export const query = (target) => target;
export const where = () => {};
export const orderBy = () => {};
export const limit = () => {};
export const serverTimestamp = () => new Date().toISOString();

export const getDocs = async (target) => {
  const table = target?._table || 'courses';
  try {
    const { data } = await supabase.from(table).select('*');
    return {
      size: data?.length || 0,
      empty: !data || data.length === 0,
      docs: (data || []).map(d => ({ id: d.id, data: () => d }))
    };
  } catch (e) {
    return { size: 0, empty: true, docs: [] };
  }
};

export const getDoc = async (target) => {
  const table = target?._table || 'courses';
  const id = target?._id;
  try {
    const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    return {
      exists: () => Boolean(data),
      data: () => data || {},
      id
    };
  } catch (e) {
    return { exists: () => false, data: () => ({}) };
  }
};

export const onSnapshot = (target, callback) => {
  if (typeof callback === 'function') {
    callback({ docs: [], size: 0, empty: true, exists: () => false, data: () => ({}) });
  }
  return () => {};
};

export const setDoc = async () => ({ ok: true });
export const updateDoc = async () => ({ ok: true });
export const deleteDoc = async () => ({ ok: true });
export const addDoc = async () => ({ id: 'new-id' });

export default { db, auth, storage };
