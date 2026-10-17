"use client";
import { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { formatCustomDateTime } from '../../utils/formatDate';

export default function AdminActivityLogs() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchActivities = async () => {
    try {
      const [
        logsRes,
        reqsRes,
        coursesRes,
        profilesRes,
        booksRes
      ] = await Promise.all([
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(60),
        supabase.from('course_requests').select('*').order('created_at', { ascending: false }).limit(40),
        supabase.from('courses').select('id, title, instructor, instructor_name, category, category_name, created_at').order('created_at', { ascending: false }).limit(40),
        supabase.from('profiles').select('id, full_name, email, role, status, is_approved, created_at').order('created_at', { ascending: false }).limit(40),
        supabase.from('books').select('id, title, author, category, category_name, created_at').order('created_at', { ascending: false }).limit(40)
      ]);

      const toEpoch = (d) => {
        if (!d) return 0;
        if (typeof d === 'number') return d;
        if (d.seconds) return d.seconds * 1000;
        if (typeof d.toDate === 'function') return d.toDate().getTime();
        const ms = new Date(d).getTime();
        return isNaN(ms) ? 0 : ms;
      };

      const combined = [];

      // 1. Real activity_logs from Supabase table
      (logsRes.data || []).forEach(log => {
        combined.push({
          id: `log-${log.id}`,
          title: log.action || (isRtl ? 'إجراء نظام مسجل' : 'System Action'),
          user: log.user_name || log.user_role || (isRtl ? 'مدير النظام' : 'Admin'),
          type: 'system',
          typeLabel: isRtl ? 'نشاط النظام' : 'System Log',
          icon: 'admin_panel_settings',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40',
          rawDate: log.created_at,
          details: log.details || (isRtl ? 'إجراء في لوحة التحكم' : 'Administrative action logged')
        });
      });

      // 2. Real Course requests & enrollments from Supabase
      (reqsRes.data || []).forEach(req => {
        const isApproved = req.status === 'approved';
        combined.push({
          id: `req-${req.id}`,
          title: req.course_title ? (isRtl ? `طلب تسجيل دورة: ${req.course_title}` : `Course Request: ${req.course_title}`) : (isRtl ? 'طلب تسجيل دورة' : 'Course Enrollment Request'),
          user: req.student_name || req.student_email || (isRtl ? 'طالب' : 'Student'),
          type: 'request',
          typeLabel: isRtl ? 'طلبات التسجيل' : 'Enrollment Requests',
          icon: isApproved ? 'how_to_reg' : 'pending_actions',
          badgeColor: isApproved
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40'
            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
          rawDate: req.created_at,
          details: isApproved
            ? (isRtl ? 'تم اعتماد التسجيل بنجاح' : 'Enrollment approved')
            : (isRtl ? 'طلب تسجيل دورة قيد المراجعة' : 'Enrollment pending review')
        });
      });

      // 3. Real Courses
      (coursesRes.data || []).forEach(c => {
        combined.push({
          id: `course-${c.id}`,
          title: c.title || (isRtl ? 'دورة جديدة' : 'New Course'),
          user: c.instructor_name || c.instructor || (isRtl ? 'مدرب' : 'Instructor'),
          type: 'course',
          typeLabel: t('adminOverview.typeCourse') || (isRtl ? 'دورة تدريبية' : 'Course'),
          icon: 'school',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
          rawDate: c.created_at,
          details: (c.category || c.category_name) ? `${isRtl ? 'التصنيف' : 'Category'}: ${c.category || c.category_name}` : (isRtl ? 'تم نشر دورة جديدة' : 'New course published')
        });
      });

      // 4. Real Profiles (Users & Instructors)
      (profilesRes.data || []).forEach(p => {
        const isPending = p.status === 'pending' || p.is_approved === false;
        const isInst = p.role === 'instructor';
        const name = p.full_name || p.email || (isRtl ? 'مستخدم' : 'User');
        combined.push({
          id: `user-${p.id}`,
          title: isPending
            ? (isRtl ? `طلب انضمام مدرب: ${name}` : `Instructor Application: ${name}`)
            : (isRtl ? `انضمام مستخدم: ${name}` : `User Joined: ${name}`),
          user: p.email || name,
          type: 'user',
          typeLabel: t('adminOverview.typeUser') || (isRtl ? 'مستخدمين' : 'Users'),
          icon: isPending ? 'person_add' : 'group',
          badgeColor: isPending
            ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40'
            : 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/40',
          rawDate: p.created_at,
          details: p.role ? `${isRtl ? 'الدور' : 'Role'}: ${isInst ? (isRtl ? 'مدرب' : 'Instructor') : (p.role === 'admin' ? (isRtl ? 'مدير' : 'Admin') : (isRtl ? 'طالب' : 'Student'))}` : (isRtl ? 'حساب جديد' : 'New account')
        });
      });

      // 5. Real Books
      (booksRes.data || []).forEach(b => {
        combined.push({
          id: `book-${b.id}`,
          title: b.title || (isRtl ? 'كتاب جديد' : 'New Book'),
          user: b.author || (isRtl ? 'المكتبة' : 'Library'),
          type: 'book',
          typeLabel: t('adminOverview.typeBook') || (isRtl ? 'كتب ومراجع' : 'Books'),
          icon: 'menu_book',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/40',
          rawDate: b.created_at,
          details: (b.category || b.category_name) ? `${isRtl ? 'القسم' : 'Category'}: ${b.category || b.category_name}` : (isRtl ? 'إضافة إلى المكتبة الرقمية' : 'Added to Digital Library')
        });
      });

      combined.sort((a, b) => toEpoch(b.rawDate) - toEpoch(a.rawDate));
      setActivities(combined);
      setLoading(false);
    } catch (err) {
      console.warn('Error fetching real activity logs:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    let debounceTimer = null;
    const handleRealtimeChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchActivities();
      }, 700);
    };

    const channel = supabase
      .channel('admin-activity-logs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_requests' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, handleRealtimeChange)
      .subscribe();

    const interval = setInterval(fetchActivities, 30000);

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const formatDate = (rawDate) => {
    return formatCustomDateTime(rawDate, dir);
  };

  const filteredActivities = activities.filter(act => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      act.title.toLowerCase().includes(query) ||
      act.user.toLowerCase().includes(query) ||
      act.details.toLowerCase().includes(query);

    const matchesType = filterType === 'all' || act.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <AdminPageShell
      parent={t('adminOverview.activityLogsParent') || (isRtl ? 'لوحة التحكم' : 'Dashboard')}
      title={t('adminOverview.activityLogsTitle') || (isRtl ? 'سجل أنشطة المنصة' : 'Activity Logs')}
      subtitle={t('adminOverview.activityLogsSubtitle') || (isRtl ? 'تتبع جميع الأحداث والإجراءات على المنصة بالتاريخ والتوقيت والتفاصيل' : 'Track all platform events, requests, and updates in real time')}
      icon="history"
    >
      {/* Controls & Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            aria-label={t('adminOverview.searchPlaceholder') || (isRtl ? 'البحث في الأنشطة...' : 'Search activities...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminOverview.searchPlaceholder') || (isRtl ? 'البحث في الأنشطة...' : 'Search activities...')}
            className="w-full rounded-xl border border-[#E8E2D5] bg-white ps-10 pe-4 py-2.5 text-sm text-dark placeholder:text-gray-400 transition-all focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-amber-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: t('adminOverview.allTypes') || (isRtl ? 'جميع الأنشطة' : 'All Activities') },
            { id: 'system', label: isRtl ? 'نشاط النظام' : 'System Logs' },
            { id: 'request', label: isRtl ? 'طلبات التسجيل' : 'Course Requests' },
            { id: 'course', label: t('adminOverview.typeCourse') || (isRtl ? 'دورات تدريبية' : 'Courses') },
            { id: 'book', label: t('adminOverview.typeBook') || (isRtl ? 'كتب ومراجع' : 'Books') },
            { id: 'user', label: t('adminOverview.typeUser') || (isRtl ? 'مستخدمين' : 'Users') },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                filterType === btn.id
                  ? 'bg-primary text-white shadow-sm dark:bg-primary dark:text-gray-950 font-black'
                  : 'bg-white text-gray-600 border border-[#E8E2D5] hover:bg-[#FAF7F2] dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-[#E8E2D5] bg-white dark:border-gray-800 dark:bg-gray-800/90">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-amber-400 dark:border-t-transparent" />
          <p className="mt-3 text-sm font-bold text-gray-500">{t('common.loading') || 'جاري التحميل...'}</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#E8E2D5] bg-[#FAF7F2]/50 p-8 text-center dark:border-gray-800 dark:bg-gray-800/40">
          <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">history_toggle_off</span>
          <p className="font-bold text-gray-600 dark:text-gray-300">
            {t('adminOverview.noActivityFound') || 'لا توجد أنشطة مطابقة للبحث'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-xs dark:border-gray-800 dark:bg-gray-800/90">
          <div className="divide-y divide-[#E8E2D5]/60 dark:divide-gray-800">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30">
                    <span className="material-symbols-outlined text-xl">{act.icon}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${act.badgeColor}`}>
                        {act.typeLabel}
                      </span>
                      <h3 className="text-base font-bold text-dark dark:text-white group-hover:text-primary dark:group-hover:text-amber-400 transition-colors">
                        {act.title}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>{act.details}</span>
                      <span>•</span>
                      <span>{t('adminOverview.by') || 'بواسطة'} <strong className="text-gray-700 dark:text-gray-300">{act.user}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0 sm:text-end self-end sm:self-auto">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{formatDate(act.rawDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
