"use client";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CourseCard from '../components/CourseCard';
import { useCategories } from '../context/CategoriesContext';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';
import SEO from '../components/SEO';
import { getDynamicSiteUrl } from '../utils/siteUrl';

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
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const currentOrigin = getDynamicSiteUrl();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || currentUser?.id;
  const { rawCategories } = useCategories();
  const { courses: coursesData, loading } = useCourses();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobileFiltersOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    if (!userId) {
      setEnrolledCourseIds(new Set());
      return;
    }
    let isMounted = true;
    const fetchEnrolledCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('course_requests')
          .select('course_id, status')
          .eq('student_id', userId);

        if (!error && data && isMounted) {
          const approvedIds = new Set(
            data
              .filter(r => !r.status || r.status === 'approved' || r.status === 'active')
              .map(r => String(r.course_id))
          );
          setEnrolledCourseIds(approvedIds);
        }
      } catch (e) {
        console.warn('Could not fetch enrolled courses in catalog:', e);
      }
    };
    fetchEnrolledCourses();
    return () => { isMounted = false; };
  }, [userId]);

  // Bilingual category pairs to match Arabic & English categories seamlessly
  const categoryPairs = useMemo(() => {
    const arList = rawCategories?.courses || ['برمجة', 'تصميم', 'أمن سيبراني', 'إدارة أعمال'];
    const enList = rawCategories?.courses_en || ['Programming', 'Design', 'Cybersecurity', 'Business'];
    return arList.map((arName, idx) => ({
      key: arName,
      ar: arName,
      en: enList[idx] || arName,
      label: lang === 'en' ? (enList[idx] || arName) : arName
    }));
  }, [rawCategories, lang]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    (coursesData || []).forEach((c) => {
      const isPublished = c.status !== '' && c.status !== 'Draft';
      if (c.category && isPublished) {
        const pair = categoryPairs.find(
          p => p.ar === c.category || p.en === c.category || p.key === c.category
        );
        const key = pair ? pair.key : c.category;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [coursesData, categoryPairs]);

  const categories = useMemo(() => {
    const allOption = { key: 'ALL', name: 'ALL', label: t('studentAssignments.all') };
    const availableCategories = categoryPairs
      .filter((cat) => (categoryCounts[cat.key] || 0) > 0)
      .map((cat) => ({
        key: cat.key,
        name: cat.key,
        label: cat.label
      }));
    return [allOption, ...availableCategories];
  }, [t, categoryPairs, categoryCounts]);

  const levels = useMemo(() => [
    { value: 'ALL', label: t('studentAssignments.all') },
    { value: 'BEGINNER', label: t('addCourse.beginner') },
    { value: 'INTERMEDIATE', label: t('addCourse.intermediate') },
    { value: 'ADVANCED', label: t('addCourse.advanced') }
  ], [t]);

  const prices = useMemo(() => [
    { value: 'ALL', label: t('studentAssignments.all') },
    { value: 'Free', label: t('courseDetail.free') },
    { value: 'Paid', label: t('courses.paid') }
  ], [t]);

  const sortOptions = useMemo(() => [
    { value: 'popular', label: t('courses.sortPopular') },
    { value: 'newest', label: t('courses.sortNewest') },
    { value: 'title', label: t('courses.sortTitle') }
  ], [t]);

  const filteredCourses = useMemo(() => {
    const list = (coursesData || []).filter(course => {
      let matchCategory = selectedCategory === 'ALL';
      if (!matchCategory) {
        const pair = categoryPairs.find(p => p.key === selectedCategory);
        if (pair) {
          matchCategory = course.category === pair.ar || course.category === pair.en || course.category === pair.key;
        } else {
          matchCategory = course.category === selectedCategory;
        }
      }

      const matchLevel = selectedLevel === 'ALL' || course.level === selectedLevel;
      const numCoursePrice = Number(course.price);
      const isCourseFree = !course.price || course.price === 'Free' || course.price === 'free' || isNaN(numCoursePrice) || numCoursePrice === 0;
      const matchPrice = selectedPrice === 'ALL' || (selectedPrice === 'Free' ? isCourseFree : !isCourseFree);
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
  }, [coursesData, selectedCategory, selectedLevel, selectedPrice, sortBy, categoryPairs]);

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased transition-colors`} dir={dir}>
      <SEO
        title={isRtl ? 'الدورات التدريبية المعتمدة | أكاديمية فلسطين الدولية (PIA)' : 'Accredited Courses | Palestinian International Academy'}
        description={isRtl 
          ? 'استكشف قائمة الدورات التدريبية المعتمدة في البرمجة، هندسة البرمجيات، الذكاء الاصطناعي، الأمن السيبراني، والتصميم مع نخبة من الخبراء والمدربين الدوليين.' 
          : 'Explore accredited training courses in programming, software engineering, AI, cybersecurity, and design with elite international instructors.'}
        canonical="/courses"
        noindex={embedded}
        breadcrumbs={[
          { name: isRtl ? 'الرئيسية' : 'Home', item: '/' },
          { name: isRtl ? 'الدورات' : 'Courses', item: '/courses' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'name': isRtl ? 'قائمة الدورات التدريبية' : 'Courses Catalog',
          'itemListElement': filteredCourses.slice(0, 10).map((c, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'item': {
              '@type': 'Course',
              'name': c.title,
              'description': c.description || c.title,
              'provider': {
                '@type': 'EducationalOrganization',
                'name': 'Palestinian International Academy',
                'sameAs': `${currentOrigin}/`
              },
              'url': `${currentOrigin}/courses/${c.id}`
            }
          }))
        }}
      />
      {!embedded && <Navbar />}
      
      <main className="grow">
        {/* Header Banner */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-16 px-4 border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
            <Breadcrumbs items={[{ label: t('navbar.courses') || (isRtl ? 'الدورات' : 'Courses') }]} />
            <div className="text-center mt-4">
              <p className="text-sm font-label-caps text-secondary mb-3 tracking-widest">{t('courses.catalogLabel')}</p>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 font-headline-lg text-dark dark:text-white">{t('courses.catalogTitle')}</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">{t('courses.catalogSubtitle')}</p>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-12 flex flex-col lg:flex-row gap-6 xl:gap-8 relative">
          
          {/* Mobile Overlay */}
          {isMobileFiltersOpen && (
            <div 
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
          )}

          {/* Sidebar / Filters */}
          <aside className={`${isMobileFiltersOpen ? 'fixed inset-y-0 z-[70] flex flex-col translate-x-0 shadow-2xl h-[100dvh]' : 'hidden lg:block'} ${isRtl ? 'left-0' : 'right-0'} w-80 max-w-[88vw] bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent lg:relative lg:w-64 xl:w-72 2xl:w-80 shrink-0 lg:translate-x-0 lg:shadow-none lg:overflow-visible lg:h-auto transition-all duration-300`}>
            <div className="bg-white dark:bg-gray-800 lg:border border-[#E8E2D5] dark:border-gray-700 lg:rounded-2xl shadow-sm lg:sticky lg:top-28 transition-colors flex flex-col h-full lg:h-auto overflow-hidden">
              
              {/* Drawer Header (Fixed at top of drawer on mobile) */}
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <h3 className="font-bold text-xl text-dark dark:text-white">{t('library.filter')}</h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setSelectedCategory('ALL'); setSelectedLevel('ALL'); setSelectedPrice('ALL'); }}
                    className="text-xs font-bold text-gray-500 hover:text-primary transition-colors min-h-[40px] px-2 flex items-center cursor-pointer"
                  >
                    {t('library.reset')}
                  </button>
                  <button 
                    className="lg:hidden text-gray-500 hover:text-primary w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700/60 cursor-pointer transition-colors"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    aria-label="Close filters"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
              
              {/* Scrollable Filters Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-7 custom-scrollbar pb-32 lg:pb-6">
                {/* Category Filter */}
                <div>
                  <h4 className="font-semibold text-text-main dark:text-gray-300 mb-3 text-sm">{t('adminAddBook.category')}</h4>
                  <div className="space-y-1.5">
                    {categories.map(cat => (
                      <label 
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`flex items-center justify-between p-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${selectedCategory === cat.key ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-text-main dark:text-gray-400'}`}
                      >
                        <span className={`text-sm ${selectedCategory === cat.key ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat.key ? 'bg-white dark:bg-gray-900 font-bold shadow-sm' : 'bg-gray-100 dark:bg-gray-700/60'}`}>
                          {cat.key === 'ALL' ? filteredCourses.length : (categoryCounts[cat.key] || 0)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Level Filter */}
                <div>
                  <h4 className="font-semibold text-text-main dark:text-gray-300 mb-3 text-sm">{t('addCourse.level')}</h4>
                  <div className="flex flex-col gap-2">
                    {levels.map(level => (
                      <button 
                        key={level.value}
                        onClick={() => setSelectedLevel(level.value)}
                        className={`w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm transition-colors cursor-pointer ${selectedLevel === level.value ? 'border border-primary text-primary font-bold bg-primary/5 dark:bg-primary/20' : 'border border-[#E8E2D5] dark:border-gray-700 text-text-main dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 font-medium'}`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price Filter */}
                <div>
                  <h4 className="font-semibold text-text-main dark:text-gray-300 mb-3 text-sm">{t('courseDetail.price')}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {prices.map(price => (
                      <button 
                        key={price.value}
                        onClick={() => setSelectedPrice(price.value)}
                        className={`w-full text-center px-2 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm transition-colors cursor-pointer ${selectedPrice === price.value ? 'border border-primary text-primary font-bold bg-primary/5 dark:bg-primary/20' : 'border border-[#E8E2D5] dark:border-gray-700 text-text-main dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 font-medium'}`}
                      >
                        {price.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Drawer Footer with Apply/Show Results Button */}
              <div className="lg:hidden p-4 border-t border-[#E8E2D5] dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isRtl ? `عرض النتائج (${filteredCourses.length})` : `Show Results (${filteredCourses.length})`}</span>
                  <span className="material-symbols-outlined text-base">check</span>
                </button>
              </div>
            </div>
          </aside>
          
          {/* Courses Grid */}
          <div className="flex-1 min-w-0 w-full">
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
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6"
              >
                {filteredCourses.map(course => (
                  <motion.div
                    key={course.id}
                    variants={itemVariants}
                  >
                    <CourseCard 
                      course={course} 
                      isEnrolled={enrolledCourseIds.has(String(course.id))}
                    />
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
                      setSelectedCategory('ALL');
                      setSelectedLevel('ALL');
                      setSelectedPrice('ALL');
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

