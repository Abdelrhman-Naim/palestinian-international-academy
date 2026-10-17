"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import PageLoader from '@/components/PageLoader';

export const UnauthorizedPage = ({ redirectTo, redirectLabel }) => {
  const { t, dir } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-950 font-alexandria" dir={dir}>
      <div className="max-w-md text-center p-10 rounded-3xl border border-[#E8E2D5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t('app.unauthorized')}</h1>
        <p className="text-gray-600 dark:text-gray-400 leading-7">{t('app.unauthorizedDesc')}<br/>{t('app.unauthorizedHint')}</p>
        <a href={redirectTo} className="mt-6 inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">{redirectLabel}</a>
      </div>
    </div>
  );
};

export function StudentGuard({ children }) {
  const [mounted, setMounted] = useState(false);
  const { userRole, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || (currentUser && !userRole)) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, userRole]);

  useEffect(() => {
    if (mounted && !loading && !currentUser && safetyTimedOut) {
      router.replace('/login');
    }
  }, [mounted, loading, currentUser, safetyTimedOut, router]);

  if (!mounted) return <PageLoader fullScreen={true} />;
  if ((loading || (currentUser && !userRole)) && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <PageLoader fullScreen={true} />;
  if (!userRole) return <PageLoader fullScreen={true} />;
  if (userRole !== 'student' && userRole !== 'admin') {
    return <UnauthorizedPage redirectTo="/login" redirectLabel={t('app.goStudentLogin')} />;
  }
  return children;
}

export function InstructorGuard({ children }) {
  const [mounted, setMounted] = useState(false);
  const { userStatus, userRole, currentUser, loading } = useAuth();
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || (currentUser && !userRole)) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, userRole]);

  useEffect(() => {
    if (mounted && !loading && !currentUser && safetyTimedOut) {
      router.replace('/login-trainer');
    }
  }, [mounted, loading, currentUser, safetyTimedOut, router]);

  if (!mounted) return <PageLoader fullScreen={true} />;
  if ((loading || (currentUser && !userRole)) && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <PageLoader fullScreen={true} />;
  if (!userRole) return <PageLoader fullScreen={true} />;
  if (userRole !== 'instructor' && userRole !== 'admin') {
    return <UnauthorizedPage redirectTo="/login-trainer" redirectLabel={t('app.goInstructorLogin')} />;
  }
  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-950 font-alexandria" dir={dir}>
        <div className="max-w-md text-center p-10 rounded-3xl border border-[#E8E2D5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t('app.pendingTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 leading-7">{t('app.pendingDesc')}<br/>{t('app.pendingHint')}</p>
          <p className="mt-4 text-sm text-orange-500 font-bold">{t('app.pendingNote')}</p>
        </div>
      </div>
    );
  }
  return children;
}

export function AdminGuard({ children }) {
  const [mounted, setMounted] = useState(false);
  const { userRole, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || (currentUser && !userRole)) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, userRole]);

  useEffect(() => {
    if (mounted && !loading && !currentUser && safetyTimedOut) {
      router.replace('/login-admin');
    }
  }, [mounted, loading, currentUser, safetyTimedOut, router]);

  if (!mounted) return <PageLoader fullScreen={true} />;
  if ((loading || (currentUser && !userRole)) && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <PageLoader fullScreen={true} />;
  if (!userRole) return <PageLoader fullScreen={true} />;
  if (userRole !== 'admin') {
    return <UnauthorizedPage redirectTo="/login-admin" redirectLabel={t('app.goAdminLogin')} />;
  }
  return children;
}
