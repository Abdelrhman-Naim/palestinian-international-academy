import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSavedBooks } from '../hooks/useSavedBooks';
import { useLanguage } from '../context/LanguageContext';
import screenImg from '../assets/screen.png';

export default function SavedBooks() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { savedList, loading, removeSaved } = useSavedBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set();
    savedList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [savedList]);

  const filteredBooks = useMemo(() => {
    return savedList.filter((item) => {
      const matchSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [savedList, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar font-alexandria" dir={dir}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E2D5] dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                <span className="material-symbols-outlined text-2xl">bookmarks</span>
              </span>
              <span>{isRtl ? 'الكتب والمراجع المحفوظة' : 'My Saved Books & References'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              {isRtl 
                ? 'قائمة الكتب والمراجع والأبحاث التي قمت بحفظها للرجوع إليها وقراءتها في أي وقت.'
                : 'Your bookmarked engineering books, references, and research papers for quick access.'}
            </p>
          </div>

          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-orange-700 text-white shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-sm">local_library</span>
            <span>{isRtl ? 'تصفح المكتبة الكاملة' : 'Browse Library'}</span>
          </Link>
        </div>

        {/* Filter / Search Bar if items exist */}
        {savedList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-[#E8E2D5] dark:border-stone-800 p-3 rounded-2xl shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث في الكتب المحفوظة...' : 'Search in saved books...'}
                className="w-full ps-10 pe-4 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF7F2] dark:bg-stone-800 border-0 text-dark dark:text-white focus:ring-2 focus:ring-primary/30 outline-none transition-all"
              />
            </div>

            {/* Category Filter Chips */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {cat === 'All' ? (isRtl ? 'الكل' : 'All') : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="py-24 text-center text-stone-400 font-bold text-sm">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mb-3" />
            <p>{t('common.loading')}</p>
          </div>
        ) : savedList.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#F3EFE6]/40 dark:bg-stone-900/40 border-2 border-dashed border-[#E8E2D5] dark:border-stone-800 py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20 shadow-xs">
              <span className="material-symbols-outlined text-4xl">bookmark_border</span>
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
              {isRtl ? 'لم تقم بحفظ أي كتب بعد' : 'No Saved Books Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mb-8 leading-relaxed">
              {isRtl 
                ? 'عند تصفحك للمكتبة والضغط على أيقونة الحفظ (🔖) في بطاقة أي كتاب، ستجده محفوظاً هنا للرجوع إليه وتنزيله في أي وقت.'
                : 'Bookmark your favorite engineering books and references while browsing the library to access them anytime here.'}
            </p>
            <Link
              to="/library"
              className="px-6 py-3 rounded-2xl bg-primary hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">local_library</span>
              <span>{isRtl ? 'استكشاف المكتبة والكتب' : 'Explore Library Books'}</span>
            </Link>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-16 text-center text-stone-400 font-bold text-sm">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p>{isRtl ? 'لا توجد نتائج مطابقة لبحثك' : 'No books matching your search'}</p>
          </div>
        ) : (
          /* Saved Books Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-stone-900 border border-[#E8E2D5] dark:border-stone-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Book Cover Image Area */}
                <div className="relative h-48 w-full bg-linear-to-br from-stone-100 to-amber-50 dark:from-stone-900 dark:to-stone-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.cover_url || item.coverUrl || screenImg}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-75 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                    onError={(e) => { e.currentTarget.src = screenImg; }}
                  />

                  {/* Top Badges */}
                  {(item.ratingAverage > 0 || item.ratingCount > 0) && (
                    <div className="absolute top-3 inset-x-3 flex items-center justify-end" dir="ltr">
                      <span className="bg-amber-500/90 text-stone-900 font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">star</span>
                        <span>{(item.ratingAverage || 0).toFixed(1)}</span>
                      </span>
                    </div>
                  )}

                  {/* Quick Remove Bookmark Button */}
                  <button
                    onClick={() => removeSaved(item.bookId)}
                    className="absolute bottom-3 inset-e-3 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 text-rose-500 hover:bg-rose-500 hover:text-white backdrop-blur-md shadow-md flex items-center justify-center transition-all cursor-pointer"
                    title={isRtl ? 'إزالة من المحفوظات' : 'Remove from saved'}
                  >
                    <span className="material-symbols-outlined text-lg">bookmark_remove</span>
                  </button>
                </div>

                {/* Card Content Area */}
                <div className="p-5 flex flex-col grow justify-between">
                  <div>
                    {item.category && (
                      <span className="text-xs text-primary font-bold mb-1.5 block tracking-wide">
                        {item.category}
                      </span>
                    )}

                    <h3 className="font-bold text-base text-dark dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-3">
                      {item.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400 mb-4">
                      {item.author && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-stone-400">person</span>
                          <span>{item.author}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[11px]">
                        {item.year && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-stone-400">calendar_today</span>
                            <span>{item.year}</span>
                          </div>
                        )}
                        {item.pages && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-stone-400">menu_book</span>
                            <span>{item.pages} {isRtl ? 'صفحة' : 'pages'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                    <Link
                      to={`/library/${item.bookId}`}
                      className="flex-1 py-2 rounded-xl bg-[#FAF7F2] dark:bg-stone-800 hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>{isRtl ? 'قراءة الآن' : 'Read Now'}</span>
                      <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
                    </Link>

                    {(item.driveUrl || item.link) && (
                      <a
                        href={item.driveUrl || item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-primary text-stone-600 dark:text-stone-300 hover:text-primary flex items-center justify-center transition-all"
                        title={isRtl ? 'تنزيل الكتاب' : 'Download Book'}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                      </a>
                    )}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
