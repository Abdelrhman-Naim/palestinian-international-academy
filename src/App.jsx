import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AnimatedRoutes from './components/AnimatedRoutes';
import { CategoriesProvider } from './context/CategoriesContext';
import { CoursesProvider } from './context/CoursesContext';
import { LibraryProvider } from './context/LibraryContext';
import { AuthProvider } from './context/AuthContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { useDarkMode } from './hooks/useDarkMode';
import ScrollToTop from './components/ScrollToTop';
import RouteTransitionLoader from './components/RouteTransitionLoader';
import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';
import MobileBottomNav from './components/MobileBottomNav';
import { useLanguage } from './context/LanguageContext';

const UnauthorizedPage = ({ redirectTo, redirectLabel }) => {
  const { t, dir } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-950 font-alexandria" dir={dir}>
      <div className="max-w-md text-center p-10 rounded-3xl border border-[#E8E2D5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-extrabold text-white mb-3">{t('app.unauthorized')}</h1>
        <p className="text-gray-400 leading-7">{t('app.unauthorizedDesc')}<br/>{t('app.unauthorizedHint')}</p>
        <a href={redirectTo} className="mt-6 inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">{redirectLabel}</a>
      </div>
    </div>
  );
};

function InstructorGuard({ children }) {
  const { userStatus, userRole, currentUser, loading } = useAuth();
  const { t, dir } = useLanguage();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <Navigate to="/login-trainer" replace />;
  if (userRole !== 'instructor') {
    return <UnauthorizedPage redirectTo="/login-trainer" redirectLabel={t('app.goInstructorLogin')} />;
  }
  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-950 font-alexandria" dir={dir}>
        <div className="max-w-md text-center p-10 rounded-3xl border border-[#E8E2D5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-extrabold text-white mb-3">{t('app.pendingTitle')}</h1>
          <p className="text-gray-400 leading-7">{t('app.pendingDesc')}<br/>{t('app.pendingHint')}</p>
          <p className="mt-4 text-sm text-orange-400 font-bold">{t('app.pendingNote')}</p>
        </div>
      </div>
    );
  }
  return children;
}

function AdminGuard({ children }) {
  const { userRole, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <Navigate to="/login-admin" replace />;
  if (userRole !== 'admin') {
    return <UnauthorizedPage redirectTo="/login-admin" redirectLabel={t('app.goAdminLogin')} />;
  }
  return children;
}

function StudentGuard({ children }) {
  const { userRole, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setSafetyTimedOut(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !safetyTimedOut) return <PageLoader fullScreen={true} />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole !== 'student') {
    return <UnauthorizedPage redirectTo="/login" redirectLabel={t('app.goStudentLogin')} />;
  }
  return children;
}

function App() {
  useDarkMode();
  return (
    <LanguageProvider>
    <AuthProvider>
    <ToastProvider>
    <MaintenanceProvider>
    <LibraryProvider>
    <CoursesProvider>
    <CategoriesProvider>
    <Router>
        <ScrollToTop />
        <RouteTransitionLoader />
        <ErrorBoundary>
          <AnimatedRoutes StudentGuard={StudentGuard} AdminGuard={AdminGuard} InstructorGuard={InstructorGuard} />
        </ErrorBoundary>
        <MobileBottomNav />
    </Router>
    </CategoriesProvider>
    </CoursesProvider>
    </LibraryProvider>
    </MaintenanceProvider>
    </ToastProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
