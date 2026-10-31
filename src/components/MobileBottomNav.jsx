"use client";

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
const HIDDEN_PATHS = ['/chat'];

// Navigation item definitions with localized text and Material icons
const NAV_CONFIG = [
  {
    id: 'home',
    path: '/',
    exact: true,
    icon: 'home',
    labelAr: 'الرئيسية',
    labelEn: 'Home',
  },
  {
    id: 'library',
    path: '/library',
    exact: false,
    icon: 'local_library',
    labelAr: 'المكتبة',
    labelEn: 'Library',
  },
  {
    id: 'courses',
    path: '/courses',
    exact: false,
    icon: 'school',
    labelAr: 'الدورات',
    labelEn: 'Courses',
  },
  {
    id: 'dashboard',
    isDynamic: true,
    icon: 'space_dashboard',
    labelAr: 'لوحة التحكم',
    labelEn: 'Dashboard',
  },
];

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================
const resolveDashboardPath = (currentUser, userRole) => {
  if (!currentUser) return '/login';
  if (userRole === 'admin') return '/admin-dashboard';
  if (userRole === 'instructor') return '/instructor-dashboard';
  return '/dashboard';
};

const checkIsActive = (item, currentPath) => {
  if (item.id === 'home') {
    return currentPath === '/';
  }
  if (item.id === 'library') {
    return currentPath.startsWith('/library');
  }
  if (item.id === 'courses') {
    return currentPath.startsWith('/courses');
  }
  if (item.id === 'dashboard') {
    return (
      currentPath.startsWith('/dashboard') ||
      currentPath.startsWith('/admin-dashboard') ||
      currentPath.startsWith('/instructor-dashboard') ||
      currentPath === '/login' ||
      currentPath === '/login-admin' ||
      currentPath === '/login-trainer'
    );
  }
  return false;
};

// ============================================================================
// 4. SUB-COMPONENT: NavTabItem
// ============================================================================
function NavTabItem({ item, isActive, resolvedPath, label, badgeCount }) {
  return (
    <Link
      to={resolvedPath}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex flex-col items-center justify-center py-1.5 px-1 min-h-[56px] transition-all duration-200 select-none ${
        isActive
          ? 'text-amber-600 dark:text-[#D9A54C]'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
      }`}
    >
      {/* Icon Wrapper with pill highlight on active */}
      <div
        className={`relative flex items-center justify-center px-3 py-1 rounded-full transition-all duration-300 ${
          isActive
            ? 'bg-amber-500/15 dark:bg-amber-500/20 scale-105 shadow-xs'
            : 'group-hover:bg-stone-200/50 dark:group-hover:bg-stone-800/50'
        }`}
      >
        <span
          className="material-symbols-outlined text-[23px] transition-transform duration-200"
          style={{
            fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
          }}
        >
          {item.icon}
        </span>

        {/* Optional Notification/Unread badge */}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs border-2 border-white dark:border-[#141210]">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        className={`text-[11px] mt-0.5 tracking-tight transition-colors duration-200 truncate max-w-[70px] ${
          isActive ? 'font-bold' : 'font-medium'
        }`}
      >
        {label}
      </span>

      {/* Active Indicator Micro-dot */}
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D9A54C] mt-0.5 animate-fade-in" />
      )}
    </Link>
  );
}

// ============================================================================
// 5. MAIN COMPONENT: MobileBottomNav
// ============================================================================
export default function MobileBottomNav() {
  const { dir, language } = useLanguage();
  const location = useLocation();
  const { currentUser, userRole } = useAuth();
  const { unreadTotal } = useUnreadMessages();

  const currentPath = location.pathname;
  const isAr = language === 'ar' || dir === 'rtl';

  // Guard clause: Hide on full-screen flows (like in-app active chat keyboard)
  if (HIDDEN_PATHS.includes(currentPath)) {
    return null;
  }

  const dashboardPath = resolveDashboardPath(currentUser, userRole);

  return (
    <nav
      aria-label={isAr ? 'شريط التنقل السفلي للهاتف' : 'Mobile Bottom Navigation'}
      dir={dir}
      className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#141210]/95 backdrop-blur-xl border-t border-[#E8E2D5] dark:border-stone-800/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_28px_rgba(0,0,0,0.5)] transition-colors"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="grid grid-cols-4 items-center justify-around px-1 max-w-lg mx-auto">
        {NAV_CONFIG.map((item) => {
          const isActive = checkIsActive(item, currentPath);
          const resolvedPath = item.isDynamic ? dashboardPath : item.path;
          const label = isAr ? item.labelAr : item.labelEn;
          const badgeCount = item.id === 'dashboard' && currentUser ? unreadTotal : 0;

          return (
            <NavTabItem
              key={item.id}
              item={item}
              isActive={isActive}
              resolvedPath={resolvedPath}
              label={label}
              badgeCount={badgeCount}
            />
          );
        })}
      </div>
    </nav>
  );
}
