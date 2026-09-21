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
      lectures: (course.lectures || course.lessons || []).map(lec => ({
        ...lec,
        title: lang === 'en' ? (lec.title_en || lec.title) : lec.title
      })),
      originalData: course
    };
    return mapped;
  });

  const addCourse = async (courseData) => {
    try {
      if (courseData.title) courseData.title_en = await translateText(courseData.title);
      if (courseData.description) courseData.description_en = await translateText(courseData.description);
      if (courseData.instructor) courseData.instructor_en = await translateText(courseData.instructor);
      if (courseData.category) courseData.category_en = await translateText(courseData.category);
      if (courseData.level) courseData.level_en = await translateText(courseData.level);
      if (courseData.goals) courseData.goals_en = await Promise.all(courseData.goals.map(g => translateText(g)));
      if (courseData.lectures) {
        courseData.lectures = await Promise.all(courseData.lectures.map(async lec => {
          return { ...lec, title_en: await translateText(lec.title) };
        }));
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) throw error;
      await fetchCourses();
      return { ok: true, id: data?.id };
    } catch (err) {
      console.error("Error adding course to Supabase:", err);
      return { ok: false };
    }
  };

  const removeCourse = async (id) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCourses();
    } catch (err) {
      console.error("Error deleting course from Supabase:", err);
    }
  };

  const updateCourse = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;
      
      if (dataToUpdate.title) dataToUpdate.title_en = await translateText(dataToUpdate.title);
      if (dataToUpdate.description) dataToUpdate.description_en = await translateText(dataToUpdate.description);
      if (dataToUpdate.instructor) dataToUpdate.instructor_en = await translateText(dataToUpdate.instructor);
      if (dataToUpdate.category) dataToUpdate.category_en = await translateText(dataToUpdate.category);
      if (dataToUpdate.level) dataToUpdate.level_en = await translateText(dataToUpdate.level);
      if (dataToUpdate.goals) dataToUpdate.goals_en = await Promise.all(dataToUpdate.goals.map(g => translateText(g)));
      if (dataToUpdate.lectures) {
        dataToUpdate.lectures = await Promise.all(dataToUpdate.lectures.map(async lec => {
          if (!lec.title_en) lec.title_en = await translateText(lec.title);
          return lec;
        }));
      }

      dataToUpdate.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('courses')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;
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
