import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const { currentUser, userRole, userData, logout } = useAuth();
  const { t, toggleLang, lang } = useLanguage();
  const { unreadTotal } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Determine dashboard, profile and messages routes based on role
  const dashboardRoute =
    userRole === 'admin' ? '/admin-dashboard' :
    userRole === 'instructor' ? '/instructor-dashboard' :
    '/dashboard';

  const profileRoute =
    userRole === 'admin' ? '/admin-dashboard/profile' :
    userRole === 'instructor' ? '/instructor-dashboard/profile' :
    '/dashboard/profile';

  const messagesRoute =
    userRole === 'admin' ? '/admin-dashboard/messages' :
    userRole === 'instructor' ? '/instructor-dashboard/messages' :
    '/dashboard/messages';

  const name = userData?.name || userData?.fullName || currentUser?.email || '';
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const roleLabel =
    userRole === 'admin' ? t('navbar.admin') :
    userRole === 'instructor' ? t('navbar.instructor') :
    t('navbar.student');

  return (
    <header className="flex justify-between items-center px-4 md:px-30 h-20 w-full mx-auto bg-[#FAF7F2]/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-[#E8E2D5]/70 dark:border-white/5 sticky top-0 transition-all duration-300">
      
      {/* Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link className="flex items-center gap-2 group" to="/">
          <img src={logo} alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)" className="h-12 md:h-14 w-auto object-contain rounded-lg drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
        </Link>
        
        <nav className="hidden md:flex gap-1">
          {[
            { path: '/courses', label: 'navbar.courses' },
            { path: '/library', label: 'navbar.library' },
            { path: '/about', label: 'navbar.about' }
          ].map(link => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link key={link.path} to={link.path} className={`relative px-4 py-2 font-label-caps text-sm tracking-wider font-bold transition-all duration-300 group ${isActive ? 'text-primary' : 'text-stone-800 dark:text-gray-100 hover:text-primary'}`}>
                {t(link.label)}
                <span className={`absolute bottom-0 inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 h-0.5 bg-primary transition-all duration-300 rounded-t-md ${isActive ? 'w-1/2 opacity-100' : 'w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-50'}`}></span>
              </Link>
            );
          })}
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 my-auto mx-2"></div>
          
          <Link to="/partnerships" className="relative px-3 py-2 font-label-caps text-sm tracking-wider font-bold text-stone-800 dark:text-gray-200 hover:text-primary transition-all duration-300 group">
            {t('navbar.organizations')}
          </Link>
          <Link to="/partnerships" className="relative px-3 py-2 font-label-caps text-sm tracking-wider font-bold text-stone-800 dark:text-gray-200 hover:text-primary transition-all duration-300 group">
            {t('navbar.partnerships')}
          </Link>
        </nav>
      </div>
      
      {/* Right Side */}
      <div className="flex items-center gap-3">

        {/* Dark mode + Language */}
        <div className="flex gap-2 text-text-main dark:text-gray-200">
          <button 
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'ar' ? 'التغيير إلى اللغة الإنجليزية' : 'Switch to Arabic language'}
            title={lang === 'ar' ? 'English' : 'العربية'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">
              language
            </span>
          </button>
          <button 
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? (lang === 'ar' ? 'تفعيل الوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to Dark Mode')}
            title={isDarkMode ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        {currentUser ? (
          /* ============ LOGGED IN STATE ============ */
          <div className="flex items-center gap-3">
            
            {/* Dashboard Button */}
            <Link
              to={dashboardRoute}
              className="hidden md:flex items-center gap-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/30 font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              {t('navbar.dashboard')}
            </Link>

            {/* Messages Quick Button with Unread Badge */}
            <Link
              to={messagesRoute}
              className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/30 transition-all duration-200 flex items-center justify-center cursor-pointer"
              title={t('chat.conversations')}
            >
              <span className="material-symbols-outlined text-[19px]">forum</span>
              {unreadTotal > 0 && (
                <span className="absolute -top-1.5 -end-1.5 px-1.5 py-0.2 min-w-[18px] text-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs animate-pulse">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(p => !p)}
                className="flex items-center gap-2 group min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                  {initials}
                </div>
                <span className="hidden md:block text-xs font-bold text-dark dark:text-white max-w-24 truncate">
                  {name.split(' ')[0]}
                </span>
                <span className="material-symbols-outlined text-[16px] text-gray-400 hidden md:block">
                  {dropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute rtl:left-0 ltr:right-0 top-14 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl shadow-xl py-2 z-50 origin-top rtl:origin-top-left ltr:origin-top-right"
                  >
                    
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-stone-200 dark:border-gray-700">
                      <p className="text-sm font-bold text-dark dark:text-white truncate">{name}</p>
                      <p className="text-xs text-primary font-bold mt-0.5">{roleLabel}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        to={dashboardRoute}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-gray-700 hover:text-primary transition-colors font-medium"
                      >
                        <span className="material-symbols-outlined text-base">dashboard</span>
                        {t('navbar.dashboard')}
                      </Link>

                      <Link
                        to={profileRoute}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-gray-700 hover:text-primary transition-colors font-medium"
                      >
                        <span className="material-symbols-outlined text-base">person</span>
                        {t('navbar.profile') || (lang === 'ar' ? 'الملف الشخصي' : 'Profile')}
                      </Link>

                      <Link
                        to={messagesRoute}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-gray-700 hover:text-primary transition-colors font-medium"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-base">forum</span>
                          {t('chat.conversations')}
                        </div>
                        {unreadTotal > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
                            {unreadTotal}
                          </span>
                        )}
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        {t('navbar.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ============ LOGGED OUT STATE (Non-competing Header Link) ============ */
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 text-stone-800 dark:text-white hover:border-primary hover:text-primary font-bold text-xs transition-all shadow-xs min-h-[44px] flex items-center justify-center uppercase tracking-wider"
            >
              {t('navbar.login')}
            </Link>
          </div>
        )}

        {/* Mobile Menu Button with guaranteed ≥44x44px Touch Target */}
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? (lang === 'ar' ? 'إغلاق القائمة الرئيسية' : 'Close main menu') : (lang === 'ar' ? 'فتح القائمة الرئيسية' : 'Open main menu')}
          className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-stone-800 dark:text-white hover:text-primary focus:outline-none transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-20 left-0 w-full bg-white dark:bg-gray-900 border-b border-stone-200 dark:border-gray-800 md:hidden flex flex-col px-6 py-6 space-y-4 shadow-xl overflow-hidden z-50"
          >
            <Link to="/about" onClick={() => setIsOpen(false)} className="font-label-caps text-sm font-bold text-stone-800 dark:text-gray-100 hover:text-primary py-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">info</span>
              <span>{t('navbar.about') || (lang === 'ar' ? 'من نحن' : 'About Us')}</span>
            </Link>
            <Link to="/partnerships" onClick={() => setIsOpen(false)} className="font-label-caps text-sm font-bold text-stone-800 dark:text-gray-100 hover:text-primary py-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">handshake</span>
              <span>{t('navbar.partnerships') || (lang === 'ar' ? 'الشراكات' : 'Partnerships')}</span>
            </Link>
            <Link to="/virtual-lab" onClick={() => setIsOpen(false)} className="font-label-caps text-sm font-bold text-stone-800 dark:text-gray-100 hover:text-primary py-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">biotech</span>
              <span>{lang === 'ar' ? 'المختبر الافتراضي' : 'Virtual Lab'}</span>
            </Link>
            <Link to="/support" onClick={() => setIsOpen(false)} className="font-label-caps text-sm font-bold text-stone-800 dark:text-gray-100 hover:text-primary py-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">help</span>
              <span>{lang === 'ar' ? 'مركز الدعم' : 'Support Center'}</span>
            </Link>

            <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-2"></div>

            {currentUser ? (
              <>
                <Link to={dashboardRoute} onClick={() => setIsOpen(false)} className="font-label-caps text-sm font-bold text-primary py-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  <span>{t('navbar.dashboard') || (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard')}</span>
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-start font-label-caps text-sm font-bold text-rose-600 py-1 flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>{t('navbar.logout')}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full h-12 min-h-[48px] border border-stone-300 dark:border-gray-700 text-stone-800 dark:text-white hover:border-primary font-bold rounded-xl flex items-center justify-center text-sm uppercase">{t('navbar.login')}</Link>
                <Link to="/courses" onClick={() => setIsOpen(false)} className="w-full h-12 min-h-[48px] bg-primary text-dark dark:text-gray-950 font-bold rounded-xl flex items-center justify-center text-sm shadow-md">{t('hero.cta1')}</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

