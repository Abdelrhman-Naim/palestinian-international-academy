"use client";
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
      if (saved) {
        const parsed = JSON.parse(saved);
        const total = Math.max(1, Number(parsed.totalLessons) || 10);
        const completed = Math.max(0, Math.min(total, Number(parsed.completedLessons ?? 8)));
        const progress = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
        return {
          ...parsed,
          totalLessons: total,
          completedLessons: completed,
          progress: parsed.progress !== undefined ? Math.min(100, Number(parsed.progress)) : progress
        };
      }
      return { courseId: '', progress: 80, completedLessons: 8, totalLessons: 10, customLabel: '' };
    } catch (e) {
      return { courseId: '', progress: 80, completedLessons: 8, totalLessons: 10, customLabel: '' };
    }
  });

  const fetchCourses = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      const local = getStoredLocalCourses();
      if (local && local.length > 0) {
        setCourses(local);
      }
      return;
    }

    try {
      const [{ data, error }, { data: reviewRows }] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('target_id, rating')
          .eq('target_type', 'course')
      ]);

      const reviewStatsMap = new Map();
      (reviewRows || []).forEach(r => {
        if (!r.target_id) return;
        if (!reviewStatsMap.has(r.target_id)) {
          reviewStatsMap.set(r.target_id, { count: 0, sum: 0 });
        }
        const s = reviewStatsMap.get(r.target_id);
        s.count += 1;
        s.sum += Number(r.rating || 5);
      });

      const localCourses = getStoredLocalCourses();
      let remoteCourses = [];

      if (error) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          console.warn('Error fetching courses from Supabase:', error.message);
        }
      } else if (data) {
        remoteCourses = data.map(item => {
          const stats = reviewStatsMap.get(item.id);
          const rCount = stats ? stats.count : 0;
          const rAvg = rCount > 0 ? Number((stats.sum / rCount).toFixed(1)) : 0;
          return sanitizeObject({
            ...item,
            ratingCount: rCount,
            rating_count: rCount,
            ratingAverage: rAvg,
            rating: rAvg
          });
        });
      }

      // Merge remote + local custom courses avoiding duplicates by id or title
      const mergedMap = new Map();
      const existingTitles = new Set();

      remoteCourses.forEach(rc => {
        if (rc.id) mergedMap.set(rc.id, rc);
        if (rc.title) existingTitles.add(rc.title.trim().toLowerCase());
      });

      const unsyncedCourses = [];
      localCourses.forEach(lc => {
        const titleKey = (lc.title || '').trim().toLowerCase();
        if (lc.id && !mergedMap.has(lc.id) && !existingTitles.has(titleKey)) {
          const stats = reviewStatsMap.get(lc.id);
          const rCount = stats ? stats.count : (lc.ratingCount || 0);
          const rAvg = stats && stats.count > 0 ? Number((stats.sum / stats.count).toFixed(1)) : (rCount > 0 ? (Number(lc.ratingAverage ?? lc.rating) || 0) : 0);
          mergedMap.set(lc.id, sanitizeObject({
            ...lc,
            ratingCount: rCount,
            rating_count: rCount,
            ratingAverage: rAvg,
            rating: rAvg
          }));
          existingTitles.add(titleKey);
          unsyncedCourses.push(lc);
        }
      });

      setRawCourses(Array.from(mergedMap.values()));

      // Auto-sync unsynced local courses to Supabase in background
      if (unsyncedCourses.length > 0) {
        (async () => {
          for (const c of unsyncedCourses) {
            try {
              const payload = {
                title: c.title,
                description: c.description || c.title || '',
                price: isNaN(Number(c.price)) ? 0 : Number(c.price),
                category_name: c.category || c.category_name || '',
                category: c.category || c.category_name || '',
                instructor_name: c.instructor || c.instructor_name || '',
                instructor: c.instructor || c.instructor_name || '',
                image_url: c.image_url || c.imageUrl || '',
                level: c.level || 'beginner',
                is_published: c.is_published !== false,
                status: c.status || 'مستمرة',
                lessons: c.lessons || c.lectures || [],
                lectures: c.lessons || c.lectures || [],
                created_at: c.created_at || new Date().toISOString()
              };
              await supabase.from('courses').insert([payload]);
            } catch (syncErr) {
              console.warn('Auto-sync course error:', syncErr);
            }
          }
        })();
      }
    } catch (err) {
      console.warn('Courses fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    const handleOnline = () => {
      fetchCourses();
    };
    window.addEventListener('online', handleOnline);

    // Set up real-time subscription for courses and reviews table
    const channel = supabase
      .channel('courses_and_reviews_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        fetchCourses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchCourses();
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateFeaturedCourse = async (config) => {
    try {
      setFeaturedCourseConfig(prev => {
        const merged = { ...prev, ...config };
        const total = Math.max(1, Number(merged.totalLessons) || 10);
        const completed = Math.max(0, Math.min(total, Number(merged.completedLessons ?? 8)));
        const progress = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
        const safeConfig = {
          ...merged,
          totalLessons: total,
          completedLessons: completed,
          progress: config.progress !== undefined ? Math.min(100, Number(config.progress)) : progress
        };
        try {
          localStorage.setItem('hero_featured_course', JSON.stringify(safeConfig));
        } catch (e) {}
        return safeConfig;
      });
      return { ok: true };
    } catch (err) {
      console.error('Error updating hero featured course:', err);
      return { ok: true };
    }
  };

  const fallbackEnTranslations = {
    'مقدمة في React': 'Introduction to React',
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

  const fallbackArTranslations = {
    'Introduction to React': 'مقدمة في React',
    'Advanced React': 'احتراف React المتقدم',
    'Advanced React Patterns': 'أنماط React المتقدمة',
    'Full Stack Web Development': 'تطوير الويب المتكامل',
    'UI/UX Design': 'تصميم واجهات المستخدم',
    'UI/UX Design Masterclass': 'دورة تصميم واجهات المستخدم الشاملة',
    'Python for Beginners': 'بايثون للمبتدئين',
    'Python Programming': 'برمجة بايثون',
    'Photoshop Masterclass': 'دورة فوتوشوب الشاملة',
    'Web Development': 'تطوير الويب',
    'Software Engineering': 'هندسة البرمجيات',
    'Cybersecurity Fundamentals': 'أساسيات الأمن السيبراني',
    'Artificial Intelligence & ML': 'الذكاء الاصطناعي وتعلم الآلة',
    'Beginner': 'مبتدئ',
    'Intermediate': 'متوسط',
    'Advanced': 'متقدم',
    'All Levels': 'جميع المستويات',
  };

  const getEnField = (val, valEn) => {
    if (valEn) return valEn;
    if (val && fallbackEnTranslations[val]) return fallbackEnTranslations[val];
    return val;
  };

  const getArField = (val, valAr) => {
    if (valAr) return valAr;
    if (val && fallbackArTranslations[val]) return fallbackArTranslations[val];
    return val;
  };

  const courses = rawCourses.map(course => {
    const rawPrice = course.price;
    const numPrice = Number(rawPrice);
    const parsedPrice = (!rawPrice || rawPrice === 'Free' || rawPrice === 'free' || isNaN(numPrice) || numPrice <= 0) ? 0 : numPrice;
    const isPaid = parsedPrice > 0;
    const mapped = {
      ...course,
      price: parsedPrice,
      isPaid,
      is_paid: isPaid,
      title: lang === 'en' ? getEnField(course.title, course.title_en) : getArField(course.title, course.title_ar),
      description: lang === 'en' ? (course.description_en || course.description) : (course.description_ar || course.description),
      instructor: lang === 'en' ? getEnField(course.instructor || course.instructor_name, course.instructor_en) : getArField(course.instructor || course.instructor_name, course.instructor_ar),
      category: lang === 'en' ? getEnField(course.category || course.category_name, course.category_en) : getArField(course.category || course.category_name, course.category_ar),
      level: lang === 'en' ? getEnField(course.level, course.level_en) : getArField(course.level, course.level_ar),
      goals: lang === 'en' && course.goals_en && course.goals_en.length === (course.goals || []).length ? course.goals_en : course.goals,
      lectures: (course.lectures || course.lessons || course.sessions || []).map(lec => ({
        ...lec,
        title: lang === 'en' ? (lec.title_en || lec.title) : (lec.title_ar || lec.title)
      })),
      rating: (course.ratingCount > 0 || course.rating_count > 0) ? (course.rating || course.ratingAverage || 0) : 0,
      ratingCount: course.ratingCount || 0,
      rating_count: course.rating_count || 0,
      ratingAverage: (course.ratingCount > 0 || course.rating_count > 0) ? (course.ratingAverage || course.rating || 0) : 0,
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
      const sessionsList = courseData.sessions || courseData.lectures || courseData.lessons || [];
      const normalizedSessions = sessionsList.map((s, idx) => ({
        number: s.number || idx + 1,
        title: s.title || s.name || '',
        link: s.link || s.url || s.videoUrl || ''
      }));

      const rawPrice = courseData.price;
      const numPrice = Number(rawPrice);
      const parsedPrice = (!rawPrice || rawPrice === 'Free' || rawPrice === 'free' || isNaN(numPrice) || numPrice <= 0) ? 0 : numPrice;
      const isPaid = parsedPrice > 0;
      const plannedLessonsCount = Math.max(Number(courseData.lecturesCount || courseData.lessons_count) || 0, normalizedSessions.length || 1);

      const fullCourseObj = {
        ...courseData,
        id: courseId,
        price: parsedPrice,
        isPaid,
        is_paid: isPaid,
        instructor: courseData.instructor || courseData.instructor_name || '',
        instructor_name: courseData.instructor || courseData.instructor_name || '',
        category: courseData.category || courseData.category_name || '',
        category_name: courseData.category || courseData.category_name || '',
        lectures: normalizedSessions,
        lessons: normalizedSessions,
        sessions: normalizedSessions,
        lessons_count: plannedLessonsCount,
        lecturesCount: plannedLessonsCount,
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
        fullCourseObj.lessons = fullCourseObj.lectures;
        fullCourseObj.sessions = fullCourseObj.lectures;
      }

      fullCourseObj.created_at = fullCourseObj.created_at || new Date().toISOString();

      // Dynamic Auto-Repair Insert Loop for Supabase
      const COURSE_VALID_COLUMNS = new Set([
        'id', 'title', 'title_en', 'description', 'description_en',
        'price', 'category', 'category_name', 'category_id', 'category_en',
        'instructor', 'instructor_name', 'instructor_id', 'instructor_en',
        'image_url', 'image_name', 'avatar', 'rating', 'students', 'students_count',
        'lessons_count', 'duration', 'level', 'level_en',
        'lessons', 'lectures', 'sessions', 'goals', 'goals_en',
        'is_published', 'status', 'icon', 'created_at', 'updated_at'
      ]);

      const filteredPayload = {};
      for (const [key, val] of Object.entries(fullCourseObj)) {
        if (COURSE_VALID_COLUMNS.has(key) && key !== 'isPaid' && key !== 'is_paid') {
          filteredPayload[key] = val;
        }
      }
      filteredPayload.instructor_name = fullCourseObj.instructor;
      filteredPayload.category_name = fullCourseObj.category;
      filteredPayload.lessons = fullCourseObj.lessons;
      filteredPayload.lectures = fullCourseObj.lectures;
      filteredPayload.sessions = fullCourseObj.lectures;
      filteredPayload.status = fullCourseObj.status || 'مستمرة';
      filteredPayload.lessons_count = plannedLessonsCount;

      if (!filteredPayload.instructor_id && (fullCourseObj.instructorId || fullCourseObj.instructor_id)) {
        filteredPayload.instructor_id = fullCourseObj.instructorId || fullCourseObj.instructor_id;
      }

      // Ensure id in payload is a valid UUID, otherwise let Supabase auto-generate
      if (!isValidUUID(filteredPayload.id)) {
        delete filteredPayload.id;
      }

      // Convert non-numeric price string (like 'Free') to 0 if column is numeric
      if (filteredPayload.price === 'Free' || isNaN(Number(filteredPayload.price))) {
        filteredPayload.price = 0;
      } else {
        filteredPayload.price = Number(filteredPayload.price) || 0;
      }

      let currentPayload = { ...filteredPayload };
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

      // Normalize sessions / lectures / lessons
      const sess = dataToUpdate.sessions || dataToUpdate.lectures || dataToUpdate.lessons;
      if (sess && Array.isArray(sess)) {
        const normalized = sess.map((s, idx) => ({
          number: s.number || idx + 1,
          title: s.title || s.name || '',
          link: s.link || s.url || s.videoUrl || s.video_url || ''
        }));
        dataToUpdate.lessons = normalized;
        dataToUpdate.lectures = normalized;
        dataToUpdate.sessions = normalized;
        const currentEntered = Number(dataToUpdate.lessons_count ?? dataToUpdate.lecturesCount) || 0;
        const safeCount = currentEntered < normalized.length ? normalized.length : currentEntered;
        dataToUpdate.lessons_count = safeCount;
        dataToUpdate.lecturesCount = safeCount;
      }

      if (dataToUpdate.instructor && !dataToUpdate.instructor_name) {
        dataToUpdate.instructor_name = dataToUpdate.instructor;
      }
      if (dataToUpdate.instructor_name && !dataToUpdate.instructor) {
        dataToUpdate.instructor = dataToUpdate.instructor_name;
      }
      if (dataToUpdate.category && !dataToUpdate.category_name) {
        dataToUpdate.category_name = dataToUpdate.category;
      }
      if (dataToUpdate.category_name && !dataToUpdate.category) {
        dataToUpdate.category = dataToUpdate.category_name;
      }
      if (dataToUpdate.instructorId && !dataToUpdate.instructor_id) {
        dataToUpdate.instructor_id = dataToUpdate.instructorId;
      }
      if (dataToUpdate.price !== undefined) {
        const rawP = dataToUpdate.price;
        const numP = Number(rawP);
        const parsedP = (!rawP || rawP === 'Free' || rawP === 'free' || isNaN(numP) || numP <= 0) ? 0 : numP;
        dataToUpdate.price = parsedP;
        dataToUpdate.isPaid = parsedP > 0;
        dataToUpdate.is_paid = parsedP > 0;
      }

      // Optimistic state update & local storage update
      setRawCourses(prev => prev.map(c => c.id === id ? sanitizeObject({ ...c, ...dataToUpdate }) : c));
      const existingLocals = getStoredLocalCourses();
      saveLocalCourses(existingLocals.map(c => c.id === id ? { ...c, ...dataToUpdate } : c));

      if (isValidUUID(id)) {
        // Payload cleanup for Supabase: strictly include only existing columns
        const COURSE_VALID_COLUMNS = new Set([
          'title', 'title_en', 'description', 'description_en',
          'price', 'category', 'category_name', 'category_id', 'category_en',
          'instructor', 'instructor_name', 'instructor_id', 'instructor_en',
          'image_url', 'image_name', 'avatar', 'rating', 'students', 'students_count',
          'lessons_count', 'duration', 'level', 'level_en',
          'lessons', 'lectures', 'sessions', 'goals', 'goals_en',
          'is_published', 'status', 'icon', 'updated_at'
        ]);

        const payload = {};
        for (const [key, val] of Object.entries(dataToUpdate)) {
          if (COURSE_VALID_COLUMNS.has(key)) {
            payload[key] = val;
          }
        }
        if (dataToUpdate.instructor || dataToUpdate.instructor_name) {
          payload.instructor = dataToUpdate.instructor || dataToUpdate.instructor_name;
          payload.instructor_name = dataToUpdate.instructor_name || dataToUpdate.instructor;
        }
        if (dataToUpdate.category || dataToUpdate.category_name) {
          payload.category = dataToUpdate.category || dataToUpdate.category_name;
          payload.category_name = dataToUpdate.category_name || dataToUpdate.category;
        }
        if (dataToUpdate.instructor_id || dataToUpdate.instructorId) {
          payload.instructor_id = dataToUpdate.instructor_id || dataToUpdate.instructorId;
        }
        if (dataToUpdate.lessons) payload.lessons = dataToUpdate.lessons;
        if (dataToUpdate.lectures) payload.lectures = dataToUpdate.lectures;
        if (dataToUpdate.sessions) payload.sessions = dataToUpdate.sessions;
        if (dataToUpdate.lessons_count) payload.lessons_count = dataToUpdate.lessons_count;
        payload.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', id);

        if (updateError) {
          console.warn("Supabase course update notice:", updateError.message);
          const match = updateError.message?.match(/Could not find the '([^']+)' column/i);
          if (match && match[1]) {
            delete payload[match[1]];
            await supabase.from('courses').update(payload).eq('id', id);
          }
        }
      }

      await fetchCourses();
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
