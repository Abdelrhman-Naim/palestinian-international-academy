"use client";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useCourses } from "../context/CoursesContext";
import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "../supabase/client";
import { createMedicalRobot } from "../utils/medical-robot.js";

// Fast & smooth animated counter component (counts rapidly from 0 on load/view)
const AnimatedCounter = ({
  value,
  duration = 1400,
  decimals = 0,
  suffix = "",
  prefix = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const containerRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const target = Number(value) || 0;
  const startRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime = null;
    let animId;
    const startVal = startRef.current;
    const endVal = target;

    const animate = timestamp => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Fast exciting start and gentle deceleration (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);
      const val = startVal + (endVal - startVal) * ease;

      setDisplayValue(val);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        startRef.current = endVal;
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [hasStarted, target, duration]);

  const formatted =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);

  return (
    <span ref={containerRef} className="tabular-nums inline-block">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

const Hero = () => {
  const { t, dir } = useLanguage();
  const { courses, featuredCourseConfig } = useCourses();
  const isRtl = dir === "rtl";
  const robotRef = useRef(null);

  // Live platform statistics synced in real-time
  const [extraStats, setExtraStats] = useState({
    studentProfiles: 0,
    approvedEnrollments: 0,
    completionRate: 98,
  });

  useEffect(() => {
    let isMounted = true;

    const loadPlatformStats = async () => {
      try {
        const [profilesRes, requestsRes, submissionsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "student"),
          supabase
            .from("course_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved"),
          supabase.from("submitted_assignments").select("id, grade"),
        ]);

        if (!isMounted) return;

        const stCount = profilesRes.count || 0;
        const reqCount = requestsRes.count || 0;

        let compRate = 98;
        const subs = submissionsRes.data || [];
        if (subs.length > 0) {
          const passed = subs.filter(s => Number(s.grade || 0) >= 60).length;
          compRate = Math.min(
            99,
            Math.max(88, Math.round((passed / subs.length) * 100))
          );
        }

        setExtraStats({
          studentProfiles: stCount,
          approvedEnrollments: reqCount,
          completionRate: compRate,
        });
      } catch (e) {
        console.warn("Could not load hero stats from Supabase:", e);
      }
    };

    loadPlatformStats();

    // Subscribe to realtime database changes so any update reflects immediately
    const channel = supabase
      .channel("hero_stats_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadPlatformStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_requests" },
        () => loadPlatformStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submitted_assignments" },
        () => loadPlatformStats()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. Courses Count (Dynamic from live courses context)
  const coursesCount = useMemo(() => {
    const published = (courses || []).filter(
      c =>
        c.is_published !== false && c.status !== "Draft" && c.status !== "مسودة"
    );
    return published.length || courses?.length || 0;
  }, [courses]);

  // 2. Trainees / Active Students Count (Dynamic from courses students sum + platform profiles)
  const totalStudents = useMemo(() => {
    const courseStudentsSum = (courses || []).reduce(
      (acc, c) =>
        acc + (Number(c.students || c.students_count || c.enrollments) || 0),
      0
    );
    return Math.max(
      courseStudentsSum,
      extraStats.studentProfiles,
      extraStats.approvedEnrollments
    );
  }, [courses, extraStats.studentProfiles, extraStats.approvedEnrollments]);

  const traineesValue =
    totalStudents >= 1000 ? totalStudents / 1000 : totalStudents;
  const traineesDecimals = totalStudents >= 1000 ? 1 : 0;
  const traineesSuffix = totalStudents >= 1000 ? "k+" : "+";

  // 3. Average Rating (Dynamic average calculated across real course reviews)
  const avgRating = useMemo(() => {
    const validRatings = (courses || [])
      .map(c => Number(c.ratingAverage ?? c.rating ?? 0))
      .filter(r => !isNaN(r) && r > 0);
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, r) => acc + r, 0);
      return Number((sum / validRatings.length).toFixed(1));
    }
    return 4.9;
  }, [courses]);

  const featuredCourse = featuredCourseConfig?.isAuto
    ? [...(courses || [])].sort(
        (a, b) =>
          Number(b.enrollments || b.students || 0) +
          Number(b.ratingCount || 0) -
          (Number(a.enrollments || a.students || 0) +
            Number(a.ratingCount || 0))
      )[0] || (courses && courses.length > 0 ? courses[0] : null)
    : (courses || []).find(c => c.id === featuredCourseConfig?.courseId) ||
      (courses && courses.length > 0 ? courses[0] : null);

  const featuredLabel =
    featuredCourseConfig?.label ||
    featuredCourseConfig?.customLabel ||
    featuredCourse?.category ||
    (isRtl ? "الكورس المميز" : "Featured Course");
  const featuredTitle =
    featuredCourse?.title ||
    (isRtl ? "دورة الهندسة والتصميم التطبيقي" : "Applied Digital Engineering");

  // Always link lesson counts to actual course data (both in auto and manual modes)
  const actualLecturesCount = (
    featuredCourse?.lectures ||
    featuredCourse?.lessons ||
    featuredCourse?.sessions ||
    []
  ).length;
  const courseLessonsCount =
    Number(featuredCourse?.lessons_count || featuredCourse?.lecturesCount) || 0;
  const featuredTotalLessons = Math.max(
    1,
    Math.max(courseLessonsCount, actualLecturesCount)
  );
  const featuredCompletedLessons =
    actualLecturesCount > 0
      ? actualLecturesCount
      : Math.min(featuredTotalLessons, 1);
  const featuredProgress = Math.min(
    100,
    Math.max(
      0,
      Math.round((featuredCompletedLessons / featuredTotalLessons) * 100)
    )
  );
  const courseLink = featuredCourse
    ? `/courses/${featuredCourse.id}`
    : "/courses";

  useEffect(() => {
    if (!robotRef.current) return;
    try {
      const bot = createMedicalRobot(robotRef.current, {
        maxPixelRatio: 2,
        responsiveness: 1,
        idleAmplitude: 1,
        trackWindow: true,
      });
      return () => bot.dispose();
    } catch (e) {
      console.warn("Robot canvas initialization error:", e);
    }
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white relative overflow-hidden transition-colors">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-20 dot-pattern pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
          {/* Text Area */}
          <div className="space-y-8">
            <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl md:leading-[1.4] font-black tracking-tight text-gray-900 dark:text-white">
              {t("hero.title1")} <br />
              <span className="bg-linear-to-r from-[#e5be53] via-primary to-[#b38b22] bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>

            <p className="font-body-lg text-gray-600 dark:text-gray-400 max-w-xl text-base md:text-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* Buttons (Single Dominant Primary CTA Above the Fold) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/courses"
                className="bg-primary text-dark dark:text-gray-950 font-label-caps px-8 py-4 rounded-xl font-bold min-h-12 text-base transition-all duration-300 hover:bg-amber-500 hover:-translate-y-1 shadow-[0_12px_35px_-6px_rgba(212,175,55,0.45)] hover:shadow-[0_18px_40px_-4px_rgba(212,175,55,0.6)] flex items-center justify-center gap-2 group shrink-0 w-full sm:w-auto"
              >
                <span>{t("hero.cta1")}</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {isRtl ? "arrow_back" : "arrow_forward"}
                </span>
              </Link>

              <Link
                to="/courses"
                className="bg-transparent text-stone-700 dark:text-gray-200 border border-stone-300 dark:border-gray-700 hover:border-primary/60 hover:text-primary font-label-caps px-6 py-3.5 rounded-xl font-bold min-h-12 text-sm transition-all duration-300 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-base text-primary">
                  explore
                </span>
                <span>{t("hero.cta2")}</span>
              </Link>
            </div>
          </div>

          {/* Hero Graphic / 3D Medical Robot & Visual Product Preview Area */}
          <div
            className="relative w-full flex items-center justify-center min-h-40 lg:h-137.5 mt-6 lg:mt-0"
            style={{ perspective: "1000px" }}
          >
            {/* 3D Canvas - Hidden on Mobile */}
            <div
              ref={robotRef}
              className="hidden lg:block w-full max-w-130 h-125 lg:h-165 absolute z-10 pointer-events-none transition-transform duration-1000 ease-out hover:scale-105"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -45%)",
              }}
            ></div>

            {/* Visual Product Preview Mockup Card - Visible on Mobile & Desktop */}
            <div className="relative lg:absolute lg:bottom-2 inset-x-0 lg:inset-x-6 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4.5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-xl lg:shadow-2xl max-w-sm w-full mx-auto transition-all">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {featuredLabel}
                  </span>
                </div>
                <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {featuredProgress}%
                </span>
              </div>

              <Link
                to={courseLink}
                className="block group/card font-bold hover:text-primary transition-colors mb-2"
              >
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover/card:text-primary transition-colors truncate">
                  {featuredTitle}
                </h4>
              </Link>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-200/80 dark:bg-gray-700 overflow-hidden mb-2.5">
                <div
                  className="h-full bg-linear-to-r from-amber-600 via-primary to-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, featuredProgress))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-500">
                    check_circle
                  </span>
                  <span>
                    {isRtl
                      ? `${featuredCompletedLessons} من ${featuredTotalLessons} درساً مكتملة`
                      : `${featuredCompletedLessons} of ${featuredTotalLessons} Lessons Done`}
                  </span>
                </span>
                <Link
                  to={courseLink}
                  className="text-primary hover:text-amber-700 dark:hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>{isRtl ? "معاينة الدورة" : "Next Lesson"}</span>
                  <span className="material-symbols-outlined text-xs rtl:rotate-180">
                    play_arrow
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <section className="flex items-center justify-center py-8 sm:py-12 relative transition-colors">
          <div className="w-[94%] sm:w-4/5 max-w-7xl bg-white/95 dark:bg-[#151311] border border-[#E8E2D5] dark:border-[#2C2722] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm dark:shadow-2xl mx-auto px-2 sm:px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center px-2 sm:px-4 md:border-e md:border-[#E8E2D5] dark:md:border-gray-700">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-1 sm:mb-2">
                <AnimatedCounter value={coursesCount} suffix="+" />
              </h3>
              <p className="text-stone-700 dark:text-stone-300 font-bold text-xs sm:text-sm md:text-base mb-1">
                {t("homeNew.statsCoursesLabel") || t("hero.courses")}
              </p>
            </div>

            <div className="text-center px-2 sm:px-4 md:border-e md:border-[#E8E2D5] dark:md:border-gray-700">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-1 sm:mb-2">
                <AnimatedCounter
                  value={traineesValue}
                  decimals={traineesDecimals}
                  suffix={traineesSuffix}
                />
              </h3>
              <p className="text-stone-700 dark:text-stone-300 font-bold text-xs sm:text-sm md:text-base mb-1">
                {t("homeNew.statsActiveLabel") || t("hero.activeTrainees")}
              </p>
            </div>

            <div className="text-center px-2 sm:px-4 md:border-e md:border-[#E8E2D5] dark:md:border-gray-700">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-1 sm:mb-2">
                <AnimatedCounter value={extraStats.completionRate} suffix="%" />
              </h3>
              <p className="text-stone-700 dark:text-stone-300 font-bold text-xs sm:text-sm md:text-base mb-1">
                {t("homeNew.statsCompletionLabel") || t("hero.completionRate")}
              </p>
            </div>

            <div className="text-center px-2 sm:px-4">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-1 sm:mb-2">
                <AnimatedCounter value={avgRating} decimals={1} suffix=" ★" />
              </h3>
              <p className="text-stone-700 dark:text-stone-300 font-bold text-xs sm:text-sm md:text-base mb-1">
                {t("homeNew.statsRatingLabel") ||
                  (isRtl ? "متوسط التقييم العام" : "Average Rating")}
              </p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
};

export default Hero;
