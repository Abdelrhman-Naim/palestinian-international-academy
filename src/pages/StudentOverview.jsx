"use client";
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { useLanguage } from '../context/LanguageContext';

const StudentOverview = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { user, currentUser } = useAuth();
  const [coursesCount, setCoursesCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const uid = currentUser?.uid || currentUser?.id || user?.uid || user?.id;
    if (!uid) {
      setLoadingStats(false);
      return;
    }

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [cRes, certRes, assignRes] = await Promise.allSettled([
          supabase.from('course_requests').select('*', { count: 'exact', head: true }).eq('student_id', uid),
          supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('student_id', uid),
          supabase.from('submitted_assignments').select('*', { count: 'exact', head: true }).eq('student_id', uid)
        ]);

        if (cRes.status === 'fulfilled') setCoursesCount(cRes.value.count || 0);
        if (certRes.status === 'fulfilled') setCertCount(certRes.value.count || 0);
        if (assignRes.status === 'fulfilled') setAssignmentsCount(assignRes.value.count || 0);
      } catch (e) {
        console.warn('Error loading student stats from Supabase:', e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, currentUser]);

  // Overall track completion calculation
  const overallProgress = useMemo(() => {
    if (coursesCount === 0) return 0;
    const certWeight = certCount * 40;
    const assignWeight = assignmentsCount * 15;
    const baseProgress = (certWeight + assignWeight) / Math.max(1, coursesCount);
    return Math.min(100, Math.max(15, Math.round(baseProgress)));
  }, [coursesCount, certCount, assignmentsCount]);

  // Weekly study activity data (Sat - Fri)
  const weeklyActivity = useMemo(() => {
    return [
      { day: isRtl ? 'السبت' : 'Sat', hours: 2.5, lessons: 3 },
      { day: isRtl ? 'الأحد' : 'Sun', hours: 3.8, lessons: 5 },
      { day: isRtl ? 'الإثنين' : 'Mon', hours: 1.5, lessons: 2 },
      { day: isRtl ? 'الثلاثاء' : 'Tue', hours: 4.2, lessons: 6 },
      { day: isRtl ? 'الأربعاء' : 'Wed', hours: 2.0, lessons: 3 },
      { day: isRtl ? 'الخميس' : 'Thu', hours: 3.0, lessons: 4 },
      { day: isRtl ? 'الجمعة' : 'Fri', hours: 1.0, lessons: 1 }
    ];
  }, [isRtl]);

  const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 5);
  const totalWeeklyHours = weeklyActivity.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);

  // SVG Gauge Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-[#E8E2D5] dark:border-gray-700 pb-6 gap-4 transition-colors">
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-extrabold text-dark dark:text-white">
              {t('studentOverview.welcomeBack')} {user?.name || user?.full_name || currentUser?.displayName || t('common.students')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRtl ? 'تابع تقدمك الأكاديمي، ساعات دراستك الأسبوعية، وواجباتك المنجزة.' : 'Track your academic progress, weekly study hours, and completed tasks.'}
            </p>
          </div>
        </div>
        
        {/* Quick Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingStats ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm animate-pulse flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 ms-auto"></div>
                  <div className="space-y-3 text-end">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg ms-auto"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md ms-auto"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Courses in Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-graduation-cap text-lg"></i>
                </div>
                <div className="text-right w-full">
                  <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{coursesCount}</h3>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentOverview.coursesInProgress')}</p>
                </div>
              </div>
              
              {/* Certificates Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-award text-lg"></i>
                </div>
                <div className="text-right w-full flex justify-between items-end">
                  <Link to="/dashboard/certificates" className="text-xs font-bold text-primary dark:text-amber-400 hover:underline flex items-center">
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-180"></i> {t('studentOverview.viewCertificate')}
                  </Link>
                  <div>
                    <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{certCount}</h3>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{dir === 'rtl' ? 'الشهادات المكتسبة' : 'Earned Certificates'}</p>
                  </div>
                </div>
              </div>
              
              {/* Completed Tasks & Learning Time */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-list-check text-lg"></i>
                </div>
                <div className="text-right w-full flex justify-between items-end">
                  <Link to="/dashboard/assignments" className="text-xs font-bold text-primary dark:text-amber-400 hover:underline flex items-center">
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-180"></i> {isRtl ? 'عرض الواجبات' : 'View Tasks'}
                  </Link>
                  <div>
                    <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{assignmentsCount}</h3>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{isRtl ? 'الواجبات المسلّمة' : 'Submitted Tasks'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= Visual Analytics Charts Section ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Activity SVG Bar Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
              <div className="text-right">
                <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                  <span>{isRtl ? 'نشاط التعلم الأسبوعي' : 'Weekly Study Activity'}</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isRtl ? `إجمالي ساعات الدراسة هذا الأسبوع: ${totalWeeklyHours} ساعة` : `Total study hours this week: ${totalWeeklyHours} hrs`}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                {isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}
              </span>
            </div>

            {/* Interactive SVG Chart */}
            <div className="w-full relative pt-4 pb-2">
              <svg viewBox="0 0 520 180" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="barGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B38F24" />
                  </linearGradient>
                  <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E5C158" />
                    <stop offset="100%" stopColor="#C49B28" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="20" y1="30" x2="500" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                <line x1="20" y1="80" x2="500" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                <line x1="20" y1="130" x2="500" y2="130" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />

                {/* 7 Bars */}
                {weeklyActivity.map((item, idx) => {
                  const barWidth = 36;
                  const spacing = (480 - barWidth) / 6;
                  const x = 30 + idx * spacing;
                  const barHeight = Math.max(12, (item.hours / maxHours) * 100);
                  const y = 135 - barHeight;
                  const isHovered = hoveredBar === idx;

                  return (
                    <g key={item.day} className="cursor-pointer" onMouseEnter={() => setHoveredBar(idx)} onMouseLeave={() => setHoveredBar(null)}>
                      {/* Track Background */}
                      <rect
                        x={x}
                        y={35}
                        width={barWidth}
                        height={100}
                        rx="8"
                        className="fill-[#F5F1E8] dark:fill-gray-700/40 transition-colors"
                      />

                      {/* Active Fill */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="8"
                        fill={isHovered ? "url(#barHoverGrad)" : "url(#barGoldGrad)"}
                        className="transition-all duration-300 filter drop-shadow-xs"
                      />

                      {/* Day Label */}
                      <text
                        x={x + barWidth / 2}
                        y="158"
                        textAnchor="middle"
                        className={`text-[11px] font-bold transition-colors ${
                          isHovered ? 'fill-primary font-black' : 'fill-gray-500 dark:fill-gray-400'
                        }`}
                      >
                        {item.day}
                      </text>

                      {/* Hours Label Above Bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className={`text-[10px] font-mono font-bold transition-all ${
                          isHovered ? 'fill-primary opacity-100' : 'fill-gray-400 dark:fill-gray-500 opacity-80'
                        }`}
                      >
                        {item.hours}h
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Details Card */}
              {hoveredBar !== null && (
                <div className="mt-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300 bg-[#FAF7F2] dark:bg-gray-700/50 py-1.5 px-3 rounded-xl border border-[#E8E2D5] dark:border-gray-600 inline-flex items-center gap-3 mx-auto">
                  <span>📅 {weeklyActivity[hoveredBar].day}</span>
                  <span>⏱️ {weeklyActivity[hoveredBar].hours} {isRtl ? 'ساعة دراسة' : 'hrs study'}</span>
                  <span>📚 {weeklyActivity[hoveredBar].lessons} {isRtl ? 'محاضرات منجزة' : 'completed lessons'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Radial Track Progress Gauge (1 Col) */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <div className="text-right">
              <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                <span>{isRtl ? 'إنجاز المسار الدراسي' : 'Curriculum Progress'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isRtl ? 'النسبة التراكمية للمساقات والمهام' : 'Cumulative track completion metric'}
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="relative my-4 flex items-center justify-center">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-gray-100 dark:text-gray-700"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="url(#barGoldGrad)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-dark dark:text-white font-jetbrains">
                  {overallProgress}%
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  {isRtl ? 'معدل الإنجاز' : 'Completion'}
                </span>
              </div>
            </div>

            {/* Micro Breakdown Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
              <div className="bg-[#FAF7F2] dark:bg-gray-700/30 p-2 rounded-xl text-center">
                <span className="block font-bold text-dark dark:text-white">{coursesCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{isRtl ? 'دورات نشطة' : 'Active Courses'}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-700/30 p-2 rounded-xl text-center">
                <span className="block font-bold text-dark dark:text-white">{certCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{isRtl ? 'شهادات تخرج' : 'Certificates'}</span>
              </div>
            </div>
          </div>

        </div>
        
        {/* Main Content Area: Continue Learning & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-6 text-right transition-colors">{t('studentOverview.continueLearning')}</h2>
            <div className="bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
              <i className="fa-solid fa-book-open text-5xl mb-4 text-gray-300 dark:text-gray-600"></i>
              <p className="font-medium text-lg text-gray-500 dark:text-gray-400">
                {coursesCount > 0 ? t('studentOverview.coursesInProgress') : t('studentOverview.noCoursesInProgress')}
              </p>
              <Link to="/courses" className="mt-4 text-primary dark:text-orange-400 font-semibold hover:underline">{t('studentOverview.exploreCourses')}</Link>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm min-h-75 flex flex-col transition-colors">
              <div className="flex items-center justify-between mb-6">
                <Link to="/dashboard/certificates" className="text-sm font-semibold text-primary dark:text-orange-400 hover:underline flex items-center">
                  <i className="fa-solid fa-arrow-left ml-1 text-xs"></i> {t('instructorOverview.viewAll')}
                </Link>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-dark dark:text-white">{t('studentOverview.recentBadges')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">0 {t('common.of')} 8 {t('studentOverview.badgesUnlocked')}</p>
                </div>
              </div>
              
              <div className="bg-[#FAF7F2] dark:bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center text-center flex-1 border border-[#E8E2D5] dark:border-gray-800 transition-colors">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3 shadow-sm">
                  <i className="fa-solid fa-shield-halved text-xl"></i>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('studentOverview.noBadges')}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
