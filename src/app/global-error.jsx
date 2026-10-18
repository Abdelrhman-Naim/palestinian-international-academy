'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-[100dvh] flex items-center justify-center bg-[#FAF7F2] p-6 font-cairo">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E8E2D5] p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            حدث خطأ أثناء تحميل التطبيق
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            يرجى إعادة المحاولة لإعادة تهيئة النظام.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-[#D4AF37] hover:bg-[#b38b22] text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
