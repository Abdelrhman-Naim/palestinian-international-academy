import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageLoader from './PageLoader';
import { useLanguage } from '../context/LanguageContext';

/**
 * RouteTransitionLoader
 * When navigating between routes, especially on slow networks,
 * renders a magnificent centered circular loader with clear typography and status.
 */
export default function RouteTransitionLoader() {
  const location = useLocation();
  const { dir } = useLanguage();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef(null);

  useEffect(() => {
    // Only trigger when actual path changes
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsTransitioning(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      // Smoothly dismiss once page transitions
      timerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 120);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, location.search]);

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
