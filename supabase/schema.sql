-- ========================================================
-- Supabase Schema for Palestinian International Academy (PIA)
-- Run this script inside the Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  specialization TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status column exists if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Automatic trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  u_role TEXT;
  u_status TEXT;
  u_approved BOOLEAN;
BEGIN
  u_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  IF u_role = 'instructor' THEN
    u_status := COALESCE(new.raw_user_meta_data->>'status', 'pending');
    u_approved := FALSE;
  ELSE
    u_status := 'active';
    u_approved := TRUE;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status, is_approved, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    u_role,
    u_status,
    u_approved,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    is_approved = EXCLUDED.is_approved;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  instructor_name TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  students_count INT DEFAULT 0,
  lessons_count INT DEFAULT 0,
  duration TEXT,
  level TEXT DEFAULT 'beginner',
  lessons JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT,
  cover_url TEXT,
  pdf_url TEXT,
  pages INT DEFAULT 0,
  downloads_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.course_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  student_email TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBMITTED ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.submitted_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  file_url TEXT,
  notes TEXT,
  grade NUMERIC,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXAM RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC,
  total NUMERIC,
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT
);

-- 10. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submitted_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies for courses, books, categories
DROP POLICY IF EXISTS "Allow public read courses" ON public.courses;
CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read books" ON public.books;
CREATE POLICY "Allow public read books" ON public.books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Default categories for Courses and Library
INSERT INTO public.categories (name, description, slug) VALUES
  ('برمجة', 'Programming', 'courses'),
  ('تصميم', 'Design', 'courses'),
  ('أمن سيبراني', 'Cybersecurity', 'courses'),
  ('إدارة أعمال', 'Business', 'courses'),
  ('كتب برمجية', 'Programming Books', 'library'),
  ('تصميم', 'Design', 'library'),
  ('شبكات', 'Networking', 'library')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read certificates" ON public.certificates;
CREATE POLICY "Allow public read certificates" ON public.certificates FOR SELECT USING (true);

-- Permissive write policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated insert courses" ON public.courses;
CREATE POLICY "Allow authenticated insert courses" ON public.courses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update courses" ON public.courses;
CREATE POLICY "Allow authenticated update courses" ON public.courses FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete courses" ON public.courses;
CREATE POLICY "Allow authenticated delete courses" ON public.courses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert books" ON public.books;
CREATE POLICY "Allow authenticated insert books" ON public.books FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update books" ON public.books;
CREATE POLICY "Allow authenticated update books" ON public.books FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete books" ON public.books;
CREATE POLICY "Allow authenticated delete books" ON public.books FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert profiles" ON public.profiles;
CREATE POLICY "Allow authenticated insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update profiles" ON public.profiles;
CREATE POLICY "Allow authenticated update profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete profiles" ON public.profiles;
CREATE POLICY "Allow authenticated delete profiles" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow authenticated requests" ON public.course_requests;
CREATE POLICY "Allow authenticated requests" ON public.course_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated assignments" ON public.assignments;
CREATE POLICY "Allow authenticated assignments" ON public.assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated submitted_assignments" ON public.submitted_assignments;
CREATE POLICY "Allow authenticated submitted_assignments" ON public.submitted_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated exam_results" ON public.exam_results;
CREATE POLICY "Allow authenticated exam_results" ON public.exam_results FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated certificates" ON public.certificates;
CREATE POLICY "Allow authenticated certificates" ON public.certificates FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated activity_logs" ON public.activity_logs FOR ALL USING (true);

-- Storage Buckets Configuration Note:
-- Create public buckets in Supabase Dashboard -> Storage:
-- 1. 'avatars'
-- 2. 'courses'
-- 3. 'books'
