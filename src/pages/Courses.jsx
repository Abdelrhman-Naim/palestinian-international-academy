import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CourseCard from '../components/CourseCard';
import { useCategories } from '../context/CategoriesContext';
import { useCourses } from '../context/CoursesContext';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const Courses = ({ embedded = false }) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const { categories: contextCategories } = useCategories();
  const { courses: coursesData, loading } = useCourses();
  const [selectedCategory, setSelectedCategory] = useState(t('studentAssignments.all'));
  const [selectedLevel, setSelectedLevel] = useState(t('studentAssignments.all'));
  const [selectedPrice, setSelectedPrice] = useState(t('studentAssignments.all'));
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = {};
    (coursesData || []).forEach((c) => {
      const isPublished = c.status !== '' && c.status !== 'Draft';
      if (c.category && isPublished) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return counts;
  }, [coursesData]);

  const categories = useMemo(() => {
    const allOption = { name: t('studentAssignments.all'), label: t('studentAssignments.all') };
    const availableCategories = (contextCategories?.courses || [])
      .filter((cat) => (categoryCounts[cat] || 0) > 0)
      .map((cat) => ({ name: cat, label: cat }));
    return [allOption, ...availableCategories];
  }, [t, contextCategories?.courses, categoryCounts]);

  const levels = [
    { name: t('studentAssignments.all'), label: t('studentAssignments.all') },
    { name: 'BEGINNER', label: t('addCourse.beginner') },
    { name: 'INTERMEDIATE', label: t('addCourse.intermediate') },
    { name: 'ADVANCED', label: t('addCourse.advanced') }
  ];

  const prices = [
    { name: t('studentAssignments.all'), label: t('studentAssignments.all') },
    { name: 'Free', label: t('courseDetail.free') },
    { name: 'Paid', label: t('courses.paid') }
  ];

  const sortOptions = useMemo(() => [
    { value: 'popular', label: t('courses.sortPopular') },
    { value: 'newest', label: t('courses.sortNewest') },
    { value: 'title', label: t('courses.sortTitle') }
  ], [t]);

  const filteredCourses = useMemo(() => {
    const list = (coursesData || []).filter(course => {
      const matchCategory = selectedCategory === t('studentAssignments.all') || course.category === selectedCategory;
      const matchLevel = selectedLevel === t('studentAssignments.all') || course.level === selectedLevel;
      const matchPrice = selectedPrice === t('studentAssignments.all') || (selectedPrice === 'Free' ? course.price === 'Free' : course.price !== 'Free');
      const isPublished = course.status !== '' && course.status !== 'Draft';
      return matchCategory && matchLevel && matchPrice && isPublished;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'popular') {
        const ratingA = Number(a.ratingAverage ?? a.rating ?? 0);
        const ratingB = Number(b.ratingAverage ?? b.rating ?? 0);
        return ratingB - ratingA;
      }
      if (sortBy === 'newest') {
        const dateA = a.createdAt?.seconds || (Number(a.year) || 0);
        const dateB = b.createdAt?.seconds || (Number(b.year) || 0);
        return dateB - dateA;
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [coursesData, selectedCategory, selectedLevel, selectedPrice, sortBy, t]);

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors`} dir={dir}>
      {!embedded && <Navbar />}
      
      <main className="grow">
        {/* Header Banner */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-16 px-4 border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="max-w-7xl mx-auto relative z-10">
            <Breadcrumbs items={[{ label: t('navbar.courses') || (isRtl ? 'الدورات' : 'Courses') }]} />
            <div className="text-center mt-4">
              <p className="text-sm font-label-caps text-secondary mb-3 tracking-widest">{t('courses.catalogLabel')}</p>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 font-headline-lg text-dark dark:text-white">{t('courses.catalogTitle')}</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">{t('courses.catalogSubtitle')}</p>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-8 relative">
          
          {/* Mobile Overlay */}
          {isMobileFiltersOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
          )}

          {/* Sidebar / Filters */}
          <aside className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} z-50 w-72 bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent transform transition-transform duration-300 lg:relative lg:w-1/4 lg:translate-x-0 ${isMobileFiltersOpen ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')} lg:block shadow-2xl lg:shadow-none overflow-y-auto lg:overflow-visible h-full lg:h-auto`}>
            <div className="bg-white dark:bg-gray-800 lg:border border-[#E8E2D5] dark:border-gray-700 lg:rounded-2xl p-6 shadow-sm sticky top-28 transition-colors min-h-full lg:min-h-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-dark dark:text-white">{t('library.filter')}</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setSelectedCategory(t('studentAssignments.all')); setSelectedLevel(t('studentAssignments.all')); setSelectedPrice(t('studentAssignments.all')); }}
                    className="text-xs text-gray-500 hover:text-primary transition-colors min-h-[44px] px-2 flex items-center"
                  >
                    {t('library.reset')}
                  </button>
                  <button 
                    className="lg:hidden text-gray-500 hover:text-primary w-11 h-11 flex items-center justify-center rounded-lg"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="mb-8">
                <h4 className="font-semibold text-text-main dark:text-gray-300 mb-4 text-sm">{t('adminAddBook.category')}</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label 
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center justify-between p-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${selectedCategory === cat.name ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-text-main dark:text-gray-400'}`}
                    >
                      <span className={`text-sm ${selectedCategory === cat.name ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === cat.name ? 'bg-white dark:bg-gray-900 font-bold shadow-sm' : ''}`}>
                        {cat.name === t('studentAssignments.all') ? filteredCourses.length : (categoryCounts[cat.name] || 0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Level Filter */}
              <div className="mb-8">
                <h4 className="font-semibold text-text-main dark:text-gray-300 mb-4 text-sm">{t('addCourse.level')}</h4>
                <div className="flex flex-col gap-2">
                  {levels.map(level => (
                    <button 
                      key={level.name}
                      onClick={() => setSelectedLevel(level.name)}
                      className={`w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm transition-colors ${selectedLevel === level.name ? 'border border-primary text-primary font-bold bg-primary/5' : 'border border-[#E8E2D5] dark:border-gray-700 text-text-main dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 font-medium'}`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price Filter */}
              <div>
                <h4 className="font-semibold text-text-main dark:text-gray-300 mb-4 text-sm">{t('courseDetail.price')}</h4>
                <div className="flex gap-3">
                  {prices.map(price => (
                    <button 
                      key={price.name}
                      onClick={() => setSelectedPrice(price.name)}
                      className={`flex-1 px-4 py-3 min-h-[44px] rounded-xl text-sm transition-colors ${selectedPrice === price.name ? 'border border-primary text-primary font-bold bg-primary/5' : 'border border-[#E8E2D5] dark:border-gray-700 text-text-main dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 font-medium'}`}
                    >
                      {price.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          
          {/* Courses Grid */}
          <div className="flex-1 w-full lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  {t('library.filter')}
                </button>
                <span className="text-dark dark:text-white font-bold whitespace-nowrap shrink-0">{filteredCourses.length} {t('studentAssignments.course')}</span>
              </div>
              <div className="w-full sm:w-64">
                <CustomSelect 
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={sortOptions}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center min-h-80 text-center transition-colors">
                <PageLoader message={isRtl ? 'جاري تحميل الدورات...' : 'Loading courses...'} />
              </div>
            ) : filteredCourses.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredCourses.map(course => (
                  <motion.div
                    key={course.id}
                    variants={itemVariants}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm transition-colors my-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 shadow-inner">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2 font-headline-md">
                  {t('courses.noResults') || (isRtl ? 'لم نجد أي نتائج مطابقة' : 'No courses found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
                  {t('courses.noResultsHint') || (isRtl ? 'جرب البحث عن كلمات رئيسية أخرى أو قم بتغيير الفلاتر المختارة لاستعراض المزيد من الدورات.' : 'Try searching for different keywords or adjust your selected filters.')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedCategory(t('studentAssignments.all'));
                      setSelectedLevel(t('studentAssignments.all'));
                      setSelectedPrice(t('studentAssignments.all'));
                      setSortBy('popular');
                    }}
                    className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl min-h-[44px] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                    <span>{t('library.clearFilters') || (isRtl ? 'إعادة ضبط الفلاتر' : 'Clear Filters')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );
};

export default Courses;

