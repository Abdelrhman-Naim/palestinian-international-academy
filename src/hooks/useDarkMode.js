import { useState, useEffect } from 'react';

/**
 * Checks if the operating system / browser prefers dark mode.
 */
function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/**
 * Resolves the theme:
 * 1. If the user explicitly clicked the toggle button, use that manual choice ('dark' | 'light').
 * 2. Otherwise, ALWAYS follow the operating system theme directly.
 */
function resolveCurrentTheme() {
  if (typeof window === 'undefined') return false;
  try {
    const manual = localStorage.getItem('theme_manual');
    if (manual === 'dark') return true;
    if (manual === 'light') return false;
    return getSystemDark();
  } catch {
    return false;
  }
}

let globalDarkMode = resolveCurrentTheme();
const listeners = new Set();

function applyTheme(isDark, isManualClick = false) {
  if (typeof window === 'undefined') return;
  globalDarkMode = isDark;

  const root = window.document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    if (isManualClick) {
      localStorage.setItem('theme_manual', isDark ? 'dark' : 'light');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch (e) {}

  listeners.forEach((fn) => fn(isDark));
}

// Initialize theme immediately on script evaluation
if (typeof window !== 'undefined') {
  applyTheme(resolveCurrentTheme());

  // Listen in real-time to OS theme changes (e.g. Windows / macOS settings)
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // When the user changes their system OS theme, clear manual override and follow the OS
      try {
        localStorage.removeItem('theme_manual');
      } catch (err) {}
      applyTheme(e.matches, false);
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
  const [isDarkMode, setIsDarkMode] = useState(globalDarkMode);

  useEffect(() => {
    setIsDarkMode(globalDarkMode);
    applyTheme(globalDarkMode);

    listeners.add(setIsDarkMode);
    return () => {
      listeners.delete(setIsDarkMode);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextVal = !globalDarkMode;
    applyTheme(nextVal, true); // Mark as explicit user button click
  };

  return [isDarkMode, toggleDarkMode];
}

export default useDarkMode;
