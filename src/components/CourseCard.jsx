import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Helper to determine best fallback icon based on title or category
export const getCourseIcon = (course) => {
  if (course?.icon) return course.icon;
  const title = (course?.title || '').toLowerCase();
  const category = (course?.category || '').toLowerCase();

  if (title.includes('ux') || title.includes('ui') || title.includes('تصميم') || category.includes('تصميم')) return 'palette';
  if (title.includes('فوتوشوب') || title.includes('معماري') || title.includes('إظهار')) return 'image';
  if (title.includes('ويب') || title.includes('web') || title.includes('منصات')) return 'language';
  if (title.includes('برمجة') || title.includes('كود') || title.includes('ذماء')) return 'terminal';
  if (title.includes('قواعد') || title.includes('بيانات') || title.includes('data')) return 'database';
  return 'school';
};

const CourseCard = ({ course, isEnrolled = false }) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  if (!course) return null;

  const iconName = getCourseIcon(course);
  
  // Format Level Pill
  const levelRaw = (course.level || 'BEGINNER').toUpperCase();
  let levelDisplay = isRtl ? 'مبتدئ' : 'BEGINNER';
  if (levelRaw === 'INTERMEDIATE' || levelRaw === 'متوسط') {
    levelDisplay = isRtl ? 'متوسط' : 'INTERMEDIATE';
  } else if (levelRaw === 'ADVANCED' || levelRaw === 'متقدم') {
    levelDisplay = isRtl ? 'متقدم' : 'ADVANCED';
  }

  // Format Code Slug/Tag Pill
  const slugTag = course.tag || (course.category ? course.category.toLowerCase().replace(/\s+/g, '.') : 'course.core');

  // Instructor Name with i18n fallback
  const rawInstructor = course.instructor || '';
  let instructorName = rawInstructor;
  if (!isRtl) {
    if (!rawInstructor || rawInstructor === 'عبدالرحمن نعيم' || rawInstructor === 'م. عبدالرحمن نعيم') {
      instructorName = 'Abdul Rahman Naeem';
    }
  } else {
    if (!rawInstructor) {
      instructorName = 'م. عبدالرحمن نعيم';
    }
  }

  // Rating or Status
  const ratingVal = Number(course.ratingAverage ?? course.rating ?? 0);
  const studentsCount = course.studentsCount || course.students || 0;
  const hasRating = ratingVal > 0;

  // Price Display
  const isFree = !course.price || course.price === 'Free' || course.price === 'free';
  const priceDisplay = isFree ? (isRtl ? 'مجاني' : 'Free') : course.price;

  const startLearningText = isRtl ? 'ابدأ التعلم الآن' : 'Start Learning Now';
  const continueLearningText = isRtl ? 'متابعة الدراسة' : 'Continue Learning';
  const availableText = isRtl ? 'متاح للالتحاق' : 'Available for Enrollment';
  const enrolledBadgeText = isRtl ? 'مسجل به' : 'Enrolled';
  const activeStatusText = isRtl ? 'مشترك بالفعل' : 'Enrolled';

  return (
    <div className="bg-white dark:bg-[#161412] border border-[#E8E2D5] dark:border-[#2C2722] rounded-2xl overflow-hidden shadow-sm dark:shadow-xl hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.25)] transition-all duration-300 group flex flex-col justify-between text-right rtl:text-right ltr:text-left h-full">
      {/* Top Header Box */}
      <div className="bg-[#F5F0E6] dark:bg-[#1D1915] border-b border-[#E8E2D5] dark:border-[#2C2722] p-6 flex flex-col items-center justify-center relative min-h-[220px] w-full group-hover:bg-[#EFE9DC] dark:group-hover:bg-[#221D18] transition-colors">
        {/* Top Level Badge */}
        <div className="absolute top-4 inset-e-4 bg-amber-100 dark:bg-[#2B231B] text-amber-800 dark:text-[#D9A54C] border border-amber-300/80 dark:border-[#423524] text-[11px] font-bold px-3 py-1 rounded-full shadow-xs tracking-wide">
          {levelDisplay}
        </div>

        {/* Top Enrolled Badge */}
        {isEnrolled && (
          <div className="absolute top-4 inset-s-4 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 z-10">
            <span className="material-symbols-outlined text-xs">verified</span>
            <span>{enrolledBadgeText}</span>
          </div>
        )}

        {/* Center Course Icon Box */}
        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#28221B] border border-amber-300/80 dark:border-[#3E3326] flex items-center justify-center text-amber-600 dark:text-[#D9A54C] shadow-sm dark:shadow-inner group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-4xl">{iconName}</span>
        </div>

        {/* Bottom Left Code Slug Tag */}
        <div className="absolute bottom-4 inset-s-4 bg-white/90 dark:bg-[#201D19]/90 border border-[#E8E2D5] dark:border-[#322A21] text-gray-600 dark:text-stone-400 text-[10px] font-mono px-2.5 py-1 rounded-md line-clamp-1 max-w-[55%] dir-ltr">
          {slugTag}
        </div>
      </div>

      {/* Bottom Content Container */}
      <div className="p-6 flex flex-col grow justify-between bg-white dark:bg-[#161412]">
        {/* Top Row: Instructor Badge & Rating/Status */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            {/* Right: Instructor Avatar Pill */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-[#28221B] border border-amber-200 dark:border-[#3E3326] text-amber-800 dark:text-[#D9A54C] flex items-center justify-center text-xs font-bold shrink-0">
                {course.avatar ? course.avatar.substring(0, 1) : instructorName.charAt(0)}
              </div>
              <span className="text-xs text-gray-700 dark:text-stone-300 font-bold line-clamp-1">{instructorName}</span>
            </div>

            {/* Left: Rating or Availability */}
            {hasRating ? (
              <div className="text-amber-600 dark:text-[#D9A54C] font-bold text-xs flex items-center gap-1">
                <span>★ {ratingVal.toFixed(1)}</span>
                {studentsCount > 0 && <span className="text-gray-500 dark:text-stone-400 font-normal">({studentsCount} {isRtl ? 'طلاب' : 'students'})</span>}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-stone-400 text-xs font-medium">{availableText}</span>
            )}
          </div>

          {/* Course Main Title */}
          <h3 className="text-dark dark:text-white font-bold text-lg md:text-xl leading-snug line-clamp-2 mb-2 group-hover:text-primary dark:group-hover:text-[#D9A54C] transition-colors font-headline-md">
            {course.title}
          </h3>

          {/* Course Description */}
          <p className="text-gray-600 dark:text-stone-400 text-xs line-clamp-2 leading-relaxed mb-6 font-body-md">
            {course.description || (isRtl ? 'تعلم وفكر مع أفضل التطبيقات العلمية والعملية.' : 'Learn with practical exercises and projects.')}
          </p>
        </div>

        {/* Bottom Action Row */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D5] dark:border-[#2C2722] mt-auto">
          {/* Action Button */}
          <Link
            to={`/courses/${course.id}`}
            className={`${
              isEnrolled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary dark:bg-[#D9A54C] hover:bg-secondary dark:hover:bg-[#E5B65C] text-white dark:text-[#12100E]'
            } font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-1.5`}
          >
            {isEnrolled && <span className="material-symbols-outlined text-sm">play_circle</span>}
            <span>{isEnrolled ? continueLearningText : startLearningText}</span>
          </Link>

          {/* Right: Price or Enrolled status */}
          {isEnrolled ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">school</span>
              <span>{activeStatusText}</span>
            </span>
          ) : (
            <span className="text-primary dark:text-[#D9A54C] font-bold text-base md:text-lg">
              {priceDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
