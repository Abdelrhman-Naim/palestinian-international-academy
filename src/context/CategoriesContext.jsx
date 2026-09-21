import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';

const defaultCategories = {
  courses: ['برمجة', 'تصميم', 'أمن سيبراني', 'إدارة أعمال'],
  library: ['كتب برمجية', 'تصميم', 'شبكات'],
  courses_en: ['Programming', 'Design', 'Cybersecurity', 'Business'],
  library_en: ['Programming Books', 'Design', 'Networking']
};

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [rawCategories, setRawCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error || !data || data.length === 0) {
        // Fallback to localStorage or defaults if DB categories table is empty
        const saved = localStorage.getItem('app_categories');
        if (saved) {
          try { setRawCategories(JSON.parse(saved)); } catch (e) {}
        }
      } else {
        const courseCats = data.map(c => c.name);
        const courseCatsEn = data.map(c => c.name_en || c.name);
        setRawCategories(prev => ({
          ...prev,
          courses: courseCats,
          courses_en: courseCatsEn
        }));
      }
    } catch (err) {
      console.warn('Categories fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categories = {
    courses: lang === 'en' && rawCategories.courses_en && rawCategories.courses_en.length === rawCategories.courses.length ? rawCategories.courses_en : rawCategories.courses,
    library: lang === 'en' && rawCategories.library_en && rawCategories.library_en.length === rawCategories.library.length ? rawCategories.library_en : rawCategories.library
  };

  const saveState = (updated) => {
    setRawCategories(updated);
    try {
      localStorage.setItem('app_categories', JSON.stringify(updated));
    } catch (e) {}
  };

  const addCategory = async (type, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'أدخل اسم التصنيف' };

    const exists = (rawCategories[type] || []).some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return { ok: false, error: 'هذا التصنيف موجود مسبقاً' };

    const name_en = await translateText(trimmed);

    const newCategories = {
      ...rawCategories,
      [type]: [...(rawCategories[type] || []), trimmed],
      [type + '_en']: [...(rawCategories[type + '_en'] || []), name_en]
    };
    
    try {
      await supabase.from('categories').insert([{ name: trimmed, slug: name_en.toLowerCase() }]);
    } catch (e) {}

    saveState(newCategories);
    return { ok: true };
  };

  const updateCategory = async (type, oldName, newName) => {
    const trimmedOld = (oldName || '').trim();
    const trimmedNew = (newName || '').trim();

    if (!trimmedNew) {
      return { ok: false, error: lang === 'en' ? 'Please enter a category name' : 'يرجى إدخال اسم التصنيف' };
    }

    const oldIdx = (rawCategories[type] || []).indexOf(trimmedOld);
    if (oldIdx === -1) {
      return { ok: false, error: lang === 'en' ? 'Original category not found' : 'التصنيف الأصلي غير موجود' };
    }

    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return { ok: true };
    }

    const exists = (rawCategories[type] || []).some(
      (item, idx) => idx !== oldIdx && item.toLowerCase() === trimmedNew.toLowerCase()
    );
    if (exists) {
      return { ok: false, error: lang === 'en' ? 'This category already exists' : 'هذا التصنيف موجود مسبقاً' };
    }

    const name_en = await translateText(trimmedNew);

    const newArr = [...(rawCategories[type] || [])];
    newArr[oldIdx] = trimmedNew;

    const newArrEn = [...(rawCategories[type + '_en'] || [])];
    if (newArrEn.length > oldIdx) {
      newArrEn[oldIdx] = name_en;
    } else {
      newArrEn.push(name_en);
    }

    const newCategories = {
      ...rawCategories,
      [type]: newArr,
      [type + '_en']: newArrEn
    };

    saveState(newCategories);
    return { ok: true };
  };

  const removeCategory = async (type, name) => {
    const idx = (rawCategories[type] || []).indexOf(name);
    if (idx === -1) return;

    const newArr = [...(rawCategories[type] || [])];
    newArr.splice(idx, 1);

    const newArrEn = [...(rawCategories[type + '_en'] || [])];
    if (newArrEn.length > idx) {
      newArrEn.splice(idx, 1);
    }

    const newCategories = {
      ...rawCategories,
      [type]: newArr,
      [type + '_en']: newArrEn
    };
    saveState(newCategories);
  };

  return (
    <CategoriesContext.Provider value={{ categories, rawCategories, loading, addCategory, updateCategory, removeCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
