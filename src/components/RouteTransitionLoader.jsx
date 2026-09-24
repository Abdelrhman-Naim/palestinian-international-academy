import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageLoader from './PageLoader';
import { useLanguage } from '../context/LanguageContext';

/**
 * RouteTransitionLoader
 * When navigating between distinct top-level pages, especially on slow networks,
 * renders a magnificent centered circular loader with clear typography and status.
 */
export default function RouteTransitionLoader() {
  const location = useLocation();
  const { dir } = useLanguage();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef(null);

  const getRootSegment = (path) => {
    const parts = (path || '').split('/').filter(Boolean);
    return parts[0] || '';
  };

  useEffect(() => {
    const prevRoot = getRootSegment(prevPathRef.current);
    const currRoot = getRootSegment(location.pathname);

    // Only trigger full transition loader when moving between distinct top-level routes
    // (e.g., / -> /courses, or /courses -> /admin-dashboard).
    // Avoid triggering on internal tab changes inside dashboards or query param changes.
    const isSubTabChange = (
      (prevRoot === 'admin-dashboard' && currRoot === 'admin-dashboard') ||
      (prevRoot === 'instructor-dashboard' && currRoot === 'instructor-dashboard') ||
      (prevRoot === 'dashboard' && currRoot === 'dashboard')
    );

    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;

      if (!isSubTabChange) {
        setIsTransitioning(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 140);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <PageLoader 
          fullScreen={true}
          pointerEventsNone={true}
          title={dir === 'rtl' ? 'جاري الانتقال والتجهيز...' : 'Loading Page...'}
          subtitle={dir === 'rtl' 
            ? 'يتم الآن فتح الصفحة وتجهيز العناصر بأعلى جودة، يرجى الانتظار لحظات...' 
            : 'Opening page and preparing content with highest quality, please wait...'}
        />
      )}
    </AnimatePresence>
  );
}
