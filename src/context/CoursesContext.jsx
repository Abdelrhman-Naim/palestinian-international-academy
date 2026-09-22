import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [rawCourses, setRawCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const [featuredCourseConfig, setFeaturedCourseConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('hero_featured_course');
      return saved ? JSON.parse(saved) : { courseId: '', progress: 82, completedLessons: 12, customLabel: '' };
    } catch (e) {
      return { courseId: '', progress: 82, completedLessons: 12, customLabel: '' };
    }
  });

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching courses from Supabase:', error.message);
      } else if (data) {
        const sanitized = data.map(item => sanitizeObject(item));
        setRawCourses(sanitized);
      }
    } catch (err) {
      console.warn('Courses fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    // Set up real-time subscription for courses table
    const channel = supabase
      .channel('courses_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        fetchCourses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateFeaturedCourse = async (config) => {
    try {
      setFeaturedCourseConfig(prev => ({ ...prev, ...config }));
      try {
        localStorage.setItem('hero_featured_course', JSON.stringify({ ...featuredCourseConfig, ...config }));
      } catch (e) {}
      return { ok: true };
    } catch (err) {
      console.error('Error updating hero featured course:', err);
      return { ok: true };
    }
  };

  const fallbackEnTranslations = {
    'فوتوشوب': 'Photoshop Masterclass',
    'تطوير الويب': 'Web Development',
    'هندسة البرمجيات': 'Software Engineering',
    'الأمن السيبراني': 'Cybersecurity Fundamentals',
    'الذكاء الاصطناعي': 'Artificial Intelligence & ML',
    'تصميم واجهات المستخدم': 'UI/UX Design',
    'عبدالرحمن نعيم': 'Abdelrahman Naeim',
    'عبدالرحمن': 'Abdelrahman',
    'مبتدئ': 'Beginner',
    'متوسط': 'Intermediate',
    'متقدم': 'Advanced',
    'جميع المستويات': 'All Levels',
  };

  const getEnField = (val, valEn) => {
    if (valEn) return valEn;
    if (val && fallbackEnTranslations[val]) return fallbackEnTranslations[val];
    return val;
  };

  const courses = rawCourses.map(course => {
    const mapped = {
      ...course,
      title: lang === 'en' ? getEnField(course.title, course.title_en) : course.title,
      description: lang === 'en' ? (course.description_en || course.description) : course.description,
      instructor: lang === 'en' ? getEnField(course.instructor || course.instructor_name, course.instructor_en) : (course.instructor || course.instructor_name),
      category: lang === 'en' ? getEnField(course.category || course.category_name, course.category_en) : (course.category || course.category_name),
      level: lang === 'en' ? getEnField(course.level, course.level_en) : course.level,
      goals: lang === 'en' && course.goals_en && course.goals_en.length === (course.goals || []).length ? course.goals_en : course.goals,
      lectures: (course.lectures || course.lessons || course.sessions || []).map(lec => ({
        ...lec,
        title: lang === 'en' ? (lec.title_en || lec.title) : lec.title
      })),
      originalData: course
    };
    return mapped;
  });

  const addCourse = async (courseData) => {
    try {
      const safeTranslate = async (str) => {
        if (!str) return str;
        try {
          return await translateText(str);
        } catch (e) {
          return str;
        }
      };

      const payload = { ...courseData };
      delete payload.avatar;
      delete payload.sessions;

      if (payload.title) payload.title_en = await safeTranslate(payload.title);
      if (payload.description) payload.description_en = await safeTranslate(payload.description);
      if (payload.instructor) payload.instructor_en = await safeTranslate(payload.instructor);
      if (payload.category) payload.category_en = await safeTranslate(payload.category);
      if (payload.level) payload.level_en = await safeTranslate(payload.level);
      if (payload.goals) payload.goals_en = await Promise.all((payload.goals || []).map(g => safeTranslate(g)));
      if (payload.lectures) {
        payload.lectures = await Promise.all((payload.lectures || []).map(async lec => {
          return { ...lec, title_en: await safeTranslate(lec.title) };
        }));
      }

      payload.created_at = payload.created_at || new Date().toISOString();

      let createdCourse = null;

      // 1. Try Supabase insert
      try {
        const { data, error } = await supabase
          .from('courses')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          createdCourse = data;
        } else if (error) {
          console.warn("Supabase course insert notice:", error.message);
          // If error is schema column error, retry with clean standard schema payload
          if (error.message?.includes('column')) {
            const cleanPayload = {
              title: payload.title,
              title_en: payload.title_en,
              description: payload.description,
              description_en: payload.description_en,
              instructor: payload.instructor,
              instructor_id: payload.instructor_id || payload.instructorId,
              category: payload.category,
              icon: payload.icon || 'code',
              level: payload.level,
              goals: payload.goals,
              lectures: payload.lectures,
              price: payload.price || 'Free',
              status: payload.status || 'published',
              students: payload.students || 0,
              created_at: payload.created_at
            };
            const retryRes = await supabase.from('courses').insert([cleanPayload]).select().single();
            if (!retryRes.error && retryRes.data) {
              createdCourse = retryRes.data;
            }
          }
        }
      } catch (sbErr) {
        console.warn("Supabase course insert catch:", sbErr);
      }

      // If Supabase insert returned no data, use payload with fallback id
      if (!createdCourse) {
        createdCourse = {
          ...payload,
          id: payload.id || `course_${Date.now()}`
        };
      }

      // 2. Optimistically update local React state immediately so course appears on screen instantly
      setRawCourses(prev => {
        const sanitized = sanitizeObject(createdCourse);
        return [sanitized, ...prev.filter(c => c.id !== sanitized.id)];
      });

      // Refetch from Supabase in background to sync
      fetchCourses().catch(() => {});

      return { ok: true, id: createdCourse.id };
    } catch (err) {
      console.error("Error adding course to Supabase:", err);
      return { ok: false };
    }
  };

  const removeCourse = async (id) => {
    try {
      // Optimistic state update
      setRawCourses(prev => prev.filter(c => c.id !== id));

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn("Supabase course delete notice:", error.message);
      }

      fetchCourses().catch(() => {});
    } catch (err) {
      console.error("Error deleting course from Supabase:", err);
    }
  };

  const updateCourse = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;

      dataToUpdate.updated_at = new Date().toISOString();

      // Optimistic state update
      setRawCourses(prev => prev.map(c => c.id === id ? sanitizeObject({ ...c, ...dataToUpdate }) : c));

      const { error } = await supabase
        .from('courses')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) {
        console.warn("Supabase course update notice:", error.message);
      }

      fetchCourses().catch(() => {});
      return { ok: true };
    } catch (err) {
      console.error("Error updating course in Supabase:", err);
      return { ok: false };
    }
  };

  return (
    <CoursesContext.Provider value={{ 
      courses, 
      rawCourses, 
      loading, 
      addCourse, 
      removeCourse, 
      updateCourse, 
      featuredCourseConfig, 
      updateFeaturedCourse 
    }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
