import { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { collection, onSnapshot, query, limit, db } from '../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { formatCustomDateTime } from '../../utils/formatDate';

export default function AdminActivityLogs() {
  const { t, dir } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let coursesData = [];
    let usersData = [];
    let booksData = [];

    const updateAll = () => {
      const combined = [
        ...coursesData,
        ...usersData,
        ...booksData
      ].sort((a, b) => (b.rawDate?.seconds || 0) - (a.rawDate?.seconds || 0));

      setActivities(combined);
      setLoading(false);
    };

    // 1. Fetch recent courses
    const coursesQ = query(collection(db, 'courses'), limit(20));
    const unsubCourses = onSnapshot(coursesQ, (snap) => {
      coursesData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: `course-${doc.id}`,
          title: data.title || 'دورة جديدة',
          user: data.instructor || 'مدرب',
          type: 'course',
          typeLabel: t('adminOverview.typeCourse') || 'دورة تدريبية',
          icon: 'school',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
          rawDate: data.createdAt || data.date || { seconds: Date.now() / 1000 },
          details: data.category ? `التصنيف: ${data.category}` : 'تم نشر دورة جديدة'
        };
      });
      updateAll();
    }, () => updateAll());

    // 2. Fetch users
    const usersQ = query(collection(db, 'users'), limit(20));
    const unsubUsers = onSnapshot(usersQ, (snap) => {
      usersData = snap.docs.map(doc => {
        const data = doc.data();
        const isPending = data.status === 'pending';
        return {
          id: `user-${doc.id}`,
          title: isPending ? `طلب انضمام: ${data.name || 'مستخدم'}` : `انضمام مستخدم: ${data.name || 'مستخدم'}`,
          user: data.email || data.name || 'مستخدم',
          type: 'user',
          typeLabel: t('adminOverview.typeUser') || 'مستخدمين',
          icon: isPending ? 'person_add' : 'group',
          badgeColor: isPending 
            ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40',
          rawDate: data.createdAt || { seconds: Date.now() / 1000 },
          details: data.role ? `الدور: ${data.role === 'instructor' ? 'مدرب' : 'طالب'}` : 'حساب جديد'
        };
      });
      updateAll();
    }, () => updateAll());

    // 3. Fetch books
    const booksQ = query(collection(db, 'books'), limit(20));
    const unsubBooks = onSnapshot(booksQ, (snap) => {
      booksData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: `book-${doc.id}`,
          title: data.title || 'كتاب جديد',
          user: data.author || 'المكتبة',
          type: 'book',
          typeLabel: t('adminOverview.typeBook') || 'كتب ومراجع',
          icon: 'menu_book',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/40',
          rawDate: data.createdAt || { seconds: Date.now() / 1000 },
          details: data.category ? `قسم: ${data.category}` : 'إضافة إلى المكتبة الرقمية'
        };
      });
      updateAll();
    }, () => updateAll());

    return () => {
      unsubCourses();
      unsubUsers();
      unsubBooks();
    };
  }, [t]);

  const formatDate = (rawDate) => {
    return formatCustomDateTime(rawDate, dir);
  };

  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || act.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <AdminPageShell
      parent={t('adminOverview.activityLogsParent') || 'لوحة التحكم'}
      title={t('adminOverview.activityLogsTitle') || 'سجل أنشطة المنصة'}
      subtitle={t('adminOverview.activityLogsSubtitle') || 'تتبع جميع الأحداث والإجراءات على المنصة بالتاريخ والتوقيت والتفاصيل'}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminOverview.searchPlaceholder') || 'البحث في الأنشطة...'}
            className="w-full rounded-xl border border-[#E8E2D5] bg-white ps-10 pe-4 py-2.5 text-sm text-dark placeholder:text-gray-400 transition-all focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-amber-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: t('adminOverview.allTypes') || 'جميع الأنشطة' },
            { id: 'course', label: t('adminOverview.typeCourse') || 'دورات تدريبية' },
            { id: 'book', label: t('adminOverview.typeBook') || 'كتب ومراجع' },
            { id: 'user', label: t('adminOverview.typeUser') || 'مستخدمين' },
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
