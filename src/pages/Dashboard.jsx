import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import NotificationDropdown from '../components/NotificationDropdown';

const navItemClass = ({ isActive }) =>
  `flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium border ${
    isActive
      ? 'bg-primary border-primary text-white font-bold shadow-sm'
      : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:border-[#E8E2D5] dark:hover:border-gray-700 hover:shadow-xs'
  }`;

const Dashboard = () => {
  const { t, dir, toggleLang, lang } = useLanguage();
  const { unreadTotal } = useUnreadMessages();
  const location = useLocation();
  const isMessages = location.pathname.includes('/messages');
  const [openMenus, setOpenMenus] = useState({
    learning: true,
    training: true,
    achievements: true,
  });
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, currentUser, userData } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleMenu = (menu) => {

    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden font-cairo bg-[#FAF7F2] dark:bg-gray-900 relative" dir={dir}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* BEGIN: Sidebar */}
      <aside className={`w-72 bg-[#F3EFE6] dark:bg-gray-900 text-dark dark:text-white border-e border-[#E8E2D5] dark:border-gray-800 flex flex-col h-full shrink-0 z-50 shadow-lg overflow-y-auto custom-scrollbar fixed md:relative transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} right-0`}>
        {/* Logo */}
        <div className="h-24 flex items-center justify-center relative px-6 border-b border-[#E8E2D5] dark:border-gray-800 shrink-0">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-center group">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain rounded-xl drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute end-4 md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        {/* User Profile Snippet */}
        <Link 
          to="/dashboard/profile" 
          onClick={() => setIsSidebarOpen(false)} 
          className="p-6 flex flex-col items-center border-b border-[#E8E2D5] dark:border-gray-800 shrink-0 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-3 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
            {userData?.photoURL || currentUser?.photoURL ? (
              <img src={userData?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>
                {(userData?.name || userData?.fullName || currentUser?.displayName || 'طالب')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {userData?.name || userData?.fullName || currentUser?.displayName || (dir === 'rtl' ? 'طالب' : 'Student')}
          </h2>
          <span className="text-xs text-primary dark:text-amber-400 uppercase tracking-wider mt-1 font-label-caps font-bold">Student</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-2">
          {/* Dashboard Overview */}
          <NavLink to="/dashboard" end onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <i className="fa-solid fa-gauge-high w-6 text-center ml-2 group-hover:text-primary transition-colors"></i>
            {t('instructorDashboard.overview')}
          </NavLink>

          <NavLink to="/dashboard/messages" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <i className="fa-regular fa-comments w-6 text-center ml-2 group-hover:text-primary transition-colors"></i>
            <span className="flex-1">{t('chat.conversations')}</span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow-xs animate-pulse">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </NavLink>
          
          {/* Profile */}
          <NavLink to="/dashboard/profile" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
            <i className="fa-regular fa-user w-6 text-center ml-2 group-hover:text-primary transition-colors"></i>
            {t('instructorDashboard.profile')}
          </NavLink>
          
          {/* Learning Section (Collapsible) */}
          <div className="pt-2">
            <button 
              onClick={() => toggleMenu('learning')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none"
            >
              {t('studentDashboard.learning')}
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${openMenus.learning ? '' : 'rotate-90'}`}></i>
            </button>
            
            <AnimatePresence>
              {openMenus.learning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <NavLink to="/dashboard/browse-courses" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <i className="fa-solid fa-magnifying-glass w-6 text-center ml-2 text-sm group-hover:text-primary transition-colors"></i>
                    {t('studentDashboard.browseCourses')}
                  </NavLink>
                  <NavLink to="/dashboard/my-courses" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <i className="fa-solid fa-graduation-cap w-6 text-center ml-2 text-sm group-hover:text-primary transition-colors"></i>
                    {t('submittedAssignments.myCourses')}
                  </NavLink>
                  <NavLink to="/dashboard/assignments" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <i className="fa-regular fa-file-lines w-6 text-center ml-2 text-sm group-hover:text-primary transition-colors"></i>
                    {t('studentMyCourses.assignments')}
                  </NavLink>
                  <NavLink to="/dashboard/saved-books" onClick={() => setIsSidebarOpen(false)} className={navItemClass}>
                    <i className="fa-solid fa-bookmark w-6 text-center ml-2 text-sm group-hover:text-primary transition-colors"></i>
                    {dir === 'rtl' ? 'الكتب المحفوظة' : 'Saved Books'}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Training & Projects (Collapsible) */}
          <div className="pt-2">
            <button 
              onClick={() => toggleMenu('training')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none"
            >
              {t('studentDashboard.training')}
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${openMenus.training ? '' : 'rotate-90'}`}></i>
            </button>
            
            <AnimatePresence>
              {openMenus.training && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <a className="flex items-center px-4 py-2.5 rounded-xl border border-transparent text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:border-[#E8E2D5] dark:hover:border-gray-700 hover:shadow-xs transition-all duration-200 group text-sm font-medium" href="#">
                    <i className="fa-solid fa-briefcase w-6 text-center ml-2 text-sm group-hover:text-secondary transition-colors"></i>
                    {t('studentDashboard.workspace')}
                  </a>
                  <a className="flex items-center px-4 py-2.5 rounded-xl border border-transparent text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:border-[#E8E2D5] dark:hover:border-gray-700 hover:shadow-xs transition-all duration-200 group text-sm font-medium" href="#">
                    <i className="fa-solid fa-rocket w-6 text-center ml-2 text-sm group-hover:text-secondary transition-colors"></i>
                    {t('studentDashboard.myProject')}
                  </a>
                  <a className="flex items-center px-4 py-2.5 rounded-xl border border-transparent text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:border-[#E8E2D5] dark:hover:border-gray-700 hover:shadow-xs transition-all duration-200 group text-sm font-medium" href="#">
                    <i className="fa-solid fa-diagram-project w-6 text-center ml-2 text-sm group-hover:text-secondary transition-colors"></i>
                    {t('studentDashboard.projectsShowcase')}
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Achievements (Collapsible) */}
          <div className="pt-2 pb-4">
            <button 
              onClick={() => toggleMenu('achievements')}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-dark dark:hover:text-white transition-colors focus:outline-none"
            >
              {t('studentDashboard.achievements')}
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${openMenus.achievements ? '' : 'rotate-90'}`}></i>
            </button>
            
            <AnimatePresence>
              {openMenus.achievements && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-1 pr-2 border-r-2 border-[#E8E2D5] dark:border-gray-700 mr-2 mt-1 overflow-hidden"
                >
                  <a className="flex items-center px-4 py-2.5 rounded-xl border border-transparent text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white hover:border-[#E8E2D5] dark:hover:border-gray-700 hover:shadow-xs transition-all duration-200 group text-sm font-medium" href="#">
                    <i className="fa-solid fa-trophy w-6 text-center ml-2 text-sm group-hover:text-secondary transition-colors"></i>
                    {t('studentDashboard.achievementsSection')}
                  </a>
                  <NavLink to="/dashboard/certificates" className={navItemClass}>
                    <i className="fa-solid fa-certificate w-6 text-center ml-2 text-sm group-hover:text-secondary transition-colors"></i>
                    {t('studentDashboard.certificates')}
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#E8E2D5] dark:border-gray-800 space-y-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 hover:border-rose-400 hover:text-rose-500 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl flex items-center justify-center transition-all font-semibold shadow-xs"
          >
            {t('adminDashboard.logout')}
          </button>
        </div>
      </aside>
      {/* END: Sidebar */}
      
      {/* BEGIN: Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2] dark:bg-gray-900 relative transition-colors w-full">
        {/* Top Header Bar */}
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
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-sm sm:text-lg`}></i>
            </button>
          </div>
          <h2 className="text-sm sm:text-base md:text-xl font-bold text-dark dark:text-white truncate max-w-[130px] sm:max-w-xs md:max-w-none text-end">{t('studentDashboard.dashboardTitle')}</h2>
        </header>

        {/* Outlet renders child routes */}
        <div className={`flex-1 ${isMessages ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          <Outlet />
        </div>
      </main>
      {/* END: Main Content Area */}
    </div>
  );
};

export default Dashboard;

