import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSavedBooks } from '../hooks/useSavedBooks';
import { useLanguage } from '../context/LanguageContext';
import BookCard from '../components/BookCard';

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
            {filteredBooks.map((item) => {
              const bookObj = {
                ...item,
                id: item.bookId || item.id,
                title: item.title,
                author: item.author,
                category: item.category,
                downloads: item.downloads || 0,
                year: item.year,
                pages: item.pages,
                ratingAverage: item.ratingAverage,
                ratingCount: item.ratingCount
              };
              return (
                <BookCard
                  key={item.id || item.bookId}
                  book={bookObj}
                  isSaved={true}
                  showBookmark={true}
                  onBookmarkClick={() => removeSaved(item.bookId || item.id)}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
