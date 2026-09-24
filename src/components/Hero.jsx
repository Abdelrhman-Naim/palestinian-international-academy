import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCourses } from '../context/CoursesContext';
import { useEffect, useRef } from 'react';
import { createMedicalRobot } from '../utils/medical-robot.js';

const Hero = () => {
  const { t, dir } = useLanguage();
  const { courses, featuredCourseConfig } = useCourses();
  const isRtl = dir === 'rtl';
  const robotRef = useRef(null);

  const featuredCourse = (courses || []).find(c => c.id === featuredCourseConfig?.courseId) 
    || (courses && courses.length > 0 ? courses[0] : null);

  const featuredLabel = featuredCourseConfig?.label || (isRtl ? 'الكورس المميز' : 'Featured Course');
  const featuredTitle = featuredCourse?.title || (isRtl ? 'دورة الهندسة والتصميم التطبيقي' : 'Applied Digital Engineering');
  const featuredTotalLessons = Math.max(1, Number(featuredCourseConfig?.totalLessons) || featuredCourse?.lectures?.length || 10);
  const featuredCompletedLessons = Math.max(0, Math.min(featuredTotalLessons, Number(featuredCourseConfig?.completedLessons ?? 8)));
  const featuredProgress = Math.min(100, Math.max(0, featuredCourseConfig?.progress !== undefined ? Number(featuredCourseConfig.progress) : Math.round((featuredCompletedLessons / featuredTotalLessons) * 100)));
  const courseLink = featuredCourse ? `/courses/${featuredCourse.id}` : '/courses';

  useEffect(() => {
    if (!robotRef.current) return;
    try {
      const bot = createMedicalRobot(robotRef.current, {
        maxPixelRatio: 2,
        responsiveness: 1,
        idleAmplitude: 1,
        trackWindow: true
      });
      return () => bot.dispose();
    } catch (e) {
      console.warn('Robot canvas initialization error:', e);
    }
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white relative overflow-hidden pt-28 pb-20 transition-colors">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-20 dot-pattern pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
          
          {/* Text Area */}
          <div className="space-y-8">
            <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl md:leading-[1.2] font-black tracking-tight text-gray-900 dark:text-white">
              {t("hero.title1")} <br/>
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
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </Link>

              <Link 
                to="/courses" 
                className="bg-transparent text-stone-700 dark:text-gray-200 border border-stone-300 dark:border-gray-700 hover:border-primary/60 hover:text-primary font-label-caps px-6 py-3.5 rounded-xl font-bold min-h-12 text-sm transition-all duration-300 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-base text-primary">explore</span>
                <span>{t("hero.cta2")}</span>
              </Link>
            </div>
            
          </div>
          
          {/* Hero Graphic / 3D Medical Robot & Visual Product Preview Area */}
          <div className="relative w-full flex items-center justify-center min-h-40 lg:h-137.5 mt-6 lg:mt-0" style={{ perspective: '1000px' }}>
            {/* 3D Canvas - Hidden on Mobile */}
            <div
              ref={robotRef}
              className="hidden lg:block w-full max-w-130 h-125 lg:h-165 absolute z-10 pointer-events-none transition-transform duration-1000 ease-out hover:scale-105"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -45%)'
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

              <Link to={courseLink} className="block group/card font-bold hover:text-primary transition-colors mb-2">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover/card:text-primary transition-colors truncate">
                  {featuredTitle}
                </h4>
              </Link>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-200/80 dark:bg-gray-700 overflow-hidden mb-2.5">
                <div className="h-full bg-linear-to-r from-amber-600 via-primary to-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, featuredProgress))}%` }} />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
                  <span>{isRtl ? `${featuredCompletedLessons} من ${featuredTotalLessons} درساً مكتملة` : `${featuredCompletedLessons} of ${featuredTotalLessons} Lessons Done`}</span>
                </span>
                <Link to={courseLink} className="text-primary hover:text-amber-700 dark:hover:text-amber-300 font-bold flex items-center gap-1 transition-colors">
                  <span>{isRtl ? 'معاينة الدورة' : 'Next Lesson'}</span>
                  <span className="material-symbols-outlined text-xs rtl:rotate-180">play_arrow</span>
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Stats Section (WCAG AA Compliant High Contrast Numbers) */}
              <section className="flex items-center justify-center">
                  <div className="w-4/5 bg-white/95 dark:bg-[#151311] border border-[#E8E2D5] dark:border-[#2C2722] rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { num: t('about.stat1Num'), label: t('about.stat1Label'), sub: t('about.stat1Sub') },
                      { num: t('about.stat2Num'), label: t('about.stat2Label'), sub: t('about.stat2Sub') },
                      { num: t('about.stat3Num'), label: t('about.stat3Label'), sub: t('about.stat3Sub') },
                      { num: t('about.stat4Num'), label: t('about.stat4Label'), sub: t('about.stat4Sub') },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-5 sm:py-3 text-center flex flex-col justify-center items-center ${
                          idx !== 0 ? 'border-t lg:border-t-0 lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        } ${
                          idx === 1 ? 'sm:border-s lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        } ${
                          idx === 2 ? 'sm:border-t sm:border-s lg:border-t-0 lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        }`}
                      >
                        <div className="font-stats-number text-3xl sm:text-4xl lg:text-5xl font-black text-dark dark:text-white mb-2 tracking-tight">
                          {stat.num}
                        </div>
                        <div className="text-dark dark:text-white font-extrabold text-sm sm:text-base mb-1.5 leading-snug max-w-55">
                          {stat.label}
                        </div>
                        <div className="text-gray-500 dark:text-stone-400 text-xs leading-relaxed max-w-55">
                          {stat.sub}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
      <section className="bg-[#F3EFE6] dark:bg-gray-800/90 py-12 border-y border-[#E8E2D5] dark:border-gray-700 relative z-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 md:divide-x md:divide-[#E8E2D5] dark:md:divide-gray-700 rtl:md:divide-x-reverse">
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-2">+5</h3>
            <p className="text-stone-700 dark:text-stone-300 font-bold text-sm md:text-base mb-1">{t("homeNew.statsCoursesLabel") || t("hero.courses")}</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-2">+2.4k</h3>
            <p className="text-stone-700 dark:text-stone-300 font-bold text-sm md:text-base mb-1">{t("homeNew.statsActiveLabel") || t("hero.activeTrainees")}</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-2">98%</h3>
            <p className="text-stone-700 dark:text-stone-300 font-bold text-sm md:text-base mb-1">{t("homeNew.statsCompletionLabel") || t("hero.completionRate")}</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-amber-800 dark:text-amber-300 mb-2">★ 4.9</h3>
            <p className="text-stone-700 dark:text-stone-300 font-bold text-sm md:text-base mb-1">{t("homeNew.statsRatingLabel") || "التقييم العام"}</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
