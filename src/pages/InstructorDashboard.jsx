import { useState, Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import NotificationDropdown from '../components/NotificationDropdown';
import PageLoader from '../components/PageLoader';

const navItemClass = ({ isActive }) =>
  `flex items-center px-4 py-2.5 rounded-lg transition-colors group text-sm ${
    isActive
      ? 'bg-primary text-white font-bold shadow-sm'
      : 'text-gray-600 dark:text-gray-300 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-dark dark:hover:text-white'
  }`;

const InstructorDashboard = () => {
  const { t, dir, toggleLang, lang } = useLanguage();
  const { unreadTotal } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const isMessages = location.pathname.includes('/messages');
  const { userData, logout } = useAuth();
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Get display name & initials from name
  const displayName = lang === 'en'
    ? (userData?.name_en || userData?.fullName_en || userData?.name || userData?.fullName || t('instructorOverview.instructor'))
    : (userData?.name || userData?.fullName || t('instructorOverview.instructor'));
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden font-alexandria bg-[#FAF7F2] dark:bg-gray-900 relative" dir={dir}>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`w-72 max-w-[85vw] sm:max-w-xs md:max-w-none bg-[#F3EFE6] dark:bg-gray-900 text-dark dark:text-white border-e border-[#E8E2D5] dark:border-gray-800 flex flex-col h-full shrink-0 z-50 shadow-lg overflow-y-auto custom-scrollbar fixed md:relative transition-transform duration-300 inset-y-0 start-0 md:inset-auto ${isSidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full max-md:rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="h-24 flex items-center justify-center relative px-6 border-b border-[#E8E2D5] dark:border-gray-800 shrink-0">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-center group">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain rounded-xl drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute end-4 md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={t('adminDashboard.closeSidebar') || 'إغلاق القائمة الجانبية'}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Profile */}
        <div className="p-6 flex flex-col items-center border-b border-[#E8E2D5] dark:border-gray-800 shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-3 shadow-lg overflow-hidden border-2 border-white/60 dark:border-gray-700">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials || 'م'}</span>
            )}
          </div>
          <h2 className="font-semibold text-lg text-center">{t('instructorDashboard.eng')} {displayName}</h2>
          <span className="text-xs text-primary uppercase tracking-wider mt-1 font-bold">
            {userData?.field || 'Instructor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          
          <NavLink to="/instructor-dashboard" end onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">dashboard</span>
            {t('instructorDashboard.overview')}
          </NavLink>

          <NavLink to="/instructor-dashboard/messages" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">forum</span>
            <span className="flex-1">{t('chat.conversations')}</span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow-xs animate-pulse">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </NavLink>

          <NavLink to="/instructor-dashboard/profile" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">person</span>
            {t('instructorDashboard.profile')}
          </NavLink>

          <NavLink to="/instructor-dashboard/my-courses" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">school</span>
            {t('submittedAssignments.myCourses') || (dir === 'rtl' ? 'دوراتي' : 'My Courses')}
          </NavLink>

          <NavLink to="/instructor-dashboard/saved-books" className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">bookmarks</span>
            <span>{dir === 'rtl' ? 'الكتب المحفوظة' : 'Saved Books'}</span>
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#E8E2D5] dark:border-gray-800 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 hover:border-rose-400 hover:text-rose-500 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl flex items-center justify-center font-bold transition-all duration-200 shadow-xs"
          >
            <span className="material-symbols-outlined ml-2 text-lg">logout</span>
            {t('adminDashboard.logout')}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2] dark:bg-gray-900 relative transition-colors w-full">
        
        {/* Header */}
        <header className="h-14 sm:h-16 md:h-20 bg-[#F3EFE6]/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#E8E2D5] dark:border-gray-800 flex items-center justify-between px-3 sm:px-6 md:px-8 shrink-0 sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">menu</span>
            </button>

            <NotificationDropdown />

            <button
              onClick={toggleLang}
              title={lang === 'ar' ? 'English' : 'عربي'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm sm:text-lg">language</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm sm:text-lg">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          <h2 className="text-sm sm:text-base md:text-xl font-bold text-dark dark:text-white truncate max-w-32.5 sm:max-w-xs md:max-w-none text-end">{t('instructorDashboard.dashboardTitle')}</h2>
        </header>

        {/* Page Content — scrollable independently */}
        <div className={`flex-1 ${isMessages ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-8">
              <PageLoader size="sm" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;
