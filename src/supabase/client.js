import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing from environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global table router proxy to map legacy collection names to Supabase tables
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  let mapped = table;
  if (table === 'users') mapped = 'profiles';
  if (table === 'submissions') mapped = 'submitted_assignments';
  if (table === 'exam_attempts') mapped = 'exam_results';
  return originalFrom(mapped);
};

