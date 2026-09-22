import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { sanitizeObject } from '../utils/sanitize';

const CoursesContext = createContext(null);

const LOCAL_STORAGE_KEY = 'local_custom_courses';

const getStoredLocalCourses = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalCourses = (coursesArr) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(coursesArr));
  } catch (e) {}
};

const isValidUUID = (str) => {
  if (!str) return false;
  const s = String(str);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || /^\d+$/.test(s);
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

      const localCourses = getStoredLocalCourses();
      let remoteCourses = [];

      if (error) {
        console.warn('Error fetching courses from Supabase:', error.message);
      } else if (data) {
        remoteCourses = data.map(item => sanitizeObject(item));
      }

      // Merge remote + local custom courses
      const mergedMap = new Map();
      remoteCourses.forEach(rc => {
        if (rc.id) mergedMap.set(rc.id, rc);
      });
      localCourses.forEach(lc => {
        if (lc.id && !mergedMap.has(lc.id)) {
          mergedMap.set(lc.id, sanitizeObject(lc));
        }
      });

      setRawCourses(Array.from(mergedMap.values()));
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

      const courseId = (courseData.id && isValidUUID(courseData.id)) ? courseData.id : generateUUID();
      const fullCourseObj = {
        ...courseData,
        id: courseId
      };

      if (fullCourseObj.title) fullCourseObj.title_en = await safeTranslate(fullCourseObj.title);
      if (fullCourseObj.description) fullCourseObj.description_en = await safeTranslate(fullCourseObj.description);
      if (fullCourseObj.instructor) fullCourseObj.instructor_en = await safeTranslate(fullCourseObj.instructor);
      if (fullCourseObj.category) fullCourseObj.category_en = await safeTranslate(fullCourseObj.category);
      if (fullCourseObj.level) fullCourseObj.level_en = await safeTranslate(fullCourseObj.level);
      if (fullCourseObj.goals) fullCourseObj.goals_en = await Promise.all((fullCourseObj.goals || []).map(g => safeTranslate(g)));
      if (fullCourseObj.lectures) {
        fullCourseObj.lectures = await Promise.all((fullCourseObj.lectures || []).map(async lec => {
          return { ...lec, title_en: await safeTranslate(lec.title) };
        }));
      }

      fullCourseObj.created_at = fullCourseObj.created_at || new Date().toISOString();

      // Dynamic Auto-Repair Insert Loop for Supabase
      let currentPayload = { ...fullCourseObj };
      delete currentPayload.avatar;
      delete currentPayload.sessions;
      delete currentPayload.instructorId;
      delete currentPayload.lecturesCount;
      delete currentPayload.imageName;

      // Ensure id in payload is a valid UUID, otherwise let Supabase auto-generate
      if (!isValidUUID(currentPayload.id)) {
        delete currentPayload.id;
      }

      if (!currentPayload.instructor_id && fullCourseObj.instructorId) {
        currentPayload.instructor_id = fullCourseObj.instructorId;
      }

      // Convert non-numeric price string (like 'Free') to 0 if column is numeric
      if (currentPayload.price === 'Free' || isNaN(Number(currentPayload.price))) {
        currentPayload.price = 0;
      }

      let createdCourse = null;

      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const { data, error } = await supabase
            .from('courses')
            .insert([currentPayload])
            .select()
            .single();

          if (!error && data) {
            createdCourse = { ...fullCourseObj, ...data };
            break;
          }

          if (error) {
            console.warn(`[addCourse attempt ${attempt + 1}] Notice:`, error.message);
            // Dynamic column stripping if PostgREST complains about unknown columns
            const match = error.message?.match(/Could not find the '([^']+)' column/i);
            if (match && match[1]) {
              const badCol = match[1];
              delete currentPayload[badCol];
              continue; // Retry loop without the missing column!
            }

            // If PostgREST complains about numeric type syntax error (e.g. price)
            if (error.message?.includes('type numeric')) {
              delete currentPayload.price;
              continue;
            }

            break;
          }
        } catch (e) {
          console.warn('[addCourse insert catch]:', e);
          break;
        }
      }

      if (!createdCourse) {
        createdCourse = fullCourseObj;
      }

      // Save to local storage for local persistence guarantee
      const existingLocals = getStoredLocalCourses();
      saveLocalCourses([createdCourse, ...existingLocals.filter(c => c.id !== createdCourse.id)]);

      // Optimistically update React state immediately
      setRawCourses(prev => {
        const sanitized = sanitizeObject(createdCourse);
        return [sanitized, ...prev.filter(c => c.id !== sanitized.id)];
      });

      return { ok: true, id: createdCourse.id };
    } catch (err) {
      console.error("Error adding course:", err);
      return { ok: false };
    }
  };

  const removeCourse = async (id) => {
    try {
      // Optimistic state update & local storage update
      setRawCourses(prev => prev.filter(c => c.id !== id));
      const existingLocals = getStoredLocalCourses();
      saveLocalCourses(existingLocals.filter(c => c.id !== id));

      // Only attempt remote delete in Supabase if id is a valid UUID/numeric ID in Postgres
      if (isValidUUID(id)) {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn("Supabase course delete notice:", error.message);
        }
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

      // Optimistic state update & local storage update
      setRawCourses(prev => prev.map(c => c.id === id ? sanitizeObject({ ...c, ...dataToUpdate }) : c));
      const existingLocals = getStoredLocalCourses();
      saveLocalCourses(existingLocals.map(c => c.id === id ? { ...c, ...dataToUpdate } : c));

      if (isValidUUID(id)) {
        // Payload cleanup for Supabase
        const payload = { ...dataToUpdate };
        delete payload.avatar;
        delete payload.sessions;
        delete payload.instructorId;
        delete payload.lecturesCount;

        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', id);

        if (error) {
          console.warn("Supabase course update notice:", error.message);
        }
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
