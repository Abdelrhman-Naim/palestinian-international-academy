import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { useCourses } from '../../context/CoursesContext';
import { useLibrary } from '../../context/LibraryContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { formatCustomDateTime } from '../../utils/formatDate';

export default function AdminOverview() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { courses } = useCourses();
  const { books } = useLibrary();
  const [usersInfo, setUsersInfo] = useState({ students: 0, instructors: 0, pending: 0 });

  const totalEnrollments = courses.reduce((acc, curr) => acc + (curr.students || 0), 0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      let stu = 0;
      let inst = 0;
      let pend = 0;
      snapshot.forEach(doc => {
        const role = doc.data().role;
        const status = doc.data().status;
        if (role === 'student') stu++;
        if (role === 'instructor') inst++;
        if (status === 'pending') pend++;
      });
      setUsersInfo({ students: stu, instructors: inst, pending: pend });
    });
    return () => unsub();
  }, []);

  const stats = [
    {
      label: t('adminOverview.totalStudentAccounts'),
      value: usersInfo.students.toString(),
      subValue: `${totalEnrollments} ${t('adminOverview.courseEnrollments')}`,
      subtitle: t('adminOverview.studentAccountsSubtitle'),
      icon: 'groups',
      tone: 'primary',
      to: '/admin-dashboard/users'
    },
    { label: t('adminOverview.activeInstructors'), value: usersInfo.instructors.toString(), icon: 'badge', tone: 'rose', to: '/admin-dashboard/instructors' },
    { label: t('adminOverview.publishedCourses'), value: courses.length.toString(), icon: 'school', tone: 'green', to: '/admin-dashboard/courses' },
    { label: t('adminOverview.libraryBooks'), value: books.length.toString(), icon: 'library_books', tone: 'blue', to: '/admin-dashboard/library' },
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
                ? `${usersInfo.pending} ${t('adminOverview.pendingInstructors')}` 
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
            {courses.slice(0, 4).map((item) => {
              const rawDate = item.createdAt || item.updatedAt || item.date || item.timestamp || (item.year ? `${item.year}-01-01` : new Date());
              const formattedTime = formatCustomDateTime(rawDate, dir);
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent p-3.5 transition-all hover:border-[#E8E2D5] hover:bg-[#FAF7F2] dark:hover:border-gray-700 dark:hover:bg-gray-700/60"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30 shrink-0">
                      <span className="material-symbols-outlined text-xl">publish</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-dark dark:text-white group-hover:text-primary dark:group-hover:text-amber-400 transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {t('adminOverview.by')} <span className="font-semibold text-gray-700 dark:text-gray-300">{item.instructor}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-lg bg-[#F3EFE6] px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {t('adminOverview.newCourse')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      <span>{formattedTime}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            {courses.length === 0 && (
              <div className="py-8 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
                {t('adminOverview.noActivities')}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}

