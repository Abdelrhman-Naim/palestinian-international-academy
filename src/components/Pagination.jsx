import { useLanguage } from '../context/LanguageContext';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 8,
  itemName = '',
}) {
  const { dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    if (totalItems === 0) return null;
    return (
      <div className="flex items-center justify-between border-t border-[#E8E2D5] px-4 py-4 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <span>
          {isRtl
            ? `إجمالي العناصر: ${totalItems} ${itemName}`
            : `Total: ${totalItems} ${itemName}`}
        </span>
      </div>
    );
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1; // Number of pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < totalPages)
      ) {
        pages.push('...');
      }
    }

    // Deduplicate consecutive ellipses
    return pages.filter((page, index) => !(page === '...' && pages[index - 1] === '...'));
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E8E2D5] px-5 py-4 dark:border-gray-700 sm:flex-row">
      {/* Items Summary Counter */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {isRtl ? (
          <>
            عرض <span className="font-bold text-gray-800 dark:text-gray-200">{startItem}</span> -{' '}
            <span className="font-bold text-gray-800 dark:text-gray-200">{endItem}</span> من أصل{' '}
            <span className="font-bold text-primary">{totalItems}</span> {itemName}
          </>
        ) : (
          <>
            Showing <span className="font-bold text-gray-800 dark:text-gray-200">{startItem}</span> -{' '}
            <span className="font-bold text-gray-800 dark:text-gray-200">{endItem}</span> of{' '}
            <span className="font-bold text-primary">{totalItems}</span> {itemName}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5" dir="ltr">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors ${
            currentPage === 1
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-600'
              : 'border-[#E8E2D5] bg-white text-gray-700 hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {isRtl ? 'chevron_right' : 'chevron_left'}
          </span>
          <span className="hidden sm:inline">{isRtl ? 'السابق' : 'Prev'}</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-7 items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 dark:bg-primary dark:text-white'
                    : 'border border-transparent text-gray-600 hover:border-[#E8E2D5] hover:bg-gray-50 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors ${
            currentPage === totalPages
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-600'
              : 'border-[#E8E2D5] bg-white text-gray-700 hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary'
          }`}
        >
          <span className="hidden sm:inline">{isRtl ? 'التالي' : 'Next'}</span>
          <span className="material-symbols-outlined text-sm">
            {isRtl ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </div>
    </div>
  );
}
