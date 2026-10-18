"use client";

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
                    <PwaProvider>
                      <DarkModeInit />
                      <OfflineBanner />
                      <PwaInstallBanner />
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
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
