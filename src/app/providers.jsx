"use client";

import { useEffect } from 'react';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { MaintenanceProvider } from '../context/MaintenanceContext';
import { LibraryProvider } from '../context/LibraryContext';
import { CoursesProvider } from '../context/CoursesContext';
import { CategoriesProvider } from '../context/CategoriesContext';
import { CallProvider } from '../context/CallContext';
import { PwaProvider } from '../context/PwaContext';
import { useDarkMode } from '../hooks/useDarkMode';
import OfflineBanner from '../components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import PwaInstallBanner from '../components/PwaInstallBanner';
import MobileBottomNav from '../components/MobileBottomNav';

function DarkModeInit() {
  useDarkMode();
  return null;
}

function FontAwesomeLoader() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('font-awesome-css')) return;
    const link = document.createElement('link');
    link.id = 'font-awesome-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, []);
  return null;
}

export function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <MaintenanceProvider>
            <LibraryProvider>
              <CoursesProvider>
                <CategoriesProvider>
                  <CallProvider>
                    <PwaProvider>
                      <DarkModeInit />
                      <FontAwesomeLoader />
                      <OfflineBanner />
                      <PwaInstallBanner />
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
                      <MobileBottomNav />
                    </PwaProvider>
                  </CallProvider>
                </CategoriesProvider>
              </CoursesProvider>
            </LibraryProvider>
          </MaintenanceProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
