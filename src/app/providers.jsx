"use client";

import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { MaintenanceProvider } from '../context/MaintenanceContext';
import { LibraryProvider } from '../context/LibraryContext';
import { CoursesProvider } from '../context/CoursesContext';
import { CategoriesProvider } from '../context/CategoriesContext';
import { CallProvider } from '../context/CallContext';
import { useDarkMode } from '../hooks/useDarkMode';
import OfflineBanner from '../components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';

function DarkModeInit() {
  useDarkMode();
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
                    <DarkModeInit />
                    <OfflineBanner />
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
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
