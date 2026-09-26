import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function OfflineBanner() {
  const { lang, dir } = useLanguage();
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
    };

    const handleOffline = () => {
      if (timer) clearTimeout(timer);
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  const isAr = lang === 'ar';

  return (
    <div
      dir={dir}
      className={`fixed top-0 inset-x-0 z-[9999] transition-all duration-300 ease-in-out px-4 py-2.5 text-center text-xs md:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md ${
        isOnline
          ? 'bg-emerald-600/95 text-white'
          : 'bg-amber-600/95 text-white'
      }`}
      role="alert"
    >
      {isOnline ? (
        <>
          <svg className="w-4 h-4 animate-bounce shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
          <span>
            {isAr
              ? 'تمت استعادة الاتصال بالإنترنت بنجاح - تم تحديث البيانات'
              : 'Internet connection restored - data refreshed'}
          </span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>
            {isAr
              ? 'أنت حالياً في وضع عدم الاتصال بالإنترنت - يتم العمل بالبيانات المحفوظة محلياً'
              : 'You are currently offline - browsing cached data'}
          </span>
        </>
      )}
    </div>
  );
}
