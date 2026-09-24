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
  
  const activeUserData = userData || user;

  // Language-agnostic course filtering based on UID + multilingual fallback
  const myCourses = courses.filter(c => isCourseOwnedByInstructor(c, currentUser, activeUserData));

  // Instructor display name based on current language
  const displayName = lang === 'en'
    ? (activeUserData?.name_en || activeUserData?.fullName_en || activeUserData?.name || activeUserData?.fullName || currentUser?.displayName || t('instructorOverview.instructor'))
    : (activeUserData?.name || activeUserData?.fullName || currentUser?.displayName || t('instructorOverview.instructor'));
  
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
                      {(course.price === 'Free' || course.price === 'free' || !course.price) ? (dir === 'rtl' ? 'مجاني' : 'Free') : course.price}
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