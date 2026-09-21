import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import { useLanguage } from '../context/LanguageContext';
import CourseCard from './CourseCard';

const PopularCourses = () => {
  const { courses } = useCourses();
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  
  // Get top 3 highest rated published courses
  const topCourses = [...courses]
    .filter(c => c.status !== '' && c.status !== 'Draft')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-24 px-4 md:px-8 transition-colors border-t border-[#E8E2D5] dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-3 flex flex-col items-center">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t("popularCourses.label") || (isRtl ? 'الأكثر تسجيلاً ومطلوبة في سوق العمل' : 'Most Enrolled & In-Demand')}
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl text-dark dark:text-white font-black pt-1">
            {t("popularCourses.title") || (isRtl ? 'دورات هندسية وتقنية متخصصة' : 'Specialized Engineering & Tech Courses')}
          </h2>
        </div>
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        
        <div className="mt-16 flex justify-center">
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

