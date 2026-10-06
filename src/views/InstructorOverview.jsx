"use client";
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { getCourseIcon } from '../components/CourseCard';
import { useLanguage } from '../context/LanguageContext';
import { isCourseOwnedByInstructor } from '../utils/courseUtils';

export default function InstructorOverview() {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const { user, currentUser, userData } = useAuth();
  const { courses } = useCourses();
  
  const [hoveredCourseBar, setHoveredCourseBar] = useState(null);
  
  const activeUserData = userData || user;

  // Language-agnostic course filtering based on UID + multilingual fallback
  const myCourses = courses.filter(c => isCourseOwnedByInstructor(c, currentUser, activeUserData));

  // Instructor display name based on current language
  const displayName = lang === 'en'
    ? (activeUserData?.name_en || activeUserData?.fullName_en || activeUserData?.name || activeUserData?.fullName || currentUser?.displayName || t('instructorOverview.instructor'))
    : (activeUserData?.name || activeUserData?.fullName || currentUser?.displayName || t('instructorOverview.instructor'));

  // Top courses for enrollment distribution chart
  const chartCourses = useMemo(() => {
    if (!myCourses || myCourses.length === 0) return [];
    return [...myCourses]
      .sort((a, b) => (b.students || 0) - (a.students || 0))
      .slice(0, 5);
  }, [myCourses]);

  const maxStudents = useMemo(() => {
    if (chartCourses.length === 0) return 50;
    const maxVal = Math.max(...chartCourses.map(c => c.students || 0));
    return maxVal > 0 ? maxVal : 50;
  }, [chartCourses]);

  // Overall Satisfaction calculation
  const avgRatingNum = useMemo(() => {
    if (myCourses.length === 0) return 0;
    const sum = myCourses.reduce((acc, c) => acc + (Number(c.ratingAverage ?? c.rating) || 0), 0);
    return sum / myCourses.length;
  }, [myCourses]);

  const satisfactionPercentage = Math.min(100, Math.round((avgRatingNum / 5) * 100)) || (myCourses.length > 0 ? 80 : 0);
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashoffset = gaugeCircumference - (satisfactionPercentage / 100) * gaugeCircumference;
  
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-[#E8E2D5] dark:border-gray-700 pb-6 gap-4 transition-colors">
        <div className="text-right">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 block mb-2">
            {t('instructorOverview.statsTitle')}
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-dark dark:text-white">
            {t('instructorOverview.welcome')} {displayName}
          </h1>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Enrollments */}
        <div 
          onClick={() => navigate('/instructor-dashboard/my-courses')}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all cursor-pointer hover:border-primary/30"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">
              groups
            </span>
          </div>

          <div className="text-right w-full">
            <h3 className="text-3xl font-extrabold text-dark dark:text-white mb-1">
              {myCourses.reduce((acc, course) => acc + (course.students || 0), 0)}
            </h3>
            <p className="text-sm font-bold text-text-main dark:text-gray-300">
              {t('adminInstructors.totalEnrollments')}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">
              {isRtl ? 'إجمالي تسجيلات الطلاب في دوراتك' : 'Total enrollments across your courses'}
            </p>
          </div>
        </div>

          {/* Courses */}
          <div 
            onClick={() => navigate('/instructor-dashboard/my-courses')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all cursor-pointer hover:border-secondary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-secondary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">
                menu_book
              </span>
            </div>

            <div className="text-right w-full flex justify-between items-end">
              <Link
                to="/instructor-dashboard/my-courses"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-secondary hover:underline flex items-center bg-transparent border-0 cursor-pointer"
              >
                {t('instructorOverview.manage')}
                <span className="material-symbols-outlined mr-1 text-[12px] rtl:rotate-180">
                  arrow_forward
                </span>
              </Link>

              <div>
                <h3 className="text-3xl font-extrabold text-dark dark:text-white mb-1">
                  {myCourses.length}
                </h3>
                <p className="text-sm font-bold text-text-main dark:text-gray-400">
                  {t('instructorOverview.yourCourses')}
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all cursor-pointer hover:border-blue-500/30">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">
                star
              </span>
            </div>

            <div className="text-right w-full">
              <h3 className="text-3xl font-extrabold text-dark dark:text-white mb-1">
                {myCourses.length > 0 ? (myCourses.reduce((acc, course) => acc + (Number(course.ratingAverage ?? course.rating) || 0), 0) / myCourses.length).toFixed(1) : "0.0"}
              </h3>

              <p className="text-sm font-bold text-text-main dark:text-gray-400">
                {t('instructorOverview.avgRating')}
              </p>
            </div>
          </div>
        </div>

        {/* ================= Visual Analytics Charts Section ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Course Enrollment Distribution Bar Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
              <div className="text-right">
                <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                  <span>{isRtl ? 'توزيع الطلاب حسب الدورات' : 'Student Enrollment by Course'}</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isRtl ? 'أداء أعلى 5 دورات تدريبية من حيث عدد الطلاب المسجلين' : 'Performance of top 5 courses by enrolled students'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                {isRtl ? 'إحصائيات التسجيل' : 'Enrollment Stats'}
              </span>
            </div>

            {chartCourses.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm font-bold">
                {isRtl ? 'لا توجد بيانات دورات كافية لعرض المخطط البياني حالياً' : 'No course data available to display the chart currently'}
              </div>
            ) : (
              <div className="w-full relative pt-4 pb-2">
                <svg viewBox="0 0 520 180" className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="instBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#B38F24" />
                    </linearGradient>
                    <linearGradient id="instHoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E5C158" />
                      <stop offset="100%" stopColor="#C49B28" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="20" y1="30" x2="500" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                  <line x1="20" y1="80" x2="500" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                  <line x1="20" y1="130" x2="500" y2="130" stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />

                  {chartCourses.map((course, idx) => {
                    const barWidth = 42;
                    const count = chartCourses.length;
                    const spacing = count > 1 ? (440 - barWidth) / (count - 1) : 0;
                    const x = count > 1 ? 40 + idx * spacing : 230;
                    const studentsCount = course.students || 0;
                    const barHeight = Math.max(14, (studentsCount / maxStudents) * 95);
                    const y = 135 - barHeight;
                    const isHovered = hoveredCourseBar === idx;

                    return (
                      <g key={course.id || idx} className="cursor-pointer" onMouseEnter={() => setHoveredCourseBar(idx)} onMouseLeave={() => setHoveredCourseBar(null)}>
                        {/* Track Background */}
                        <rect
                          x={x}
                          y={35}
                          width={barWidth}
                          height={100}
                          rx="8"
                          className="fill-[#F5F1E8] dark:fill-gray-700/40 transition-colors"
                        />
                        {/* Active Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="8"
                          fill={isHovered ? 'url(#instHoverGrad)' : 'url(#instBarGrad)'}
                          className="transition-all duration-300"
                        />
                        {/* Value on Top */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-dark dark:fill-white font-jetbrains"
                        >
                          {studentsCount}
                        </text>
                        {/* X-axis Label (Course short name) */}
                        <text
                          x={x + barWidth / 2}
                          y={154}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-gray-500 dark:fill-gray-400"
                        >
                          {course.title ? (course.title.length > 10 ? `${course.title.slice(0, 8)}...` : course.title) : `دورة ${idx + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip on Hover */}
                {hoveredCourseBar !== null && chartCourses[hoveredCourseBar] && (
                  <div className="absolute top-0 right-4 bg-dark dark:bg-gray-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-lg pointer-events-none flex items-center gap-2 border border-gray-700 animate-fadeIn">
                    <span className="font-bold">{chartCourses[hoveredCourseBar].title}</span>
                    <span className="text-primary font-mono font-bold">
                      {chartCourses[hoveredCourseBar].students || 0} {t('common.students')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Academic Satisfaction & Quality Gauge (1 Col) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-xl">verified</span>
                  <span>{isRtl ? 'مؤشر رضا الطلاب' : 'Satisfaction Index'}</span>
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRtl ? 'تقييم جودة الدورات ورضا الطلاب العام' : 'Overall student satisfaction & course rating'}
              </p>
            </div>

            {/* SVG Circular Progress Gauge */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                  {/* Background Track */}
                  <circle
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                    className="stroke-[#F5F1E8] dark:stroke-gray-700"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                    stroke="url(#instGaugeGoldGrad)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="instGaugeGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-dark dark:text-white font-jetbrains">
                    {satisfactionPercentage}%
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">
                    {isRtl ? 'نسبة الرضا' : 'Satisfaction'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5] dark:border-gray-700/80 text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-gray-700/40">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">{isRtl ? 'متوسط التقييم' : 'Avg Rating'}</span>
                <span className="text-sm font-black text-dark dark:text-white font-jetbrains">
                  {avgRatingNum.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-gray-700/40">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">{isRtl ? 'إجمالي الدورات' : 'Total Courses'}</span>
                <span className="text-sm font-black text-primary font-jetbrains">
                  {myCourses.length}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Courses Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
              {t('myCourses.title')}
            </h2>

            <Link
              to="/instructor-dashboard/my-courses"
              className="text-primary font-bold text-sm hover:underline bg-transparent border-0 cursor-pointer inline-flex items-center gap-1"
            >
              <span>{t('instructorOverview.viewAll')}</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-sm overflow-hidden transition-colors">

            {myCourses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-bold">{t('instructorOverview.noCourses')}</div>
            ) : myCourses.map(course => (
              <div key={course.id} className="group p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 border-b border-[#E8E2D5] dark:border-gray-700 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 transition-colors duration-300">
                <div className="relative w-full md:w-32 h-24 overflow-hidden rounded-2xl shadow-xs bg-[#F5F0E6] dark:bg-[#1D1915] border border-amber-300/60 dark:border-[#3E3326] flex items-center justify-center shrink-0 group-hover:bg-[#EFE9DC] dark:group-hover:bg-[#221D18] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#28221B] border border-amber-300/80 dark:border-[#3E3326] flex items-center justify-center text-amber-600 dark:text-[#D9A54C] shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-2xl">{getCourseIcon(course)}</span>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-bold text-dark dark:text-white mb-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300 mt-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {course.students || 0} {t('common.students')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-orange-400">star</span>
                      {course.rating || 0} {t('instructorOverview.ratings')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500">monetization_on</span>
                      {(course.price === 'Free' || course.price === 'free' || !course.price || course.price == 0) ? (dir === 'rtl' ? 'مجاني' : 'Free') : `$${course.price}`}
                    </span>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link to={`/instructor-dashboard/edit-course/${course.id}`} className="flex-1 md:flex-none bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors text-center shadow-sm">
                    {t('common.edit')}
                  </Link>
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}