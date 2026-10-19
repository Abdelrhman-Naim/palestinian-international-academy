"use client";
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useLanguage } from '../context/LanguageContext';
import BookCard from './BookCard';

const TopBooks = () => {
  const { books, loading } = useLibrary();
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  // Sort by real activity:
  // 1. Real downloads count descending
  // 2. If downloads are 0 or equal, sort by real review count & rating
  // 3. If still equal, sort by newest additions (created_at)
  const topBooks = useMemo(() => {
    return [...(books || [])]
      .sort((a, b) => {
        const dlA = Number(a.downloads ?? a.downloads_count ?? 0);
        const dlB = Number(b.downloads ?? b.downloads_count ?? 0);
        if (dlB !== dlA) return dlB - dlA;

        const rcA = Number(a.ratingCount ?? a.rating_count ?? 0);
        const rcB = Number(b.ratingCount ?? b.rating_count ?? 0);
        if (rcB !== rcA) return rcB - rcA;

        const rateA = Number(a.ratingAverage ?? a.rating ?? 0);
        const rateB = Number(b.ratingAverage ?? b.rating ?? 0);
        if (rateB !== rateA) return rateB - rateA;

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 4);
  }, [books]);

  const skeletons = [1, 2, 3, 4];

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-14 sm:py-24 px-4 md:px-8 transition-colors border-t border-[#E8E2D5] dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 space-y-2 sm:space-y-3 flex flex-col items-center">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t("topBooks.label") || (isRtl ? 'مكتبة المنصة' : 'Platform Library')}
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-5xl text-dark dark:text-white font-black pt-1">
            {t("topBooks.title1") || (isRtl ? 'الكتب' : 'Most')} <span>{t("topBooks.title2") || (isRtl ? 'الأكثر تنزيلاً' : 'Downloaded Books')}</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {loading
            ? skeletons.map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800/80 border border-[#E8E2D5] dark:border-gray-700/50 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full mt-6" />
                  </div>
                </div>
              ))
            : topBooks.length === 0
            ? (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-20 text-gray-400 dark:text-gray-500 border border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl">
                <i className="fa-solid fa-book-open text-6xl mb-6 text-gray-300 dark:text-gray-700"></i>
                <p className="text-xl font-bold">{t("topBooks.noBooks")}</p>
              </div>
            )
            : topBooks.map((book, idx) => (
              <BookCard
                key={book.id}
                book={book}
                rank={idx + 1}
              />
            ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link to="/library" className="text-primary font-bold text-sm flex items-center gap-2 hover:underline">
            {t("topBooks.browseLibrary") || (isRtl ? 'تصفح المكتبة كاملة' : 'Browse Full Library')}
            <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopBooks;

