import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedCategory } from '../utils/categoryUtils';

const BookCard = ({
  book,
  rank,
  onBookmarkClick,
  isSaved = false,
  showBookmark = false
}) => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';

  if (!book) return null;

  const verifiedDownloadsLabel = isRtl ? 'تنزيل موثق' : 'verified downloads';
  const categoryLabel = isRtl ? 'التصنيف:' : 'Category:';
  const downloadsLabel = isRtl ? 'التحميلات:' : 'Downloads:';
  const viewBookText = isRtl ? 'عرض وتحميل الكتاب' : 'View & Download Book';

  const formattedDownloads = (book.downloads || 0).toLocaleString();
  const categoryDisplay = getLocalizedCategory(book.category, lang);
  const badgeText = rank ? `#${rank} ${categoryDisplay}` : categoryDisplay;

  return (
    <div className="bg-white dark:bg-[#1C1917] border border-[#E8E2D5] dark:border-[#2E2823] rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-xl hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.2)] transition-all duration-300 group text-right rtl:text-right ltr:text-left">
      {/* Top Inner Card Box */}
      <div className="bg-[#F5F0E6] dark:bg-[#27221D] border border-[#E8E2D5] dark:border-[#3A322B] rounded-xl p-6 flex flex-col items-center justify-center text-center relative mb-5 min-h-[210px] w-full group-hover:border-amber-500/30 transition-colors">
        {/* Top Badge */}
        <div className="absolute top-3 inset-e-3 bg-amber-100 dark:bg-[#362E25] text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs line-clamp-1 max-w-[85%]">
          {badgeText}
        </div>

        {/* Center Book Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center mb-3 mt-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-3xl">auto_stories</span>
        </div>

        {/* Book Main Title */}
        <h3 className="text-dark dark:text-white font-bold text-lg md:text-xl leading-snug line-clamp-2 mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-headline-md">
          {book.title}
        </h3>

        {/* Subtitle / Author */}
        <p className="text-gray-500 dark:text-stone-400 text-xs line-clamp-1 font-body-md">
          {book.subtitle || book.author || book.description || (isRtl ? 'دراسة وفكر' : 'Book details')}
        </p>
      </div>

      {/* Metadata Section Below Box */}
      <div className="space-y-2 mb-5 px-1">
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-stone-300 font-medium">
          <span className="text-gray-500 dark:text-stone-400">{categoryLabel}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">{categoryDisplay}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-stone-300 font-medium">
          <span className="text-gray-500 dark:text-stone-400">{downloadsLabel}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">
            {formattedDownloads} {verifiedDownloadsLabel}
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-2 mt-auto">
        {/* View & Download Book Button */}
        <Link
          to={`/library/${book.id}`}
          className="grow flex items-center justify-center gap-2.5 bg-white dark:bg-[#141210] border border-[#E8E2D5] dark:border-[#2E2823] hover:border-amber-500/50 hover:bg-[#F5F0E6] dark:hover:bg-[#201C18] text-dark dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-sm font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm min-h-[44px]"
        >
          <span>{viewBookText}</span>
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">download</span>
        </Link>

        {/* Optional Bookmark Button for Library page */}
        {showBookmark && onBookmarkClick && (
          <button
            type="button"
            onClick={(e) => onBookmarkClick(e, book)}
            className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs scale-105'
                : 'bg-[#F5F0E6] dark:bg-[#27221D] border-[#E8E2D5] dark:border-[#3A322B] text-gray-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40'
            }`}
            title={
              isSaved
                ? isRtl
                  ? 'محفوظ في حسابك (انقر للإزالة)'
                  : 'Saved (Click to remove)'
                : isRtl
                ? 'حفظ الكتاب'
                : 'Save book'
            }
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSaved ? 'bookmark' : 'bookmark_add'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
