import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from './LanguageContext';
import { translateText } from '../utils/translate';

const defaultCategories = {
  courses: [],
  library: [],
  courses_en: [],
  library_en: []
};

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [rawCategories, setRawCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'categories'), (docSnap) => {
      if (docSnap.exists()) {
        setRawCategories({ ...defaultCategories, ...docSnap.data() });
      } else {
        setRawCategories(defaultCategories);
      }
      setLoading(false);
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.warn('Categories snapshot listener error:', err.message);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = {
    courses: lang === 'en' && rawCategories.courses_en && rawCategories.courses_en.length === rawCategories.courses.length ? rawCategories.courses_en : rawCategories.courses,
    library: lang === 'en' && rawCategories.library_en && rawCategories.library_en.length === rawCategories.library.length ? rawCategories.library_en : rawCategories.library
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
      await setDoc(doc(db, 'config', 'categories'), newCategories, { merge: true });
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, error: 'تعذر إضافة التصنيف' };
    }
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

    // If unchanged
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return { ok: true };
    }

    // Check if new name already exists
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

    try {
      // 1. Update categories in config document
      await setDoc(doc(db, 'config', 'categories'), newCategories, { merge: true });

      // 2. Cascade update to all items using this category
      const targetCollection = type === 'courses' ? 'courses' : 'library';
      try {
        const q = query(collection(db, targetCollection), where('category', '==', trimmedOld));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.update(d.ref, { category: trimmedNew });
          });
          await batch.commit();
        }
      } catch (cascadeErr) {
        console.warn('Cascade update for category items error:', cascadeErr);
      }

      return { ok: true };
    } catch (err) {
      console.error('Error updating category:', err);
      return { ok: false, error: lang === 'en' ? 'Failed to update category' : 'تعذر تعديل التصنيف' };
    }
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
    try {
      await setDoc(doc(db, 'config', 'categories'), newCategories, { merge: true });
    } catch (err) {
      console.error(err);
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
