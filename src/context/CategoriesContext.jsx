"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';
import { safeStorage } from '../utils/safeStorage';

import { getLocalizedCategory } from '../utils/categoryUtils';

const defaultLibraryCategories = [
  'الأدب العربي',
  'الأدب العالمي',
  'علوم إسلامية',
  'كتب دينية',
  'إقتصاد وأعمال',
  'كتب منوعة',
  'كتب سياسية',
  'قضايا فكرية',
  'تاريخ وجغرافيا',
  'العلوم والطبيعة',
  'علم النفس',
  'صحافة وإعلام',
  'كتب الفلسفة',
  'كتب التنمية البشرية',
  'بيوغرافيا ومذكرات',
  'علوم إجتماعية',
  'كتب تعليم لغات',
  'كتب علوم الهندسة',
  'كتب تعليمية',
  'فنون',
  'صحة وطب',
  'قانون',
  'كتب الخيال العلمي',
  'مراجع',
  'علوم عسكرية',
  'رياضة وتسالي',
  'غرائب وأساطير',
  'طبخ وطعام',
  'كتب أطفال',
  'علوم الحيوان',
  'المرأة والعائلة',
  'كتب طرائف و نوادر',
  'سفر ورحلات',
  'سلاسل وموسوعات'
];

const defaultCourseCategories = ['برمجة', 'أمن سيبراني', 'إدارة أعمال'];

const defaultShortsCategories = [
  'برمجة',
  'ذكاء اصطناعي',
  'أمن سيبراني',
  'هندسة متطورة',
  'أنظمة سحابية',
  'تطوير ويب'
];

const defaultCategories = {
  courses: defaultCourseCategories,
  library: defaultLibraryCategories,
  shorts: defaultShortsCategories,
  courses_en: defaultCourseCategories.map(c => getLocalizedCategory(c, 'en')),
  library_en: defaultLibraryCategories.map(c => getLocalizedCategory(c, 'en')),
  shorts_en: defaultShortsCategories.map(c => getLocalizedCategory(c, 'en'))
};

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [rawCategories, setRawCategories] = useState(() => {
    try {
      const saved = safeStorage.getItem('app_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.library?.length > 10) {
          if (!parsed.shorts || !Array.isArray(parsed.shorts) || parsed.shorts.length === 0) {
            parsed.shorts = defaultShortsCategories;
            parsed.shorts_en = defaultShortsCategories.map(c => getLocalizedCategory(c, 'en'));
          }
          return parsed;
        }
      }
    } catch (_) {}
    return defaultCategories;
  });
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const fetchCategories = async () => {
    let lastErr = null;
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*');

          if (error) {
            lastErr = error;
            await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
            continue;
          }

          if (data && data.length > 0) {
            const courseItems = data.filter(c => c.slug === 'courses' || c.slug === 'course');
            const shortItems = data.filter(c => c.slug === 'shorts' || c.slug === 'short');
            const libItems = data.filter(c => c.slug === 'library' || (!c.slug && c.slug !== 'courses' && c.slug !== 'course' && c.slug !== 'shorts' && c.slug !== 'short'));

            const courseCats = courseItems.map(c => c.name);
            const courseCatsEn = courseItems.map(c => c.description || getLocalizedCategory(c.name, 'en'));
            const shortCats = shortItems.map(c => c.name);
            const shortCatsEn = shortItems.map(c => c.description || getLocalizedCategory(c.name, 'en'));
            const libCats = libItems.map(c => c.name);
            const libCatsEn = libItems.map(c => c.description || getLocalizedCategory(c.name, 'en'));

            const updated = {
              courses: courseCats.length ? Array.from(new Set(courseCats)) : defaultCourseCategories,
              courses_en: courseCatsEn.length ? Array.from(new Set(courseCatsEn)) : defaultCourseCategories.map(c => getLocalizedCategory(c, 'en')),
              library: libCats.length ? Array.from(new Set(libCats)) : defaultLibraryCategories,
              library_en: libCatsEn.length ? Array.from(new Set(libCatsEn)) : defaultLibraryCategories.map(c => getLocalizedCategory(c, 'en')),
              shorts: shortCats.length ? Array.from(new Set(shortCats)) : defaultShortsCategories,
              shorts_en: shortCatsEn.length ? Array.from(new Set(shortCatsEn)) : defaultShortsCategories.map(c => getLocalizedCategory(c, 'en'))
            };

            setRawCategories(updated);
            try {
              safeStorage.setItem('app_categories', JSON.stringify(updated));
            } catch (_) {}
            return;
          }
        } catch (err) {
          lastErr = err;
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
      }

      if (lastErr) {
        console.warn('Categories fetch notice:', lastErr.message || lastErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const channel = supabase
      .channel('categories_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = {
    courses: lang === 'en' && rawCategories.courses_en && rawCategories.courses_en.length === rawCategories.courses.length ? rawCategories.courses_en : rawCategories.courses,
    library: lang === 'en' && rawCategories.library_en && rawCategories.library_en.length === rawCategories.library.length ? rawCategories.library_en : rawCategories.library,
    shorts: lang === 'en' && rawCategories.shorts_en && rawCategories.shorts_en.length === (rawCategories.shorts || []).length ? rawCategories.shorts_en : (rawCategories.shorts || defaultShortsCategories)
  };

  const saveState = (updated) => {
    setRawCategories(updated);
    try {
      safeStorage.setItem('app_categories', JSON.stringify(updated));
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
    
    saveState(newCategories);

    try {
      await supabase.from('categories').insert([{
        name: trimmed,
        description: name_en,
        slug: type === 'courses' ? 'courses' : type === 'shorts' ? 'shorts' : 'library'
      }]);
    } catch (e) {
      console.warn('Category insert in Supabase notice:', e);
    }

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

    try {
      await supabase.from('categories')
        .update({ name: trimmedNew, description: name_en })
        .eq('name', trimmedOld);
    } catch (e) {
      console.warn('Category update in Supabase notice:', e);
    }

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

    try {
      await supabase.from('categories')
        .delete()
        .eq('name', name);
    } catch (e) {
      console.warn('Category delete in Supabase notice:', e);
    }
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
