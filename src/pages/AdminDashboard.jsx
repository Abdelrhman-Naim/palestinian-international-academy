import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import NotificationDropdown from '../components/NotificationDropdown';

const navItemClass = ({ isActive }) =>
  `flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold ${
    isActive
      ? 'bg-primary text-white font-bold shadow-lg shadow-primary/25 dark:bg-primary dark:text-gray-950 dark:shadow-primary/30'
      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:shadow-xs'
  }`;

const AdminDashboard = () => {
  const { t, dir, toggleLang, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const { unreadTotal } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const isMessages = location.pathname.includes('/messages');
  const { logout } = useAuth();
  const [openMenus, setOpenMenus] = useState({
    courses: true,
    library: true,
    users: true,
    instructors: true,
  });

  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin-login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) {
          const pending = data.filter(u => 
            u.role === 'instructor' && (u.status === 'pending' || u.is_approved === false || u.is_approved === null)
          );
          setPendingCount(pending.length);
        }
      } catch (err) {
        console.warn('Pending count fetch error:', err);
      }
    }

    fetchPendingCount();

    const channel = supabase
      .channel('admin-dashboard-pending-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchPendingCount();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const toggleMenu = (menu) => {

    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden font-alexandria bg-[#FAF7F2] dark:bg-gray-900 relative" dir={dir}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 max-w-[85vw] sm:max-w-xs md:max-w-none bg-[#F3EFE6] dark:bg-gray-900 text-dark dark:text-white border-e border-[#E8E2D5] dark:border-gray-800 flex flex-col h-full shrink-0 z-50 shadow-lg overflow-y-auto custom-scrollbar fixed md:relative transition-transform duration-300 inset-y-0 start-0 md:inset-auto ${isSidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full max-md:rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0'}`}>
        <div className="h-20 sm:h-24 flex items-center justify-between px-4 sm:px-6 border-b border-[#E8E2D5] dark:border-gray-800 shrink-0">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-center group">
            <img src={logo} alt="Logo" className="h-12 sm:h-14 w-auto object-contain rounded-xl drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={t('adminDashboard.closeSidebar') || 'إغلاق القائمة الجانبية'}
            title={t('adminDashboard.closeSidebar') || 'إغلاق القائمة الجانبية'}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <Link 
          to="/admin-dashboard/profile" 
          onClick={() => setIsSidebarOpen(false)}
          className="p-6 flex flex-col items-center border-b border-[#E8E2D5] dark:border-gray-800 shrink-0 group hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary to-primary text-white flex items-center justify-center text-xl font-bold mb-3 shadow-lg shadow-primary/20 ring-4 ring-primary/20 group-hover:scale-105 transition-transform">
            أ.م
          </div>
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">{t('adminDashboard.adminTitle')}</h2>
          <span className="text-xs text-primary dark:text-primary uppercase tracking-wider mt-1 font-label-caps font-extrabold">
            Administrator
          </span>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-2">
          <NavLink to="/admin-dashboard" end onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">dashboard</span>
            {t('adminOverview.mainStats')}
          </NavLink>

          <NavLink to="/admin-dashboard/profile" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">person</span>
            {isRtl ? 'الملف الشخصي' : 'Profile'}
          </NavLink>

          <NavLink to="/admin-dashboard/messages" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <span className="material-symbols-outlined ml-3 text-lg">forum</span>
            <span className="flex-1">{t('chat.conversations')}</span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow-xs animate-pulse">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </NavLink>

          <div className="pt-2">
            <button
              onClick={() => toggleMenu('instructors')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
              aria-expanded={openMenus.instructors}
            >
              {t('adminRequests.parent')}
              <span
                className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                  openMenus.instructors ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <AnimatePresence>
              {openMenus.instructors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <NavLink to="/admin-dashboard/requests" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <span className="material-symbols-outlined ml-3 text-base">how_to_reg</span>
                        {t('adminRequests.title')}
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
                      )}
                    </span>
                  </NavLink>

                  <NavLink to="/admin-dashboard/instructors" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">badge</span>
                    {t('adminInstructors.title')}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2">
            <button
              onClick={() => toggleMenu('users')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
              aria-expanded={openMenus.users}
            >
              {t('adminUsers.parent')}
              <span
                className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                  openMenus.users ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <AnimatePresence>
              {openMenus.users && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <NavLink to="/admin-dashboard/users" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">group</span>
                    {t('adminUsers.title')}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2">
            <button
              onClick={() => toggleMenu('courses')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
              aria-expanded={openMenus.courses}
            >
              {t('adminCategories.parent')}
              <span
                className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                  openMenus.courses ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <AnimatePresence>
              {openMenus.courses && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <NavLink to="/admin-dashboard/courses" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">school</span>
                    {t('adminDashboard.coursesList')}
                  </NavLink>
                  <NavLink to="/admin-dashboard/course-categories" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">category</span>
                    {t('adminCategories.title')}
                  </NavLink>
                  <NavLink to="/admin-dashboard/add-course" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">add_circle</span>
                    {t('adminDashboard.addNewCourse')}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2 pb-4">
            <button
              onClick={() => toggleMenu('library')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
              aria-expanded={openMenus.library}
            >
              {t('adminLibraryCategories.parent')}
              <span
                className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                  openMenus.library ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <AnimatePresence>
              {openMenus.library && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <NavLink to="/admin-dashboard/library" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">auto_stories</span>
                    {t('adminDashboard.libraryContent')}
                  </NavLink>
                  <NavLink to="/admin-dashboard/library-categories" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">category</span>
                    {t('adminDashboard.libraryCategories')}
                  </NavLink>
                  <NavLink to="/admin-dashboard/add-book" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <span className="material-symbols-outlined ml-3 text-base">add_box</span>
                    {t('adminDashboard.addBook')}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2 border-t border-[#E8E2D5] dark:border-gray-800">
            <NavLink to="/admin-dashboard/settings" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
              <span className="material-symbols-outlined ml-3 text-lg">settings</span>
              {t('adminSettings.title')}
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-[#E8E2D5] dark:border-gray-800 space-y-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 hover:border-rose-400 hover:text-rose-500 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl flex items-center justify-center font-bold transition-all duration-200 shadow-xs"
          >
            {t('adminDashboard.logout')}
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-full ${isMessages ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#FAF7F2] dark:bg-gray-900 relative transition-colors w-full`}>
        <header className="h-14 sm:h-16 md:h-20 bg-[#F3EFE6]/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#E8E2D5] dark:border-gray-800 flex items-center justify-between px-2.5 sm:px-6 md:px-8 shrink-0 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
              aria-label={t('adminDashboard.openSidebar') || 'فتح القائمة الجانبية'}
              title={t('adminDashboard.openSidebar') || 'فتح القائمة الجانبية'}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">menu</span>
            </button>

            <NotificationDropdown />

            <button
              onClick={toggleLang}
              title={lang === 'ar' ? 'English' : 'عربي'}
              aria-label={t('adminDashboard.changeLanguage') || (lang === 'ar' ? 'English' : 'عربي')}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm sm:text-lg">language</span>
            </button>

            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? (dir === 'rtl' ? 'تفعيل الوضع النهاري' : 'Switch to light mode') : (dir === 'rtl' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode')}
              aria-label={t('adminDashboard.toggleTheme') || 'تبديل المظهر'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm sm:text-lg">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          <h2 className="text-xs sm:text-base md:text-xl font-bold text-dark dark:text-white truncate max-w-[130px] sm:max-w-xs md:max-w-none text-end shrink min-w-0">
            {t('adminDashboard.dashboardTitle')}
          </h2>
        </header>

        {isMessages ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

