import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from '../i18n/ar.json';
import en from '../i18n/en.json';

const translations = { ar, en };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lang') || 'ar';
    }
    return 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);
    localStorage.setItem('lang', lang);
    // Update font family based on language
    document.body.style.fontFamily = lang === 'ar'
      ? "'Alexandria', sans-serif"
      : "'Hanken Grotesk', 'Alexandria', sans-serif";
  }, [lang, dir]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const t = useCallback((key) => {
    if (!key) return '';
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    if (value !== undefined && value !== null && value !== key) return value;

    // Fallback to 'ar' dictionary if current lang is not 'ar' and key was missing
    if (lang !== 'ar') {
      let fallback = translations['ar'];
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = fallback[k];
        } else {
          fallback = undefined;
          break;
        }
      }
      if (fallback !== undefined && fallback !== null) return fallback;
    }

    return key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, dir, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
