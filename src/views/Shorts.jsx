"use client";

import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import PageLoader from '../components/PageLoader';
import SEO from '../components/SEO';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';
import { useCategories } from '../context/CategoriesContext';
import { getDynamicSiteUrl } from '../utils/siteUrl';
import { getShortVideos, parseVideoEmbed } from '../services/shortsService';

export default function Shorts() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const currentOrigin = getDynamicSiteUrl();
  const { rawCategories } = useCategories();

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'alphabetical'
  const [activeVideo, setActiveVideo] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await getShortVideos();
      setShorts(data || []);
    } catch (err) {
      console.warn('Failed to load short videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    const handleUpdate = () => fetchVideos();
    window.addEventListener('pia:shorts-updated', handleUpdate);
    return () => window.removeEventListener('pia:shorts-updated', handleUpdate);
  }, []);

  // Keyboard navigation for video modal (Escape to close)
  useEffect(() => {
    if (!activeVideo) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveVideo(null);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideo]);

  // Combine categories from context + any in shorts
  const categoryList = useMemo(() => {
    const fromContext = rawCategories?.shorts || [];
    const fromShorts = shorts.map((s) => s.category).filter(Boolean);
    const combined = Array.from(new Set([...fromContext, ...fromShorts]));
    return combined;
  }, [rawCategories?.shorts, shorts]);

  // Count videos per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    shorts.forEach((s) => {
      const cat = s.category || '';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [shorts]);

  // Filtered and sorted short videos
  const filteredShorts = useMemo(() => {
    let result = [...shorts];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.title || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => (item.category || '') === selectedCategory);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '', isRtl ? 'ar' : 'en');
      }
      return 0;
    });

    return result;
  }, [shorts, searchQuery, selectedCategory, sortBy, isRtl]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSortBy('newest');
  };

  const sortOptions = [
    { value: 'newest', label: isRtl ? 'الأحدث إضافة' : 'Newest First' },
    { value: 'oldest', label: isRtl ? 'الأقدم إضافة' : 'Oldest First' },
    { value: 'alphabetical', label: isRtl ? 'أبجدياً (أ-ي)' : 'Alphabetical (A-Z)' },
  ];

  const shortsSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isRtl
      ? 'فيديوهات ومعلومات هندسية وبرمجية سريعة - أكاديمية فلسطين الدولية'
      : 'Tech Short Videos & Insights - PIA',
    url: `${currentOrigin}/shorts`,
    description: isRtl
      ? 'كبسولات علمية وتقنية مكثفة تواكب أحدث المستجدات في البرمجة والذكاء الاصطناعي والهندسة.'
      : 'Concise engineering and tech video insights keeping you ahead in coding, AI, and systems.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredShorts.slice(0, 10).map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.title,
        description: item.description,
        url: `${currentOrigin}/shorts#${item.id}`,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased transition-colors" dir={dir}>
      <SEO
        title={
          isRtl
            ? 'فيديوهات ومعلومات هندسية وبرمجية سريعة | أكاديمية فلسطين الدولية (PIA)'
            : 'Tech Short Videos & Engineering Insights | Palestinian International Academy'
        }
        description={
          isRtl
            ? 'تصفح كبسولات علمية وتقنية مكثفة وفيديوهات سريعة تواكب أحدث المستجدات في البرمجة والذكاء الاصطناعي والهندسة.'
            : 'Explore short video capsules and quick engineering insights in programming, AI, and modern systems.'
        }
        canonical="/shorts"
        breadcrumbs={[
          { name: isRtl ? 'الرئيسية' : 'Home', item: '/' },
          { name: isRtl ? 'فيديوهات ومعلومات سريعة' : 'Tech Shorts', item: '/shorts' },
        ]}
        schema={shortsSchema}
      />
      <Navbar />

      <main className="grow">
        {/* ========================================================
            1. HEADER BANNER (Matching Courses & Library style)
        ======================================================== */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-16 px-4 border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
            <Breadcrumbs
              items={[
                { label: isRtl ? 'الرئيسية' : 'Home', href: '/' },
                { label: isRtl ? 'فيديوهات ومعلومات سريعة' : 'Tech Shorts' },
              ]}
            />
            <div className="text-center mt-4">
              <p className="text-sm font-label-caps text-secondary mb-3 tracking-widest">
                {isRtl ? 'إضاءات ومعلومات سريعة' : 'TECH SHORTS & INSIGHTS'}
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 font-headline-lg text-dark dark:text-white">
                {isRtl ? 'فيديوهات ومعلومات هندسية وبرمجية' : 'Fast Engineering & Tech Capsules'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                {isRtl
                  ? 'كبسولات علمية وتقنية مكثفة تواكب أحدث المستجدات في البرمجة والذكاء الاصطناعي والهندسة المتطورة.'
                  : 'Concise engineering and tech video insights keeping you ahead in coding, AI, and modern systems.'}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. CONTENT CONTAINER (Sidebar Filter + Main Grid)
        ======================================================== */}
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-12 flex flex-col lg:flex-row gap-6 xl:gap-8 relative">
          {/* Mobile Overlay */}
          {isMobileFiltersOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
          )}

          {/* Sidebar / Filters (Exact match to Courses & Library) */}
          <aside
            className={`${
              isMobileFiltersOpen
                ? 'fixed inset-y-0 z-[70] flex flex-col translate-x-0 shadow-2xl h-[100dvh]'
                : 'hidden lg:block'
            } ${isRtl ? 'left-0' : 'right-0'} w-80 max-w-[88vw] bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent lg:relative lg:w-64 xl:w-72 2xl:w-80 shrink-0 lg:translate-x-0 lg:shadow-none lg:overflow-visible lg:h-auto transition-all duration-300`}
          >
            <div className="bg-white dark:bg-gray-800 lg:border border-[#E8E2D5] dark:border-gray-700 lg:rounded-2xl shadow-xs lg:sticky lg:top-28 transition-colors flex flex-col h-full lg:h-auto overflow-hidden">
              {/* Drawer Header (Fixed at top of drawer on mobile) */}
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <h2 className="font-bold text-xl text-dark dark:text-white">
                  {t('library.filter') || (isRtl ? 'تصفية' : 'Filter')}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-bold text-gray-500 hover:text-primary transition-colors min-h-[40px] px-2 flex items-center cursor-pointer"
                  >
                    {t('library.reset') || (isRtl ? 'إعادة ضبط' : 'Reset')}
                  </button>
                  <button
                    type="button"
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
                  <h4 className="font-semibold text-text-main dark:text-gray-300 mb-3 text-sm">
                    {t('adminAddBook.category') || (isRtl ? 'التصنيف' : 'Category')}
                  </h4>
                  <div className="space-y-1.5">
                    {/* All Categories Option */}
                    <label
                      onClick={() => {
                        setSelectedCategory('ALL');
                        if (isMobileFiltersOpen) setIsMobileFiltersOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${
                        selectedCategory === 'ALL'
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-text-main dark:text-gray-400'
                      }`}
                    >
                      <span className={`text-sm ${selectedCategory === 'ALL' ? 'font-bold' : 'font-medium'}`}>
                        {isRtl ? 'الكل' : 'All'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedCategory === 'ALL'
                            ? 'bg-white dark:bg-gray-900 font-bold shadow-xs text-primary'
                            : 'bg-gray-100 dark:bg-gray-700/60'
                        }`}
                      >
                        {shorts.length}
                      </span>
                    </label>

                    {/* Dynamic Categories */}
                    {categoryList.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      const count = categoryCounts[cat] || 0;
                      return (
                        <label
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            if (isMobileFiltersOpen) setIsMobileFiltersOpen(false);
                          }}
                          className={`flex items-center justify-between p-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                              : 'hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-text-main dark:text-gray-400'
                          }`}
                        >
                          <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                            {cat}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white dark:bg-gray-900 font-bold shadow-xs text-primary'
                                : 'bg-gray-100 dark:bg-gray-700/60'
                            }`}
                          >
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Drawer Footer with Apply/Show Results Button */}
              <div className="lg:hidden p-4 border-t border-[#E8E2D5] dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xs shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-secondary text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {isRtl
                      ? `عرض النتائج (${filteredShorts.length})`
                      : `Show Results (${filteredShorts.length})`}
                  </span>
                  <span className="material-symbols-outlined text-base">check</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content: Controls Header + Videos Grid */}
          <section aria-labelledby="shorts-catalog-heading" className="flex-1 min-w-0 w-full">
            <h2 id="shorts-catalog-heading" className="sr-only">
              {isRtl ? 'قائمة الفيديوهات السريعة المتاحة' : 'Available Tech Short Videos'}
            </h2>

            {/* Top Controls Bar: Mobile filter button + Search Bar + Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white px-4 py-3 rounded-xl text-sm font-bold shadow-xs min-h-[44px] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  <span>{t('library.filter') || (isRtl ? 'تصفية' : 'Filter')}</span>
                </button>
                <span className="text-dark dark:text-white font-bold whitespace-nowrap shrink-0">
                  {filteredShorts.length} {isRtl ? 'فيديو ومعلومة' : 'videos'}
                </span>
              </div>

              {/* Search Bar & Sort Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64 md:w-80">
                  <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث بالاسم أو الشرح...' : 'Search by title...'}
                    className="w-full ps-9 pe-8 py-2.5 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-xs sm:text-sm text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary shadow-xs transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={isRtl ? 'مسح نص البحث' : 'Clear search text'}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] hover:bg-stone-300 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="w-full sm:w-48 shrink-0">
                  <CustomSelect
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    options={sortOptions}
                  />
                </div>
              </div>
            </div>

            {/* Videos Grid / Loading / Empty States */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center min-h-80 text-center transition-colors">
                <PageLoader message={isRtl ? 'جاري تحميل الفيديوهات...' : 'Loading short videos...'} />
              </div>
            ) : filteredShorts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs transition-colors my-4">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 shadow-inner">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2">
                  {isRtl ? 'لم نجد أي نتائج مطابقة' : 'No short videos found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
                  {isRtl
                    ? 'جرب البحث عن كلمات رئيسية أخرى أو قم بتغيير التصنيف المختار لاستعراض المزيد من الفيديوهات.'
                    : 'Try searching for different keywords or adjust your selected category filter.'}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-primary hover:bg-secondary text-stone-950 font-bold text-sm px-6 py-3 rounded-xl min-h-[44px] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                  <span>{t('library.clearFilters') || (isRtl ? 'إعادة ضبط الفلاتر' : 'Clear Filters')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredShorts.map((item) => {
                  const parsed = parseVideoEmbed(item.video_url);

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-[#E8E2D5] dark:border-gray-700/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Decorative Top Gradient Glow */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary/40 via-primary to-amber-500 rounded-t-3xl opacity-80 group-hover:opacity-100 transition-opacity" />

                      {/* Media Preview Area with Centered Glowing Icon */}
                      <div
                        className="relative w-full aspect-16/10 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 flex items-center justify-center cursor-pointer mb-4 shadow-inner group/thumb"
                        onClick={() => setActiveVideo(item)}
                        title={isRtl ? `مشاهدة: ${item.title}` : `Watch: ${item.title}`}
                      >
                        {parsed.thumbnailUrl && (
                          <img
                            src={parsed.thumbnailUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover/thumb:opacity-60 group-hover/thumb:scale-105 transition-all duration-500"
                          />
                        )}

                        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/70" />

                        {item.category && (
                          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-400/30">
                            {item.category}
                          </span>
                        )}

                        {/* Centered Glowing Play Icon */}
                        <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr from-primary to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-primary/40 group-hover/thumb:scale-110 group-hover/thumb:shadow-primary/60 transition-all duration-300 ring-4 ring-white/20">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-stone-950 translate-x-0.5 rtl:-translate-x-0.5 shrink-0" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75 pointer-events-none" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between mb-4">
                        <div>
                          <h3 className="font-extrabold text-base sm:text-lg text-dark dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Action View Button */}
                      <button
                        type="button"
                        onClick={() => setActiveVideo(item)}
                        className="w-full flex items-center justify-center gap-2 bg-[#FAF7F2] dark:bg-gray-700/60 hover:bg-primary dark:hover:bg-primary text-dark dark:text-white hover:text-stone-950 dark:hover:text-stone-950 border border-[#E8E2D5] dark:border-gray-600/70 hover:border-primary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-base text-primary group-hover:text-stone-950 transition-colors">
                          play_circle
                        </span>
                        <span>{isRtl ? 'عرض الفيديو والمعلومات' : 'View Video & Details'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Video Preview Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 dark:border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-[#FAF7F2] dark:bg-gray-900/90 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">smart_display</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-dark dark:text-white truncate">
                    {activeVideo.title}
                  </h3>
                  <span className="text-xs text-primary font-bold">
                    {activeVideo.category || (isRtl ? 'معلومات تقنية' : 'Tech Insight')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label={isRtl ? 'إغلاق نافذة العرض' : 'Close video modal'}
                className="w-9 h-9 rounded-xl hover:bg-stone-200/60 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-gray-700"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Video Player Body */}
            <div className="relative w-full aspect-16/9 bg-black overflow-hidden flex items-center justify-center">
              {(() => {
                const parsed = parseVideoEmbed(activeVideo.video_url);

                if (parsed.type === 'youtube' || parsed.type === 'drive') {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }

                if (parsed.type === 'html5') {
                  return (
                    <video
                      src={parsed.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <iframe
                    src={parsed.embedUrl}
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                );
              })()}
            </div>

            {/* Modal Description Footer */}
            <div className="p-5 bg-white dark:bg-gray-900 border-t border-stone-200 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {activeVideo.description}
              </p>
              {activeVideo.video_url && (
                <a
                  href={activeVideo.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                >
                  <span>{isRtl ? 'فتح الرابط الأصلي للمحتوى' : 'Open original video link'}</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
