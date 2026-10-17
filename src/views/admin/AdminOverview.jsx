"use client";
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { useCourses } from '../../context/CoursesContext';
import { useLibrary } from '../../context/LibraryContext';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { formatCustomDateTime } from '../../utils/formatDate';

export default function AdminOverview() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { courses } = useCourses();
  const { books } = useLibrary();

  // Instant cache initialization from sessionStorage
  const [usersInfo, setUsersInfo] = useState(() => {
    try {
      const cached = sessionStorage.getItem('admin_overview_users_info');
      return cached ? JSON.parse(cached) : { students: 0, instructors: 0, pending: 0 };
    } catch (e) {
      return { students: 0, instructors: 0, pending: 0 };
    }
  });

  const [enrollmentsCount, setEnrollmentsCount] = useState(() => {
    try {
      const cached = sessionStorage.getItem('admin_overview_enrollments');
      return cached ? JSON.parse(cached) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [dbCoursesCount, setDbCoursesCount] = useState(courses.length || 0);
  const [dbBooksCount, setDbBooksCount] = useState(books.length || 0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Optimized parallel fetch from Supabase
  const fetchAllData = async () => {
    try {
      const [
        profilesRes,
        requestsRes,
        coursesCountRes,
        booksCountRes,
        logsRes,
        recentCoursesRes,
        recentProfilesRes,
        recentBooksRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, status, is_approved, created_at'),
        supabase.from('course_requests').select('id, student_name, student_email, course_title, status, created_at').order('created_at', { ascending: false }),
        supabase.from('courses').select('id, title, instructor_name, instructor, students_count, created_at', { count: 'exact' }),
        supabase.from('books').select('id, title, author, created_at', { count: 'exact' }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('courses').select('id, title, instructor_name, instructor, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('books').select('id, title, author, created_at').order('created_at', { ascending: false }).limit(4)
      ]);

      const profiles = profilesRes.data || [];
      const requests = requestsRes.data || [];

      let stu = 0;
      let inst = 0;
      let pendInst = 0;

      profiles.forEach(u => {
        const role = u.role;
        const status = u.status;
        const isApproved = u.is_approved;

        if (role === 'student' || (!role && role !== 'admin' && role !== 'instructor')) {
          stu++;
        } else if (role === 'instructor') {
          if (status === 'pending' || isApproved === false || isApproved === null) {
            pendInst++;
          } else {
            inst++;
          }
        }
      });

      const pendRequests = requests.filter(r => r.status === 'pending').length;
      const totalPending = pendInst + pendRequests;

      const newUsersInfo = { students: stu, instructors: inst, pending: totalPending, pendingInstructors: pendInst, pendingRequests: pendRequests };
      setUsersInfo(newUsersInfo);
      try { sessionStorage.setItem('admin_overview_users_info', JSON.stringify(newUsersInfo)); } catch (e) {}

      // Calculate exact real enrollments
      const approvedRequestsCount = requests.filter(e => e.status === 'approved').length;
      const courseStudentSum = (coursesCountRes.data || []).reduce((acc, curr) => acc + (Number(curr.students_count) || 0), 0);
      const newEnrollments = Math.max(approvedRequestsCount, courseStudentSum);
      setEnrollmentsCount(newEnrollments);
      try { sessionStorage.setItem('admin_overview_enrollments', JSON.stringify(newEnrollments)); } catch (e) {}

      if (coursesCountRes.count !== null && coursesCountRes.count !== undefined) {
        setDbCoursesCount(coursesCountRes.count);
      }
      if (booksCountRes.count !== null && booksCountRes.count !== undefined) {
        setDbBooksCount(booksCountRes.count);
      }

      // Compile real recent activities across all tables
      const toEpoch = (d) => {
        if (!d) return 0;
        const ms = new Date(d).getTime();
        return isNaN(ms) ? 0 : ms;
      };

      const acts = [];

      (logsRes.data || []).forEach(l => {
        acts.push({
          id: `log-${l.id}`,
          title: l.action || (isRtl ? 'إجراء إداري' : 'Admin Action'),
          user: l.user_name || (isRtl ? 'مدير النظام' : 'Administrator'),
          category: isRtl ? 'نشاط النظام' : 'System Activity',
          icon: 'admin_panel_settings',
          tone: 'rose',
          rawDate: l.created_at
        });
      });

      requests.slice(0, 4).forEach(r => {
        const isApproved = r.status === 'approved';
        acts.push({
          id: `req-${r.id}`,
          title: r.course_title ? (isRtl ? `تسجيل: ${r.course_title}` : `Enroll: ${r.course_title}`) : (isRtl ? 'طلب تسجيل دورة' : 'Course Request'),
          user: r.student_name || r.student_email || (isRtl ? 'طالب' : 'Student'),
          category: isApproved 
            ? (isRtl ? 'تسجيل معتمد' : 'Approved Enrollment')
            : (isRtl ? 'طلب تسجيل دورة' : 'Pending Request'),
          icon: isApproved ? 'how_to_reg' : 'pending_actions',
          tone: isApproved ? 'green' : 'primary',
          rawDate: r.created_at
        });
      });

      (recentCoursesRes.data || []).forEach(c => {
        acts.push({
          id: `course-${c.id}`,
          title: c.title || (isRtl ? 'دورة تدريبية جديدة' : 'New Course'),
          user: c.instructor_name || c.instructor || (isRtl ? 'مدرب' : 'Instructor'),
          category: isRtl ? 'نشر دورة' : 'New Course',
          icon: 'school',
          tone: 'primary',
          rawDate: c.created_at
        });
      });

      (recentProfilesRes.data || []).forEach(p => {
        const isInst = p.role === 'instructor';
        acts.push({
          id: `profile-${p.id}`,
          title: p.full_name || p.email || (isRtl ? 'مستخدم جديد' : 'New User'),
          user: p.email || '',
          category: isInst ? (isRtl ? 'طلب انضمام مدرب' : 'New Instructor') : (isRtl ? 'حساب طالب جديد' : 'New Student'),
          icon: isInst ? 'badge' : 'person_add',
          tone: isInst ? 'rose' : 'green',
          rawDate: p.created_at
        });
      });

      (recentBooksRes.data || []).forEach(b => {
        acts.push({
          id: `book-${b.id}`,
          title: b.title || (isRtl ? 'مرجع رقمي جديد' : 'New Book'),
          user: b.author || (isRtl ? 'المكتبة' : 'Library'),
          category: isRtl ? 'إضافة للمكتبة' : 'Library Book',
          icon: 'menu_book',
          tone: 'blue',
          rawDate: b.created_at
        });
      });

      acts.sort((a, b) => toEpoch(b.rawDate) - toEpoch(a.rawDate));
      // Deduplicate by ID
      const seen = new Set();
      const uniqueActs = [];
      for (const a of acts) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          uniqueActs.push(a);
        }
      }

      setRecentActivities(uniqueActs.slice(0, 5));
      setLoadingActivities(false);

    } catch (err) {
      console.warn('Fast fetch overview notice:', err?.message || err);
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Debounced realtime handler
    let debounceTimer = null;
    const handleRealtimeChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAllData();
      }, 600);
    };

    // Realtime listeners across key platform tables
    const channel = supabase
      .channel('admin-overview-multitable-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_requests' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, handleRealtimeChange)
      .subscribe();

    const interval = setInterval(fetchAllData, 30000);

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const stats = [
    {
      label: t('adminOverview.totalStudentAccounts'),
      value: usersInfo.students.toString(),
      subValue: `${enrollmentsCount} ${t('adminOverview.courseEnrollments')}`,
      subtitle: t('adminOverview.studentAccountsSubtitle'),
      icon: 'groups',
      tone: 'primary',
      to: '/admin-dashboard/users'
    },
    { 
      label: t('adminOverview.activeInstructors'), 
      value: usersInfo.instructors.toString(), 
      subtitle: isRtl ? 'المدربون المعتمدون بالمنصة' : 'Approved instructors on platform',
      icon: 'badge', 
      tone: 'rose', 
      to: '/admin-dashboard/instructors' 
    },
    { 
      label: t('adminOverview.publishedCourses'), 
      value: (dbCoursesCount || courses.length).toString(), 
      subtitle: isRtl ? 'الدورات المتاحة للطلاب' : 'Courses available for students',
      icon: 'school', 
      tone: 'green', 
      to: '/admin-dashboard/courses' 
    },
    { 
      label: t('adminOverview.libraryBooks'), 
      value: (dbBooksCount || books.length).toString(), 
      subtitle: isRtl ? 'المراجع والكتب الرقمية' : 'Digital reference books',
      icon: 'library_books', 
      tone: 'blue', 
      to: '/admin-dashboard/library' 
    },
  ];

  return (
    <AdminPageShell
      title={t('adminOverview.mainStats')}
      subtitle={t('adminOverview.statsSubtitle')}
      icon="dashboard"
    >
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/10 dark:border-gray-800 dark:bg-gray-800/90 dark:hover:border-primary dark:hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`flex h-13 w-13 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                  item.tone === 'primary'
                    ? 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15 dark:text-primary dark:border-primary/30'
                    : item.tone === 'rose'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40'
                      : item.tone === 'green'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                        : 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/40'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>

              {item.subValue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 dark:bg-primary/15 px-3 py-1 text-xs font-black text-primary dark:text-primary border border-primary/20 dark:border-primary/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary animate-pulse" />
                  {item.subValue}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{item.label}</p>
              <h3 className="text-4xl font-black tracking-tight text-dark dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors">
                {item.value}
              </h3>
              {item.subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-0.5 font-medium">
                  {item.subtitle}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Dashboard Content */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Requests Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E8E2D5] bg-gradient-to-br from-[#F3EFE6] via-white to-[#FAF7F2] p-7 shadow-sm dark:border-gray-700/80 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 lg:col-span-1 flex flex-col justify-between">
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <span className="material-symbols-outlined text-xl">how_to_reg</span>
                </span>
                <h3 className="text-lg font-black text-dark dark:text-white">{t('adminOverview.pendingRequests')}</h3>
              </div>
              <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white shadow-sm shadow-rose-500/30">
                {usersInfo.pending}
              </span>
            </div>

            <p className="mb-6 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              {usersInfo.pending > 0 
                ? (usersInfo.pendingRequests > 0 && usersInfo.pendingInstructors > 0
                    ? (isRtl ? `${usersInfo.pendingInstructors} طلبات مدربين و ${usersInfo.pendingRequests} طلبات تسجيل دورات` : `${usersInfo.pendingInstructors} instructors & ${usersInfo.pendingRequests} course requests`)
                    : (usersInfo.pendingInstructors > 0 
                        ? `${usersInfo.pendingInstructors} ${t('adminOverview.pendingInstructors')}`
                        : (isRtl ? `${usersInfo.pendingRequests} طلبات تسجيل دورات قيد الانتظار` : `${usersInfo.pendingRequests} pending course requests`)))
                : t('adminOverview.noPendingRequests')}
            </p>
          </div>

          <Link
            to="/admin-dashboard/requests"
            className="group relative z-10 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:bg-secondary hover:shadow-primary/30 active:scale-98 dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400"
          >
            <span>{t('adminOverview.reviewRequests')}</span>
            <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">arrow_forward</span>
          </Link>
        </div>

        {/* Recent Activities */}
        <div className="rounded-3xl border border-[#E8E2D5] bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-800/90 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between border-b border-[#E8E2D5]/60 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-black text-dark dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-amber-400 text-xl">history</span>
              {t('adminOverview.recentActivities')}
            </h3>
            <Link to="/admin-dashboard/activity-logs" className="text-xs font-bold text-primary hover:underline dark:text-amber-400">
              {t('adminOverview.viewAll') || (isRtl ? 'عرض الكل' : 'View All')}
            </Link>
          </div>

          <div className="space-y-4">
            {loadingActivities ? (
              <div className="py-8 text-center text-sm font-medium text-gray-400">
                {t('common.loading')}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
                {t('adminOverview.noActivities')}
              </div>
            ) : (
              recentActivities.map((item) => {
                const formattedTime = formatCustomDateTime(item.rawDate, dir);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent p-3.5 transition-all hover:border-[#E8E2D5] hover:bg-[#FAF7F2] dark:hover:border-gray-700 dark:hover:bg-gray-700/60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                        item.tone === 'rose'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40'
                          : item.tone === 'green'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                            : item.tone === 'blue'
                              ? 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/40'
                              : 'bg-primary/10 text-primary border border-primary/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30'
                      }`}>
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark dark:text-white group-hover:text-primary dark:group-hover:text-amber-400 transition-colors truncate">
                          {item.title}
                        </p>
                        {item.user && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t('adminOverview.by')} <span className="font-semibold text-gray-700 dark:text-gray-300">{item.user}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="rounded-lg bg-[#F3EFE6] px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <span>{formattedTime}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
