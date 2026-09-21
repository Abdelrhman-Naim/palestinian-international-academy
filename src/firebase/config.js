import { supabase } from '../supabase/client';

// Supabase compatibility bridge for legacy Firebase references
export const db = {
  collection: (name) => ({ _table: name }),
  doc: (col, id) => ({ _table: col, _id: id }),
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

export const collection = (dbObj, tableName) => {
  const table = typeof dbObj === 'string' ? dbObj : tableName;
  return { _table: table || 'courses' };
};

export const doc = (dbObj, tableName, id) => {
  if (typeof dbObj === 'string' && tableName) {
    return { _table: dbObj, _id: tableName };
  }
  if (dbObj && dbObj._table) {
    return { _table: dbObj._table, _id: tableName };
  }
  return { _table: tableName || 'courses', _id: id };
};

export const query = (target, ...clauses) => {
  const table = target?._table || 'courses';
  const filters = (clauses || []).filter(c => c && c.type === 'where');
  return { _table: table, filters };
};

export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, direction) => ({ type: 'orderBy', field, direction });
export const limit = (count) => ({ type: 'limit', count });
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n) => n;
export const arrayUnion = (...items) => items;
export const arrayRemove = (...items) => items;

export const getDocs = async (target) => {
  const table = target?._table || 'courses';
  try {
    let q = supabase.from(table).select('*');
    if (target?.filters) {
      target.filters.forEach(f => {
        if (f.op === '==') q = q.eq(f.field, f.value);
        if (f.op === '!=') q = q.neq(f.field, f.value);
        if (f.op === 'in') q = q.in(f.field, f.value);
      });
    }
    const { data, error } = await q;
    if (error) throw error;
    const docs = (data || []).map(d => ({
      id: d.id,
      data: () => d,
      exists: () => true
    }));
    return {
      size: docs.length,
      empty: docs.length === 0,
      docs
    };
  } catch (e) {
    console.warn(`[Supabase Bridge] getDocs error on table ${table}:`, e);
    return { size: 0, empty: true, docs: [] };
  }
};

export const getDoc = async (target) => {
  const table = target?._table || 'courses';
  const id = target?._id;
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return {
      exists: () => Boolean(data),
      data: () => data || {},
      id
    };
  } catch (e) {
    console.warn(`[Supabase Bridge] getDoc error on table ${table}/${id}:`, e);
    return { exists: () => false, data: () => ({}), id };
  }
};

export const onSnapshot = (target, callback, errorCb) => {
  let isSubscribed = true;
  getDocs(target).then(res => {
    if (isSubscribed && typeof callback === 'function') {
      callback(res);
    }
  }).catch(err => {
    if (isSubscribed && typeof errorCb === 'function') {
      errorCb(err);
    }
  });

  return () => {
    isSubscribed = false;
  };
};

export const setDoc = async (docRef, data) => {
  const table = docRef?._table;
  const id = docRef?._id;
  if (!table) return { ok: false };
  try {
    const record = { ...data };
    if (id) record.id = id;
    const { error } = await supabase.from(table).upsert(record);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] setDoc error on table ${table}:`, e);
    return { ok: false, error: e };
  }
};

export const updateDoc = async (docRef, data) => {
  const table = docRef?._table;
  const id = docRef?._id;
  if (!table || !id) return { ok: false };
  try {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] updateDoc error on table ${table}/${id}:`, e);
    return { ok: false, error: e };
  }
};

export const deleteDoc = async (docRef) => {
  const table = docRef?._table;
  const id = docRef?._id;
  if (!table || !id) return { ok: false };
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] deleteDoc error on table ${table}/${id}:`, e);
    return { ok: false, error: e };
  }
};

export const addDoc = async (colRef, data) => {
  const table = colRef?._table;
  if (!table) return { id: 'error' };
  try {
    const { data: res, error } = await supabase.from(table).insert(data).select('id').single();
    if (error) throw error;
    return { id: res?.id || 'new-id' };
  } catch (e) {
    console.warn(`[Supabase Bridge] addDoc error on table ${table}:`, e);
    return { id: 'error' };
  }
};

export default { db, auth, storage };
