'use client';

import React, { useState } from 'react';
import { usePwa } from '../context/PwaContext';
import { useLanguage } from '../context/LanguageContext';

export default function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIos, isInAppBrowser, updateAvailable, promptInstall, applyUpdate } = usePwa() || {};
  const { dir } = useLanguage() || { dir: 'rtl' };
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed or user dismissed, don't show install banner (still show update if available)
  if (updateAvailable) {
    return (
      <div 
        role="alert" 
        className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:w-96 z-[999] bg-stone-900 text-white rounded-2xl p-4 shadow-2xl border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {dir === 'rtl' ? 'تحديث جديد متاح' : 'New Update Available'}
            </p>
            <p className="text-xs text-stone-300">
              {dir === 'rtl' ? 'انقر لتحديث التطبيق فوراً' : 'Click to refresh the app now'}
            </p>
          </div>
        </div>
        <button
          onClick={applyUpdate}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0"
        >
          {dir === 'rtl' ? 'تحديث الآن' : 'Update Now'}
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
        className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:w-96 z-[990] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <img src="/favicon.png?v=3" alt="PIA Logo" className="w-10 h-10 rounded-xl shadow-sm shrink-0" />
          <div>
            <p className="text-sm font-bold text-stone-900 dark:text-white">
              {dir === 'rtl' ? 'تطبيق أكاديمية فلسطين' : 'PIA Mobile App'}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {dir === 'rtl' ? 'تصفح أسرع وتجربة تطبيق أصلي' : 'Faster browsing & native app experience'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (isIos) {
                setShowIosSheet(true);
              } else {
                promptInstall();
              }
            }}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            {dir === 'rtl' ? 'تثبيت' : 'Install'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="إغلاق"
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg text-sm"
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
