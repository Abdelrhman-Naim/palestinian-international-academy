import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'hero_featured'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFeaturedCourseConfig(data);
        try {
          localStorage.setItem('hero_featured_course', JSON.stringify(data));
        } catch (e) {}
      }
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.warn('Hero featured course snapshot listener error:', err.message);
      }
    });
    return () => unsub();
  }, []);

  const updateFeaturedCourse = async (config) => {
    try {
      const ref = doc(db, 'config', 'hero_featured');
      const payload = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      await setDoc(ref, payload, { merge: true });
      setFeaturedCourseConfig(prev => ({ ...prev, ...config }));
      try {
        localStorage.setItem('hero_featured_course', JSON.stringify({ ...featuredCourseConfig, ...config }));
      } catch (e) {}
      return { ok: true };
    } catch (err) {
      console.error('Error updating hero featured course:', err);
      setFeaturedCourseConfig(prev => ({ ...prev, ...config }));
      try {
        localStorage.setItem('hero_featured_course', JSON.stringify({ ...featuredCourseConfig, ...config }));
      } catch (e) {}
      return { ok: true };
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => sanitizeObject({
        id: doc.id,
        ...doc.data()
      }));
      setRawCourses(coursesData);
      setLoading(false);
    }, (err) => {
      console.warn('Courses snapshot listener error:', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
      instructor: lang === 'en' ? getEnField(course.instructor, course.instructor_en) : course.instructor,
      category: lang === 'en' ? getEnField(course.category, course.category_en) : course.category,
      level: lang === 'en' ? getEnField(course.level, course.level_en) : course.level,
      goals: lang === 'en' && course.goals_en && course.goals_en.length === (course.goals || []).length ? course.goals_en : course.goals,
      lectures: (course.lectures || []).map(lec => ({
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
      if (!courseData.createdAt) courseData.createdAt = new Date().toISOString();
      courseData.updatedAt = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      return { ok: true, id: docRef.id };
    } catch (err) {
      console.error(err);
      return { ok: false };
    }
  };

  const removeCourse = async (id) => {
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateCourse = async (id, updatedData) => {
    try {
      const { id: docId, originalData, ...dataToUpdate } = updatedData;
      
      // Auto-translate only if strings are provided and we don't already have them?
      // Actually we should just re-translate them.
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

      dataToUpdate.updatedAt = new Date().toISOString();
      await updateDoc(doc(db, 'courses', id), dataToUpdate);
      return { ok: true };
    } catch (err) {
      console.error(err);
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
