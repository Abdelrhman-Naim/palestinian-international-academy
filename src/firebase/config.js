import { supabase } from '../supabase/client';

// Supabase compatibility layer for legacy Firebase references
export const db = {
  collection: (name) => name,
  doc: (col, id) => `${col}/${id}`,
};

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? { uid: session.user.id, email: session.user.email, ...session.user } : null);
    }).data.subscription.unsubscribe;
  }
};

export const storage = {
  ref: (path) => path
};

export default { db, auth, storage };
