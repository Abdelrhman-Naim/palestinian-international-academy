'use client';

import React, { useState } from 'react';
import { usePwa } from '../context/PwaContext';
import { useLanguage } from '../context/LanguageContext';

export default function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIos, isInAppBrowser, updateAvailable, promptInstall, applyUpdate } = usePwa() || {};
  const { dir } = useLanguage() || { dir: 'rtl' };
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('pia_pwa_dismissed') === 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pia_pwa_dismissed', 'true');
      } catch (e) {}
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);

  // If update is available, show high-priority update notification
  if (updateAvailable) {
    return (
      <div 
        role="alert" 
        className="fixed bottom-20 sm:bottom-6 start-3 end-3 sm:start-auto sm:end-6 sm:max-w-md z-[9999] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-500/40 flex items-center justify-between gap-3 animate-fade-in"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl animate-spin" style={{ animationDuration: '3s' }}>
              sync
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">
              {dir === 'rtl' ? 'يتوفر إصدار جديد من المنصة' : 'New Platform Version Available'}
            </p>
            <p className="text-xs text-stone-300 truncate">
              {dir === 'rtl' ? 'انقر لتحديث التطبيق وتطبيق أحدث التحسينات' : 'Click to update and get latest improvements'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsUpdating(true);
            applyUpdate();
          }}
          disabled={isUpdating}
          className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shrink-0 shadow-lg shadow-amber-500/20 disabled:opacity-60"
        >
          {isUpdating
            ? (dir === 'rtl' ? 'جاري التحديث...' : 'Updating...')
            : (dir === 'rtl' ? 'تحديث الآن' : 'Update Now')
          }
        </button>
      </div>
    );
  }

  if (isInstalled || dismissed) return null;

  // Show install option if installable or if iOS not standalone
  const canShowInstall = isInstallable || (isIos && !isInstalled && !isInAppBrowser);
  if (!canShowInstall) return null;

  return (
    <>
      <div 
        className="fixed bottom-20 sm:bottom-3 start-3 end-3 sm:start-auto sm:end-6 sm:max-w-sm z-[990] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2.5 sm:gap-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/favicon.png?v=3" alt="PIA Logo" width={40} height={40} loading="lazy" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-xs shrink-0" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
              {dir === 'rtl' ? 'تطبيق أكاديمية فلسطين' : 'PIA Mobile App'}
            </p>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
              {dir === 'rtl' ? 'تصفح أسرع وتجربة تطبيق أصلي' : 'Faster browsing & native app'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              if (isIos) {
                setShowIosSheet(true);
              } else {
                promptInstall();
              }
            }}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            {dir === 'rtl' ? 'تثبيت' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="إغلاق"
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Sheet (P-119) */}
      {showIosSheet && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowIosSheet(false)}
        >
          <div 
            className="bg-white dark:bg-stone-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border border-stone-200 dark:border-stone-700 mb-6 sm:mb-0"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
              {dir === 'rtl' ? 'تثبيت التطبيق على iPhone / iPad' : 'Install App on iOS'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
              {dir === 'rtl' ? (
                <>
                  1. اضغط على زر المشاركة <strong>(Share)</strong> في شريط Safari بالأسفل.<br />
                  2. مرر للأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية"</strong> (Add to Home Screen).
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
                  2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIosSheet(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2.5 rounded-xl text-sm"
            >
              {dir === 'rtl' ? 'فهمت ذلك' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
