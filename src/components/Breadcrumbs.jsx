import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * Reusable Breadcrumbs component for Courses, Library, and Detail pages.
 * @param {Array} items - Array of { label, labelEn, path }
 */
export default function Breadcrumbs({ items = [] }) {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const homeLabel = isRtl ? 'الرئيسية' : 'Home';

  const allItems = [
    { label: homeLabel, path: '/' },
    ...items
  ];

  return (
    <nav aria-label="Breadcrumb" className="w-full mb-6">
      <ol className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-gray-400 flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const labelText = item.label;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <span className="material-symbols-outlined text-xs text-stone-400 dark:text-gray-600 rtl:rotate-180 shrink-0">
                  chevron_right
                </span>
              )}
              {isLast || !item.path ? (
                <span className="text-dark dark:text-white font-bold truncate max-w-[200px] sm:max-w-xs" aria-current="page">
                  {labelText}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                >
                  {index === 0 && (
                    <span className="material-symbols-outlined text-sm">home</span>
                  )}
                  <span>{labelText}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
