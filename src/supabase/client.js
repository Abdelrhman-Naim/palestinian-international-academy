import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing from environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global table router proxy to prevent 404s on legacy or non-existent tables
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  let mapped = table;
  if (table === 'enrollments') mapped = 'course_requests';
  if (table === 'users') mapped = 'profiles';
  if (table === 'submissions') mapped = 'submitted_assignments';
  return originalFrom(mapped);
};

