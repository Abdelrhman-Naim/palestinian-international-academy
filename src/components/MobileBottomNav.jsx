"use client";
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

export default function MobileBottomNav() {
  const { dir } = useLanguage();
  const location = useLocation();
  const { currentUser, userRole } = useAuth();
  const { unreadTotal } = useUnreadMessages();
  const isRtl = dir === 'rtl';

  const hideOnPaths = ['/login', '/register', '/login-admin', '/login-trainer'];
  if (hideOnPaths.includes(location.pathname)) return null;

  const profileRoute = !currentUser
    ? '/login'
    : userRole === 'admin'
    ? '/admin-dashboard/profile'
    : userRole === 'instructor'
    ? '/instructor-dashboard/profile'
    : '/dashboard/profile';

  const messagesRoute = !currentUser
    ? '/login'
    : userRole === 'admin'
    ? '/admin-dashboard/messages'
    : userRole === 'instructor'
    ? '/instructor-dashboard/messages'
    : '/dashboard/messages';

  const navItems = [
    {
      id: 'nav-home',
      to: '/',
      label: isRtl ? 'الرئيسية' : 'Home',
      icon: 'home',
      exact: true,
    },
    {
      id: 'nav-courses',
      to: '/courses',
      label: isRtl ? 'الكورسات' : 'Courses',
      icon: 'school',
    },
    {
      id: 'nav-library',
      to: '/library',
      label: isRtl ? 'المكتبة' : 'Library',
      icon: 'local_library',
    },
    {
      id: 'nav-messages',
      to: messagesRoute,
      label: isRtl ? 'الرسائل' : 'Messages',
      icon: 'chat',
      badge: unreadTotal,
    },
    {
      id: 'nav-profile',
      to: profileRoute,
      label: isRtl ? 'حسابي' : 'Profile',
      icon: 'person',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full bg-white dark:bg-[#18181b] border-t border-gray-200 dark:border-gray-800" dir={dir}>
      <nav className="flex items-center justify-between px-2 h-14 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1 px-2 transition-all duration-200 grow text-center ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'filled scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -end-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs border border-white dark:border-gray-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 truncate max-w-[56px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
