"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { useLanguage } from '../context/LanguageContext';

const DAYS_CONFIG = [
  { dayIndex: 6, ar: 'السبت', en: 'Sat' },
  { dayIndex: 0, ar: 'الأحد', en: 'Sun' },
  { dayIndex: 1, ar: 'الإثنين', en: 'Mon' },
  { dayIndex: 2, ar: 'الثلاثاء', en: 'Tue' },
  { dayIndex: 3, ar: 'الأربعاء', en: 'Wed' },
  { dayIndex: 4, ar: 'الخميس', en: 'Thu' },
  { dayIndex: 5, ar: 'الجمعة', en: 'Fri' }
];

const StudentOverview = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { user, currentUser } = useAuth();

  const [coursesCount, setCoursesCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [savedBooksCount, setSavedBooksCount] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: isRtl ? 'السبت' : 'Sat', hours: 0, lessons: 0 },
    { day: isRtl ? 'الأحد' : 'Sun', hours: 0, lessons: 0 },
    { day: isRtl ? 'الإثنين' : 'Mon', hours: 0, lessons: 0 },
    { day: isRtl ? 'الثلاثاء' : 'Tue', hours: 0, lessons: 0 },
    { day: isRtl ? 'الأربعاء' : 'Wed', hours: 0, lessons: 0 },
    { day: isRtl ? 'الخميس' : 'Thu', hours: 0, lessons: 0 },
    { day: isRtl ? 'الجمعة' : 'Fri', hours: 0, lessons: 0 }
  ]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  const uid = currentUser?.uid || currentUser?.id || user?.uid || user?.id;

  const fetchStats = useCallback(async () => {
    if (!uid) {
      setLoadingStats(false);
      return;
    }

    setLoadingStats(true);
    try {
      // Fetch all required data in parallel
      const [
        cReqRes,
        enrRes,
        certRes,
        subRes,
        examRes,
        assignRes,
        coursesRes,
        savedBooksRes
      ] = await Promise.allSettled([
        supabase.from('course_requests').select('*').eq('student_id', uid),
        supabase.from('enrollments').select('*').eq('student_id', uid),
        supabase.from('certificates').select('*').eq('student_id', uid),
        supabase.from('submitted_assignments').select('*').eq('student_id', uid),
        supabase.from('exam_results').select('*').eq('student_id', uid),
        supabase.from('assignments').select('id, course_id, title, due_date'),
        supabase.from('courses').select('id, title, instructor, instructor_name, image_url, category, category_name, lessons, lectures, lessons_count, lecturesCount'),
        supabase.from('saved_books').select('id', { count: 'exact', head: true }).eq('user_id', uid)
      ]);

      const courseRequests = cReqRes.status === 'fulfilled' && cReqRes.value.data ? cReqRes.value.data : [];
      const enrollments = enrRes.status === 'fulfilled' && enrRes.value.data ? enrRes.value.data : [];
      const certificates = certRes.status === 'fulfilled' && certRes.value.data ? certRes.value.data : [];
      const submittedAssignments = subRes.status === 'fulfilled' && subRes.value.data ? subRes.value.data : [];
      const examResults = examRes.status === 'fulfilled' && examRes.value.data ? examRes.value.data : [];
      const allAssignments = assignRes.status === 'fulfilled' && assignRes.value.data ? assignRes.value.data : [];
      const allCourses = coursesRes.status === 'fulfilled' && coursesRes.value.data ? coursesRes.value.data : [];
      const savedCount = savedBooksRes.status === 'fulfilled' && typeof savedBooksRes.value.count === 'number'
        ? savedBooksRes.value.count
        : 0;

      // 1. Process enrolled courses deduplicated by course_id (excluding rejected requests)
      const coursesMap = new Map();
      allCourses.forEach(c => {
        coursesMap.set(String(c.id), c);
      });

      const enrollMap = new Map();
      enrollments.forEach(e => {
        if (e.course_id) enrollMap.set(String(e.course_id), e);
      });

      const validReqs = courseRequests.filter(r => r.status !== 'rejected');
      const mergedCourseIds = new Set([
        ...validReqs.map(r => String(r.course_id || '')),
        ...enrollments.map(e => String(e.course_id || ''))
      ]);
      mergedCourseIds.delete('');

      const processedCourses = [];
      mergedCourseIds.forEach(courseId => {
        const cData = coursesMap.get(courseId);
        const enrData = enrollMap.get(courseId);
        const reqData = validReqs.find(r => String(r.course_id) === courseId);

        const totalLectures = cData?.lectures?.length || cData?.lessons?.length || Number(cData?.lessons_count || cData?.lecturesCount) || 0;
        const completedLessons = Array.isArray(enrData?.completed_lessons)
          ? enrData.completed_lessons
          : (Array.isArray(enrData?.completedLessons) ? enrData.completedLessons : (Array.isArray(reqData?.completed_lessons) ? reqData.completed_lessons : []));

        // Check if student earned a certificate for this course
        const hasCert = certificates.some(cert => String(cert.course_id) === courseId);

        // Course assignments and submissions
        const courseAssignments = allAssignments.filter(a => String(a.course_id) === courseId);
        const courseSubmissions = submittedAssignments.filter(s =>
          String(s.course_id) === courseId || courseAssignments.some(a => String(a.id) === String(s.assignment_id))
        );

        let courseProgress = 0;
        if (hasCert) {
          courseProgress = 100;
        } else if (totalLectures > 0) {
          const lessonRatio = Math.min(1, completedLessons.length / totalLectures);
          if (courseAssignments.length > 0) {
            const assignmentRatio = Math.min(1, courseSubmissions.length / courseAssignments.length);
            courseProgress = Math.min(100, Math.round((lessonRatio * 0.7 + assignmentRatio * 0.3) * 100));
          } else {
            courseProgress = Math.min(100, Math.round(lessonRatio * 100));
          }
        } else if (enrData?.progress !== undefined && enrData.progress > 0) {
          courseProgress = Math.min(100, Math.round(enrData.progress));
        }

        processedCourses.push({
          courseId,
          title: cData?.title || reqData?.course_title || enrData?.course_title || (isRtl ? 'دورة تدريبية' : 'Course'),
          instructor: cData?.instructor_name || cData?.instructor || reqData?.instructor_name || enrData?.instructor || '—',
          category: cData?.category_name || cData?.category || reqData?.category || '',
          totalLessons: totalLectures,
          completedLessonsCount: completedLessons.length,
          progress: courseProgress,
          hasCert
        });
      });

      setCoursesCount(processedCourses.length);
      setCertCount(certificates.length);
      setAssignmentsCount(submittedAssignments.length);
      setSavedBooksCount(savedCount);
      setEnrolledCourses(processedCourses);

      // 2. REAL "إنجاز المسار الدراسي" (Overall track progress)
      // Exactly based on actual courses enrolled, lessons completed, submitted assignments, or 0% if nothing completed yet!
      if (processedCourses.length === 0) {
        setOverallProgress(0);
      } else {
        const totalProgressSum = processedCourses.reduce((sum, item) => sum + item.progress, 0);
        const calculatedOverall = Math.round(totalProgressSum / processedCourses.length);
        setOverallProgress(Math.min(100, Math.max(0, calculatedOverall)));
      }

      // 3. REAL "نشاط التعلم الأسبوعي" (Weekly study activity from actual submissions and exams in the last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const dynamicWeekly = DAYS_CONFIG.map(cfg => {
        // Matched submissions for this day of week within last 7 days
        const daySubs = submittedAssignments.filter(s => {
          const rawDate = s.submitted_at || s.created_at;
          if (!rawDate) return false;
          const dt = new Date(rawDate);
          return !isNaN(dt.getTime()) && dt >= sevenDaysAgo && dt <= now && dt.getDay() === cfg.dayIndex;
        });

        // Matched exams for this day of week within last 7 days
        const dayExams = examResults.filter(e => {
          const rawDate = e.created_at;
          if (!rawDate) return false;
          const dt = new Date(rawDate);
          return !isNaN(dt.getTime()) && dt >= sevenDaysAgo && dt <= now && dt.getDay() === cfg.dayIndex;
        });

        const totalTasks = daySubs.length + dayExams.length;
        // Accurate study hours based on actual coursework completed (~1.5h per assignment submission, ~1.0h per exam)
        const computedHours = (daySubs.length * 1.5) + (dayExams.length * 1.0);

        return {
          day: isRtl ? cfg.ar : cfg.en,
          hours: Number(computedHours.toFixed(1)),
          lessons: totalTasks
        };
      });

      setWeeklyActivity(dynamicWeekly);
    } catch (e) {
      console.warn('Error loading student dashboard data from Supabase:', e);
    } finally {
      setLoadingStats(false);
    }
  }, [uid, isRtl]);

  useEffect(() => {
    fetchStats();

    if (!uid) return;

    // Real-time Supabase subscriptions for dynamic live dashboard updates
    const channel = supabase
      .channel(`student_overview_live_${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submitted_assignments', filter: `student_id=eq.${uid}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments', filter: `student_id=eq.${uid}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_requests', filter: `student_id=eq.${uid}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates', filter: `student_id=eq.${uid}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_results', filter: `student_id=eq.${uid}` }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, uid]);

  // Derived weekly chart calculations
  const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 5);
  const totalWeeklyHours = weeklyActivity.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);

  // SVG Gauge Calculations for Track Progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  // Real Dynamic Badges system
  const badgesList = useMemo(() => {
    return [
      {
        id: 'first_course',
        title: isRtl ? 'بداية المسار' : 'First Course',
        desc: isRtl ? 'التسجيل في أول دورة تدريبية' : 'Enrolled in first course',
        icon: 'rocket_launch',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        unlocked: coursesCount >= 1
      },
      {
        id: 'multi_course',
        title: isRtl ? 'طالب مجتهد' : 'Dedicated Scholar',
        desc: isRtl ? 'التسجيل في 3 دورات أو أكثر' : 'Enrolled in 3+ courses',
        icon: 'school',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        unlocked: coursesCount >= 3
      },
      {
        id: 'first_assignment',
        title: isRtl ? 'أول تسليم' : 'First Submission',
        desc: isRtl ? 'تسليم أول واجب بنجاح' : 'Submitted first assignment',
        icon: 'task_alt',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        unlocked: assignmentsCount >= 1
      },
      {
        id: 'master_assignments',
        title: isRtl ? 'خبير المهام' : 'Assignment Master',
        desc: isRtl ? 'تسليم 3 واجبات دراسية' : 'Submitted 3+ assignments',
        icon: 'assignment_turned_in',
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        unlocked: assignmentsCount >= 3
      },
      {
        id: 'book_saver',
        title: isRtl ? 'قارئ شغوف' : 'Avid Reader',
        desc: isRtl ? 'حفظ مراجع من المكتبة الهندسية' : 'Bookmarked library books',
        icon: 'auto_stories',
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        unlocked: savedBooksCount >= 1
      },
      {
        id: 'certified_grad',
        title: isRtl ? 'خريج معتمد' : 'Certified',
        desc: isRtl ? 'الحصول على أول شهادة معتمدة' : 'Earned first certificate',
        icon: 'verified',
        color: 'text-primary bg-primary/10 border-primary/20',
        unlocked: certCount >= 1
      },
      {
        id: 'top_grad',
        title: isRtl ? 'نخبة الأكاديمية' : 'Top Scholar',
        desc: isRtl ? 'الحصول على 3 شهادات أو أكثر' : 'Earned 3+ certificates',
        icon: 'military_tech',
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        unlocked: certCount >= 3
      },
      {
        id: 'mastery',
        title: isRtl ? 'العلامة الكاملة' : '100% Mastery',
        desc: isRtl ? 'إكمال أي دورة بنسبة 100%' : '100% completed a course',
        icon: 'workspace_premium',
        color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
        unlocked: enrolledCourses.some(c => c.progress >= 100)
      }
    ];
  }, [isRtl, coursesCount, assignmentsCount, certCount, savedBooksCount, enrolledCourses]);

  const unlockedBadges = useMemo(() => badgesList.filter(b => b.unlocked), [badgesList]);

  // Current active course to continue learning
  const currentActiveCourse = useMemo(() => {
    return enrolledCourses.find(c => c.progress < 100) || enrolledCourses[0] || null;
  }, [enrolledCourses]);

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
              {isRtl ? 'تابع تقدمك الأكاديمي الفعلي، ساعات دراستك الأسبوعية، وواجباتك المنجزة.' : 'Track your real academic progress, weekly study hours, and completed tasks.'}
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
                <div className="text-right w-full flex justify-between items-end">
                  <Link to="/dashboard/my-courses" className="text-xs font-bold text-primary dark:text-amber-400 hover:underline flex items-center">
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-0 rotate-180"></i> {isRtl ? 'عرض دوراتي' : 'My Courses'}
                  </Link>
                  <div>
                    <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{coursesCount}</h3>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentOverview.coursesInProgress')}</p>
                  </div>
                </div>
              </div>
              
              {/* Certificates Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-award text-lg"></i>
                </div>
                <div className="text-right w-full flex justify-between items-end">
                  <Link to="/dashboard/certificates" className="text-xs font-bold text-primary dark:text-amber-400 hover:underline flex items-center">
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-0 rotate-180"></i> {t('studentOverview.viewCertificate')}
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
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-0 rotate-180"></i> {isRtl ? 'عرض الواجبات' : 'View Tasks'}
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
              <div className="text-start">
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
                  const hasHours = item.hours > 0;
                  const barHeight = hasHours ? Math.max(8, (item.hours / maxHours) * 100) : 0;
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

                      {/* Active Fill only if actual hours exist */}
                      {hasHours && (
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="8"
                          fill={isHovered ? "url(#barHoverGrad)" : "url(#barGoldGrad)"}
                          className="transition-all duration-300 filter drop-shadow-xs"
                        />
                      )}

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
                        y={hasHours ? y - 6 : 128}
                        textAnchor="middle"
                        className={`text-[10px] font-mono font-bold transition-all ${
                          hasHours
                            ? (isHovered ? 'fill-primary opacity-100 font-black' : 'fill-[#B38F24] dark:fill-amber-400 opacity-90')
                            : 'fill-gray-400 dark:fill-gray-500 opacity-60'
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
                  <span>📚 {weeklyActivity[hoveredBar].lessons} {isRtl ? 'مهام / محاضرات منجزة' : 'completed tasks'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Radial Track Progress Gauge (1 Col) */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <div className="text-start">
              <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                <span>{isRtl ? 'إنجاز المسار الدراسي' : 'Curriculum Progress'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isRtl ? 'النسبة التراكمية الفعلية للمساقات والمهام' : 'Real cumulative track completion metric'}
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
                  {isRtl ? 'معدل الإنجاز الفعلي' : 'Real Completion'}
                </span>
              </div>
            </div>

            {/* Micro Breakdown Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
              <div className="bg-[#FAF7F2] dark:bg-gray-700/30 p-2 rounded-xl text-center">
                <span className="block font-bold text-dark dark:text-white">{coursesCount}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{isRtl ? 'دورات مسجلة' : 'Enrolled Courses'}</span>
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
          
          {/* Continue Learning Dynamic Card (2 Cols) */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-6 text-start transition-colors">
              {t('studentOverview.continueLearning')}
            </h2>
            
            {currentActiveCourse ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div className="text-start">
                      {currentActiveCourse.category && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-1">
                          {currentActiveCourse.category}
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-bold text-dark dark:text-white">
                        {currentActiveCourse.title}
                      </h3>
                      {currentActiveCourse.instructor && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isRtl ? 'المدرب:' : 'Instructor:'} <strong className="text-dark dark:text-gray-300">{currentActiveCourse.instructor}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-start sm:text-end shrink-0">
                    <span className="text-xl font-black font-jetbrains text-primary dark:text-amber-400">
                      {currentActiveCourse.progress}%
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {currentActiveCourse.completedLessonsCount} {isRtl ? 'من' : 'of'} {currentActiveCourse.totalLessons || '—'} {isRtl ? 'محاضرة مكتملة' : 'completed lessons'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentActiveCourse.progress >= 100
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-secondary to-primary'
                    }`}
                    style={{ width: `${currentActiveCourse.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap">
                  <Link
                    to={`/courses/${currentActiveCourse.courseId}`}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    <span>{isRtl ? 'متابعة الدورة' : 'Continue Course'}</span>
                  </Link>
                  <Link
                    to="/dashboard/my-courses"
                    className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span>{isRtl ? 'عرض جميع دوراتي المسجلة' : 'All My Courses'}</span>
                    <i className="fa-solid fa-arrow-left text-[10px] rtl:rotate-0 rotate-180"></i>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 transition-colors">
                <i className="fa-solid fa-book-open text-5xl mb-4 text-gray-300 dark:text-gray-600"></i>
                <p className="font-bold text-base text-gray-600 dark:text-gray-300">
                  {t('studentOverview.noCourses')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                  {isRtl ? 'لم تقم بالتسجيل في أي دورة بعد. استكشف مكتبة الدورات وابدأ مسارك المهني الآن.' : 'You have not enrolled in any courses yet. Explore our courses library and start learning now.'}
                </p>
                <Link to="/courses" className="mt-5 px-5 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span>{t('studentOverview.exploreCourses')}</span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Dynamic Badges Card (1 Col) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors min-h-75">
              <div className="flex items-center justify-between mb-4">
                <Link to="/dashboard/certificates" className="text-xs font-semibold text-primary dark:text-amber-400 hover:underline flex items-center">
                  <i className="fa-solid fa-arrow-left ms-1 text-[10px] rtl:rotate-0 rotate-180"></i> {isRtl ? 'الشهادات' : 'Certificates'}
                </Link>
                <div className="text-start">
                  <h2 className="text-base font-bold text-dark dark:text-white">{t('studentOverview.recentBadges')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {unlockedBadges.length} {t('common.of')} {badgesList.length} {t('studentOverview.badgesUnlocked')}
                  </p>
                </div>
              </div>
              
              {unlockedBadges.length === 0 ? (
                <div className="bg-[#FAF7F2] dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center text-center flex-1 border border-[#E8E2D5] dark:border-gray-800 transition-colors">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3 shadow-sm">
                    <i className="fa-solid fa-shield-halved text-xl"></i>
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('studentOverview.noBadges')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unlockedBadges.slice(0, 3).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-gray-900/60 border border-[#E8E2D5] dark:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs ${badge.color}`}>
                          <span className="material-symbols-outlined text-base">{badge.icon}</span>
                        </div>
                        <div className="text-start">
                          <h4 className="text-xs font-bold text-dark dark:text-white">{badge.title}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{badge.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {isRtl ? 'مفتوحة' : 'Unlocked'}
                      </span>
                    </div>
                  ))}
                  {unlockedBadges.length > 3 && (
                    <p className="text-center text-[11px] font-bold text-primary dark:text-amber-400 pt-1">
                      +{unlockedBadges.length - 3} {isRtl ? 'شارات إضافية مفتوحة' : 'more badges unlocked'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
