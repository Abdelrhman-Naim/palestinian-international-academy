"use client";

import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import PageLoader from '../components/PageLoader';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getDynamicSiteUrl } from '../utils/siteUrl';
import { getShortVideos, parseVideoEmbed } from '../services/shortsService';

export default function Shorts() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const currentOrigin = getDynamicSiteUrl();

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'alphabetical'
  const [activeVideo, setActiveVideo] = useState(null);

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

  // Compute available categories with dynamic counts
  const categoriesWithCounts = useMemo(() => {
    const counts = { ALL: shorts.length };
    shorts.forEach((item) => {
      const cat = item.category || (isRtl ? 'عام' : 'General');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [shorts, isRtl]);

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

  const isFilteringActive = searchQuery.trim() !== '' || selectedCategory !== 'ALL' || sortBy !== 'newest';

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
            1. HERO & SEARCH HEADER
        ======================================================== */}
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 pt-8 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs
              items={[
                { label: isRtl ? 'الرئيسية' : 'Home', href: '/' },
                { label: isRtl ? 'فيديوهات ومعلومات سريعة' : 'Tech Shorts' },
              ]}
            />

            <div className="mt-6 text-center max-w-3xl mx-auto space-y-4">
              <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-flex items-center gap-1.5 font-label-caps">
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>{isRtl ? 'مكتبة الفيديوهات والمعلومات السريعة' : 'Tech Insights & Shorts Repository'}</span>
              </span>

              <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black text-dark dark:text-white tracking-tight">
                {isRtl ? 'كبسولات وفيديوهات هندسية وبرمجية' : 'Fast Engineering & Tech Capsules'}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? 'اكتشف جديد الهندسة والبرمجيات والذكاء الاصطناعي من خلال مقاطع ومعلومات سريعة ومكثفة مقدمة من خبراء الأكاديمية.'
                  : 'Discover the latest breakthroughs in engineering, coding, and AI through bite-sized, high-impact video capsules.'}
              </p>

              {/* Search Bar */}
              <div className="pt-2 max-w-xl mx-auto">
                <div className="relative">
                  <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'ابحث في الفيديوهات (مثال: Next.js، ذكاء اصطناعي، BIM، أمن...)'
                        : 'Search videos (e.g. Next.js, AI, BIM, Cloud...)'
                    }
                    className="w-full ps-12 pe-10 py-3.5 bg-white dark:bg-gray-800 border-2 border-[#E8E2D5] dark:border-gray-700 rounded-2xl text-sm sm:text-base text-dark dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary shadow-xs transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={isRtl ? 'مسح نص البحث' : 'Clear search text'}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs hover:bg-stone-300 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. FILTERS & SORT BAR
        ======================================================== */}
        <section className="bg-white/70 dark:bg-gray-800/70 border-b border-[#E8E2D5] dark:border-gray-800 sticky top-20 z-30 backdrop-blur-md transition-colors py-3.5 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-primary text-stone-950 shadow-md shadow-primary/20'
                    : 'bg-[#FAF7F2] dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-gray-600'
                }`}
              >
                {isRtl ? 'جميع التصنيفات' : 'All Categories'} ({categoriesWithCounts['ALL'] || 0})
              </button>

              {Object.keys(categoriesWithCounts)
                .filter((cat) => cat !== 'ALL')
                .map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-primary text-stone-950 shadow-md shadow-primary/20'
                        : 'bg-[#FAF7F2] dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat} ({categoriesWithCounts[cat] || 0})
                  </button>
                ))}
            </div>

            {/* Sort & Filter Reset */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
                  {isRtl ? 'ترتيب:' : 'Sort:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="newest">{isRtl ? 'الأحدث إضافة' : 'Newest First'}</option>
                  <option value="oldest">{isRtl ? 'الأقدم إضافة' : 'Oldest First'}</option>
                  <option value="alphabetical">{isRtl ? 'أبجدياً (أ-ي)' : 'Alphabetical (A-Z)'}</option>
                </select>
              </div>

              {isFilteringActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            3. RESULTS SUMMARY STRIP
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold">
            <span>
              {isRtl
                ? `عرض ${filteredShorts.length} من أصل ${shorts.length} فيديو ومعلومة`
                : `Showing ${filteredShorts.length} of ${shorts.length} tech capsules`}
            </span>
            {selectedCategory !== 'ALL' && (
              <span className="text-primary font-bold">
                {isRtl ? `التصنيف: ${selectedCategory}` : `Category: ${selectedCategory}`}
              </span>
            )}
          </div>
        </section>

        {/* ========================================================
            4. VIDEOS GRID
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-20">
          {loading ? (
            <div className="py-24 flex items-center justify-center">
              <PageLoader message={isRtl ? 'جاري تحميل الفيديوهات والمعلومات...' : 'Loading tech shorts...'} />
            </div>
          ) : filteredShorts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-dark dark:text-white mb-2">
                {isRtl ? 'لم نتمكن من العثور على أي نتائج' : 'No matching tech videos found'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {isRtl
                  ? 'جرب البحث بكلمة مفتاحية مختلفة أو اختيار تصنيف آخر لإظهار الفيديوهات.'
                  : 'Try searching with different keywords or clearing active category filters.'}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-stone-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>{isRtl ? 'إعادة تعيين البحث والفلاتر' : 'Reset Search & Filters'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredShorts.map((item) => {
                const parsed = parseVideoEmbed(item.video_url);
                const iconName = item.icon || 'smart_display';

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

                      {/* Centered Glowing Icon (أيقونة بالنص) */}
                      <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr from-primary to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-primary/40 group-hover/thumb:scale-110 group-hover/thumb:shadow-primary/60 transition-all duration-300 ring-4 ring-white/20">
                        <span className="material-symbols-outlined text-2xl sm:text-3xl font-black">
                          {iconName === 'smart_display' ? 'play_arrow' : iconName}
                        </span>
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
