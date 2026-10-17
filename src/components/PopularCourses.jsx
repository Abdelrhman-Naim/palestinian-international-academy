"use client";
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import { useLanguage } from '../context/LanguageContext';
import CourseCard from './CourseCard';

const PopularCourses = () => {
  const { courses, loading } = useCourses();
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  
  // Sort published courses by real enrollments, ratings, and recency
  const topCourses = useMemo(() => {
    return [...(courses || [])]
      .filter(c => c.is_published !== false && c.status !== 'Draft' && c.status !== 'مسودة')
      .sort((a, b) => {
        // 1. Sort by real student enrollments
        const enrollA = Number(a.students_count || a.students || a.enrollments || 0);
        const enrollB = Number(b.students_count || b.students || b.enrollments || 0);
        if (enrollB !== enrollA) return enrollB - enrollA;

        // 2. Sort by real review average / rating
        const rateA = Number(a.ratingAverage ?? a.rating ?? 0);
        const rateB = Number(b.ratingAverage ?? b.rating ?? 0);
        if (rateB !== rateA) return rateB - rateA;

        // 3. Sort by review count
        const rcA = Number(a.ratingCount ?? a.rating_count ?? 0);
        const rcB = Number(b.ratingCount ?? b.rating_count ?? 0);
        if (rcB !== rcA) return rcB - rcA;

        // 4. Sort by newest created_at
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [courses]);

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-14 sm:py-24 px-4 md:px-8 transition-colors border-t border-[#E8E2D5] dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 space-y-2 sm:space-y-3 flex flex-col items-center">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t("popularCourses.label") || (isRtl ? 'الأكثر تسجيلاً ومطلوبة في سوق العمل' : 'Most Enrolled & In-Demand')}
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-5xl text-dark dark:text-white font-black pt-1">
            {t("popularCourses.title") || (isRtl ? 'دورات هندسية وتقنية متخصصة' : 'Specialized Engineering & Tech Courses')}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))
          ) : topCourses.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-gray-400 dark:text-gray-500 border border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl">
              <span className="material-symbols-outlined text-5xl mb-3 text-gray-300 dark:text-gray-600">school</span>
              <p className="text-base font-bold">{isRtl ? 'لا توجد دورات متاحة حالياً' : 'No courses available currently'}</p>
            </div>
          ) : (
            topCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          )}
        </div>
        
        <div className="mt-10 sm:mt-16 flex justify-center">
          <Link to="/courses" className="text-primary font-bold text-sm flex items-center gap-2 hover:underline">
            {t("popularCourses.browseAll")}
            <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;

