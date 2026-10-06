import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://erdogjeyqxufpsczriat.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_stz6G3e9pbCTRpRCq_miOA_lmIORu-m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 2000, 30000),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Auto-manage realtime connection state on network status changes to avoid websocket error spam
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    try {
      supabase.realtime?.disconnect();
    } catch (_) {}
  });

  window.addEventListener('online', () => {
    try {
      supabase.realtime?.connect();
    } catch (_) {}
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      supabase.realtime?.disconnect();
    } catch (_) {}
  }
}

// Global table router proxy to map legacy collection names to Supabase tables
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  let mapped = table;
  if (table === 'users') mapped = 'profiles';
  if (table === 'submissions') mapped = 'submitted_assignments';
  if (table === 'exam_attempts') mapped = 'exam_results';
  return originalFrom(mapped);
};

