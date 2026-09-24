import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCourses } from '../context/CoursesContext';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from '../services/notificationService';

export default function NotificationDropdown() {
  const { currentUser, userRole } = useAuth();
  const { t, lang, dir } = useLanguage();
  const { rawCourses } = useCourses();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const unsub = subscribeToUserNotifications(userId, (data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.id, currentUser?.uid]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Resolves an intelligent, role-aware deep link for a notification.
   * Guarantees that the destination opens the exact target entity without Guard redirection.
   */
  const resolveNotificationLink = (notif) => {
    if (!notif) return null;

    const metadata = notif.metadata || {};
    const type = notif.type || notif.target_type || metadata.target_type || '';
    let courseId = notif.courseId || notif.target_id || metadata.courseId || metadata.target_id || null;
    const rawLink = typeof notif.link === 'string' ? notif.link.trim() : '';

    // Extract student name or course title from message or metadata if present
    let extractedName = metadata.studentName || '';
    let extractedCourse = metadata.courseTitle || '';
    const message = notif.message || notif.message_en || '';
    const title = notif.title || notif.title_en || '';
    const fullText = `${title} ${message}`;

    if (!extractedName || !extractedCourse) {
      const quoteMatches = [...message.matchAll(/«([^»]+)»/g)].map(m => m[1]);
      if (quoteMatches.length >= 1) {
        if (type === 'enrollment') {
          extractedName = extractedName || quoteMatches[0];
          if (quoteMatches[1]) extractedCourse = extractedCourse || quoteMatches[1];
        } else if (type === 'course' || type === 'lecture' || type === 'exam' || type === 'submission') {
          extractedCourse = extractedCourse || quoteMatches[0];
        }
      }
    }

    // Try matching course title in rawCourses if courseId is missing
    if (!courseId && rawCourses?.length) {
      const matched = rawCourses.find(c => {
        const tAr = (c.title || '').trim().toLowerCase();
        const tEn = (c.title_en || '').trim().toLowerCase();
        return (tAr && tAr.length > 2 && fullText.toLowerCase().includes(tAr)) ||
               (tEn && tEn.length > 2 && fullText.toLowerCase().includes(tEn));
      });
      if (matched) {
        courseId = matched.id;
      }
    }

    // Check message contents for implicit type triggers if type is generic
    const isExamType = type === 'exam' || type === 'exam_passed' || type === 'quiz' || type === 'graduation' ||
      fullText.includes('اختبار') || fullText.includes('التخرج') || fullText.includes('امتحان');
    const isSubmissionType = type === 'submission' || fullText.includes('تسليم') || fullText.includes('إجابة');
    const isAssignmentType = type === 'assignment' || fullText.includes('واجب');

    // 1. ADMIN ROLE
    if (userRole === 'admin') {
      if (type === 'enrollment') {
        if (courseId) {
          return `/admin-dashboard/course-students/${courseId}`;
        }
        if (extractedCourse && rawCourses?.length) {
          const matched = rawCourses.find(c =>
            (c.title || '').trim().toLowerCase() === extractedCourse.trim().toLowerCase() ||
            (c.title_en || '').trim().toLowerCase() === extractedCourse.trim().toLowerCase()
          );
          if (matched) {
            return `/admin-dashboard/course-students/${matched.id}`;
          }
        }
        if (rawLink && rawLink.includes('/course-students/')) {
          return rawLink;
        }
        if (extractedName) {
          return `/admin-dashboard/users?search=${encodeURIComponent(extractedName)}`;
        }
        return '/admin-dashboard/courses';
      }

      if (type === 'course' || type === 'lecture') {
        if (courseId) {
          return `/admin-dashboard/edit-course/${courseId}`;
        }
        if (extractedCourse) {
          return `/admin-dashboard/courses?search=${encodeURIComponent(extractedCourse)}`;
        }
        return '/admin-dashboard/courses';
      }

      if (isSubmissionType || isAssignmentType) {
        if (courseId) {
          return `/admin-dashboard/edit-course/${courseId}`;
        }
        return '/admin-dashboard/courses';
      }

      if (type === 'certificate' || isExamType) {
        if (metadata.certificateId) {
          return `/verify-certificate/${metadata.certificateId}`;
        }
        if (extractedName) {
          return `/admin-dashboard/users?search=${encodeURIComponent(extractedName)}`;
        }
        return '/admin-dashboard/users';
      }

      if (rawLink) {
        if (rawLink.startsWith('/admin-dashboard')) {
          return rawLink;
        }
        if (rawLink.startsWith('/courses/') || rawLink.startsWith('/library/') || rawLink.startsWith('/verify-certificate')) {
          return rawLink;
        }
        if (courseId) {
          return `/admin-dashboard/edit-course/${courseId}`;
        }
        if (rawLink.includes('course')) {
          return '/admin-dashboard/courses';
        }
        if (rawLink.includes('user') || rawLink.includes('student')) {
          return '/admin-dashboard/users';
        }
        return '/admin-dashboard';
      }

      return '/admin-dashboard';
    }

    // 2. INSTRUCTOR ROLE
    if (userRole === 'instructor') {
      if (isExamType) {
        if (courseId) {
          return `/instructor-dashboard/exam/${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      if (isSubmissionType) {
        if (courseId) {
          return `/instructor-dashboard/submissions/${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      if (isAssignmentType) {
        if (courseId) {
          return `/instructor-dashboard/assignments/${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      if (type === 'message' || type === 'chat') {
        return '/instructor-dashboard/messages';
      }

      if (type === 'enrollment') {
        if (courseId) {
          return `/instructor-dashboard/my-courses?highlightCourse=${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      if (type === 'course' || type === 'lecture') {
        if (courseId) {
          return `/instructor-dashboard/edit-course/${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      if (rawLink) {
        if (rawLink.includes('/course-students/') || rawLink.includes('/admin-dashboard/')) {
          const cId = courseId || rawLink.split('/').filter(Boolean).pop();
          return cId && !cId.includes('admin') ? `/instructor-dashboard/my-courses?highlightCourse=${cId}` : '/instructor-dashboard/my-courses';
        }
        if (rawLink.startsWith('/instructor-dashboard')) {
          if (rawLink.includes('/manage-assignments/')) {
            const cId = rawLink.split('/').filter(Boolean).pop();
            return `/instructor-dashboard/assignments/${cId}`;
          }
          return rawLink;
        }
        if (rawLink.startsWith('/courses/') || rawLink.startsWith('/verify-certificate')) {
          return rawLink;
        }
        if (rawLink.includes('assignment')) {
          return courseId ? `/instructor-dashboard/assignments/${courseId}` : '/instructor-dashboard/my-courses';
        }
        if (rawLink.includes('submission')) {
          return courseId ? `/instructor-dashboard/submissions/${courseId}` : '/instructor-dashboard/my-courses';
        }
        if (courseId) {
          return `/instructor-dashboard/edit-course/${courseId}`;
        }
        return '/instructor-dashboard/my-courses';
      }

      return '/instructor-dashboard';
    }

    // 3. STUDENT ROLE
    if (userRole === 'student') {
      if (type === 'certificate') {
        return '/dashboard/certificates';
      }
      if (type === 'assignment') {
        return '/dashboard/assignments';
      }
      if (type === 'course' || type === 'lecture' || type === 'enrollment') {
        return '/dashboard/my-courses';
      }

      if (rawLink) {
        if (rawLink.startsWith('/dashboard')) {
          return rawLink;
        }
        if (rawLink.startsWith('/courses/') || rawLink.startsWith('/verify-certificate')) {
          return rawLink;
        }
        return '/dashboard/my-courses';
      }

      return '/dashboard';
    }

    // 4. Default / Guest
    if (rawLink && (rawLink.startsWith('/courses/') || rawLink.startsWith('/verify-certificate'))) {
      return rawLink;
    }
    return '/';
  };

  // Handle clicking a notification
  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
    const targetLink = resolveNotificationLink(notif);
    if (targetLink) {
      navigate(targetLink);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    const uid = currentUser?.id || currentUser?.uid;
    if (!uid) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead(uid);
  };

  // Clear all notifications
  const handleClearAll = async (e) => {
    e.stopPropagation();
    const uid = currentUser?.id || currentUser?.uid;
    if (!uid) return;
    setNotifications([]);
    setUnreadCount(0);
    await clearAllNotifications(uid);
  };

  // Delete single notification
  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    await deleteNotification(notifId);
  };

  // Format relative time
  const formatTimeAgo = (millis) => {
    if (!millis) return '';
    const diff = Math.max(0, Date.now() - millis);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) {
      return t('notifications.justNow');
    }
    if (mins < 60) {
      if (mins === 1) return t('notifications.minuteAgo');
      return t('notifications.minutesAgo').replace('{{count}}', mins);
    }
    if (hours < 24) {
      if (hours === 1) return t('notifications.hourAgo');
      return t('notifications.hoursAgo').replace('{{count}}', hours);
    }
    if (days === 1) return t('notifications.dayAgo');
    if (days < 30) {
      return t('notifications.daysAgo').replace('{{count}}', days);
    }
    return new Date(millis).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Type configuration (icon, color theme)
  const getTypeConfig = (type) => {
    switch (type) {
      case 'lecture':
        return {
          icon: 'play_lesson',
          bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50',
          badge: 'bg-sky-500'
        };
      case 'assignment':
        return {
          icon: 'assignment',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
          badge: 'bg-amber-500'
        };
      case 'enrollment':
        return {
          icon: 'person_add',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
          badge: 'bg-emerald-500'
        };
      case 'submission':
        return {
          icon: 'upload_file',
          bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
          badge: 'bg-purple-500'
        };
      case 'course':
        return {
          icon: 'school',
          bg: 'bg-orange-50 dark:bg-orange-950/40 text-[#D4AF37] dark:text-amber-400 border-orange-200 dark:border-orange-800/50',
          badge: 'bg-orange-500'
        };
      default:
        return {
          icon: 'notifications',
          bg: 'bg-[#FAF7F2] dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-[#E8E2D5] dark:border-gray-700',
          badge: 'bg-gray-400'
        };
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative inline-block" ref={dropdownRef} dir={dir}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border ${
          isOpen
            ? 'border-primary dark:border-primary text-primary shadow-sm'
            : 'border-[#E8E2D5] dark:border-gray-700 text-gray-700 dark:text-gray-200'
        } flex items-center justify-center hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-xs relative`}
        title={t('notifications.title')}
        aria-label={t('notifications.title')}
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-sm sm:text-lg">notifications</span>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40"></span>
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute top-full mt-2.5 z-50 ${
              dir === 'rtl' ? 'right-0' : 'left-0'
            } w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] rounded-2xl bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col text-start`}
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                  {t('notifications.title')}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    {unreadCount} {t('notifications.unreadCount')}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-primary hover:text-orange-600 dark:hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0"
                  title={t('notifications.markAllAsRead')}
                >
                  <span className="material-symbols-outlined text-sm">done_all</span>
                  <span className="hidden sm:inline">{t('notifications.markAllAsRead')}</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-3 pt-2.5 border-b border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`pb-2 px-2 text-xs font-bold transition-all relative ${
                  filter === 'all'
                    ? 'text-primary dark:text-amber-400'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('notifications.all')} ({notifications.length})
                {filter === 'all' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-primary dark:bg-amber-400 rounded-full"
                  />
                )}
              </button>

              <button
                onClick={() => setFilter('unread')}
                className={`pb-2 px-2 text-xs font-bold transition-all relative ${
                  filter === 'unread'
                    ? 'text-primary dark:text-amber-400'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('notifications.unread')} ({unreadCount})
                {filter === 'unread' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-primary dark:bg-amber-400 rounded-full"
                  />
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-[#E8E2D5]/60 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
              {loading ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-400 mx-auto mb-3">
                    <span className="material-symbols-outlined text-2xl">notifications_off</span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {filter === 'unread'
                      ? t('notifications.noUnread')
                      : t('notifications.noNotifications')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 max-w-[240px] mx-auto">
                    {t('notifications.noNotificationsDesc')}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const typeCfg = getTypeConfig(notif.type);
                  const title = lang === 'en' && notif.title_en ? notif.title_en : notif.title;
                  const message = lang === 'en' && notif.message_en ? notif.message_en : notif.message;
                  const timeText = formatTimeAgo(notif._timestampMillis);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                        !notif.isRead
                          ? 'bg-[#FAF7F2] dark:bg-gray-800/90 hover:bg-[#F3EFE6] dark:hover:bg-gray-700/80'
                          : 'bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] dark:hover:bg-gray-700/70'
                      }`}
                    >
                      {/* Unread indicator bar */}
                      {!notif.isRead && (
                        <div className="absolute top-0 bottom-0 start-0 w-1 bg-primary dark:bg-amber-400"></div>
                      )}

                      {/* Icon */}
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 ${typeCfg.bg}`}>
                        <span className="material-symbols-outlined text-lg sm:text-xl">{typeCfg.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs sm:text-sm font-bold truncate ${
                            !notif.isRead
                              ? 'text-dark dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {title}
                          </h4>
                          <span className="text-[10px] text-gray-400 dark:text-gray-400 shrink-0">
                            {timeText}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {message}
                        </p>

                        {/* Direct link action button */}
                        {(() => {
                          const targetLink = resolveNotificationLink(notif);
                          if (!targetLink) return null;
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(notif);
                              }}
                              className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-white dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400 dark:hover:text-gray-900"
                            >
                              <span>{t('notifications.view')}</span>
                              <span className="material-symbols-outlined text-xs">
                                {dir === 'rtl' ? 'arrow_back' : 'arrow_forward'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Delete notification button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-rose-500 rounded-lg shrink-0"
                        title={t('notifications.delete')}
                        aria-label={t('notifications.delete') || (dir === 'rtl' ? 'حذف التنبيه' : 'Delete notification')}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-[#FAF7F2] dark:bg-gray-900/60 border-t border-[#E8E2D5] dark:border-gray-700 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  {notifications.length} {t('notifications.title')}
                </span>
                <button
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-rose-500 transition-colors font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">delete_sweep</span>
                  <span>{t('notifications.clearAll')}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
