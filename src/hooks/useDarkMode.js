import { useState, useEffect } from 'react';

/**
 * Checks if the operating system / browser prefers dark mode.
 */
function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/**
 * Resolves current theme:
 * 1. If user explicitly chose 'dark' or 'light' in localStorage ('theme'), use that.
 * 2. Otherwise follow system preference.
 */
function resolveCurrentTheme() {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return getSystemDark();
  } catch {
    return false;
  }
}

// Global cached state synced with DOM
let globalDarkMode = false;
if (typeof window !== 'undefined') {
  globalDarkMode = document.documentElement.classList.contains('dark') || resolveCurrentTheme();
}

const listeners = new Set();

function applyTheme(isDark, isManual = false) {
  if (typeof window === 'undefined') return;
  globalDarkMode = isDark;

  const root = window.document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    if (isManual) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  } catch (e) {}

  listeners.forEach((fn) => {
    try {
      fn(isDark);
    } catch (e) {}
  });
}

// OS Preference change listener (only applies if user has NOT explicitly chosen a theme)
if (typeof window !== 'undefined') {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      try {
        const saved = localStorage.getItem('theme');
        // Only react to OS changes if user hasn't set an explicit preference
        if (!saved) {
          applyTheme(e.matches, false);
        }
      } catch (err) {}
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  } catch (e) {
    console.warn('System dark mode listener error:', e);
  }
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    // Sync state in case document class changed before effect ran
    const current = document.documentElement.classList.contains('dark');
    setIsDarkMode(current);

    listeners.add(setIsDarkMode);
    return () => {
      listeners.delete(setIsDarkMode);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextVal = !document.documentElement.classList.contains('dark');
    applyTheme(nextVal, true);
  };

  return [isDarkMode, toggleDarkMode];
}

export default useDarkMode;
