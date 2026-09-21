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
      to: '/',
      label: isRtl ? 'الرئيسية' : 'Home',
      icon: 'home',
      exact: true,
    },
    {
      to: '/courses',
      label: isRtl ? 'الكورسات' : 'Courses',
      icon: 'school',
    },
    {
      to: '/library',
      label: isRtl ? 'المكتبة' : 'Library',
      icon: 'local_library',
    },
    {
      to: messagesRoute,
      label: isRtl ? 'الرسائل' : 'Messages',
      icon: 'chat',
      badge: unreadTotal,
    },
    {
      to: profileRoute,
      label: isRtl ? 'حسابي' : 'Profile',
      icon: 'person',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-4 inset-x-3 z-50 max-w-md mx-auto pointer-events-none" dir={dir}>
      <nav className="pointer-events-auto bg-stone-900/95 dark:bg-gray-900/95 backdrop-blur-xl border border-stone-700/60 dark:border-gray-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.45)] rounded-full px-2 py-1.5 flex items-center justify-between transition-all select-none">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-300 grow text-center ${
                isActive
                  ? 'bg-primary/25 text-primary font-bold shadow-xs scale-105'
                  : 'text-stone-400 dark:text-gray-400 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className={`material-symbols-outlined text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -end-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[56px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
