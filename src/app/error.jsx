'use client';

import React, { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Route Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAF7F2] dark:bg-[#12100e] p-6 font-cairo text-start">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-[#E8E2D5] dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          حدث خطأ غير متوقع
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          نعتذر عن هذا الخطأ. يمكنك إعادة المحاولة لتحديث المحتوى أو العودة للرئيسية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center text-sm"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
