import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import BookCard from '../components/BookCard';
import { useCategories } from '../context/CategoriesContext';
import { useLibrary } from '../context/LibraryContext';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useSavedBooks } from '../hooks/useSavedBooks';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
};

const Library = () => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(lang === 'en' ? 'All' : '');
  const [sortBy, setSortBy] = useState('highest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  const gridRef = useRef(null);

  const { categories: contextCategories } = useCategories();
  const { books: booksData, loading } = useLibrary();
  const { currentUser } = useAuth();
  const { isSaved, toggleSave } = useSavedBooks();

  const libraryTitle = isRtl ? 'كتب المكتبة' : 'Library Books';

  const handleBookmarkClick = async (e, book) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    await toggleSave(book);
  };

  useEffect(() => {
    setSelectedCategory(lang === 'en' ? 'All' : '');
    setCurrentPage(1);
  }, [lang]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);
  
  const categoryCounts = useMemo(() => {
    const counts = {};
    (booksData || []).forEach((b) => {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    return counts;
  }, [booksData]);

  const categories = useMemo(() => {
    const allOption = { name: lang === 'en' ? 'All' : '', label: t('library.all') };
    const availableCategories = (contextCategories?.library || [])
      .filter((cat) => (categoryCounts[cat] || 0) > 0)
      .map((cat) => ({ name: cat, label: cat }));
    return [allOption, ...availableCategories];
  }, [lang, t, contextCategories?.library, categoryCounts]);

  const sortOptions = useMemo(() => [
    { value: 'highest', label: isRtl ? 'الأعلى تقييماً' : 'Highest Rated' },
    { value: 'newest', label: isRtl ? 'الأحدث إصداراً' : 'Newest First' },
    { value: 'downloads', label: isRtl ? 'الأكثر تنزيلاً' : 'Most Downloaded' },
    { value: 'title', label: isRtl ? 'أبجدي (أ - ي)' : 'Alphabetical (A - Z)' }
  ], [isRtl]);

  const itemsPerPageOptions = [
    { value: 24, label: `24 ${t('library.perPage') || (isRtl ? 'في الصفحة' : 'per page')}` },
    { value: 48, label: `48 ${t('library.perPage') || (isRtl ? 'في الصفحة' : 'per page')}` },
    { value: 96, label: `96 ${t('library.perPage') || (isRtl ? 'في الصفحة' : 'per page')}` }
  ];

  // Filtered & Sorted books array
  const processedBooks = useMemo(() => {
    if (!booksData) return [];
    let list = booksData.filter(book => {
      const matchSearch = !searchQuery || 
                          (book.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (book.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === (lang === 'en' ? 'All' : '') || book.category === selectedCategory;
      return matchSearch && matchCategory;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'highest') {
        const ratingA = Number(a.ratingAverage ?? a.rating ?? 0);
        const ratingB = Number(b.ratingAverage ?? b.rating ?? 0);
        return ratingB - ratingA;
      }
      if (sortBy === 'newest') {
        const yearA = Number(a.year) || (a.createdAt?.seconds ? Math.floor(a.createdAt.seconds / 31536000 + 1970) : 0);
        const yearB = Number(b.year) || (b.createdAt?.seconds ? Math.floor(b.createdAt.seconds / 31536000 + 1970) : 0);
        return yearB - yearA;
      }
      if (sortBy === 'downloads') {
        return (Number(b.downloads) || 0) - (Number(a.downloads) || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, sortBy, booksData, lang]);

  const totalPages = Math.ceil(processedBooks.length / itemsPerPage) || 1;

  const currentBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [processedBooks, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (gridRef.current) {
        gridRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />
      
      <main className="grow">
        {/* Header Banner */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-16 px-4 border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="max-w-7xl mx-auto relative z-10">
            <Breadcrumbs items={[{ label: libraryTitle }]} />
            <div className="text-center mt-4">
              <p className="text-sm font-label-caps text-secondary mb-3 tracking-widest">{t('library.headerLabel')}</p>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 font-headline-lg text-dark dark:text-white">{libraryTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">{t('library.headerSubtitle')}</p>
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
            <div className="bg-white dark:bg-gray-800 lg:rounded-2xl p-6 shadow-sm border border-[#E8E2D5] dark:border-gray-700 sticky top-28 transition-colors min-h-full lg:min-h-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-dark dark:text-white">{t('library.filter')}</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setSelectedCategory(lang === 'en' ? 'All' : ''); setSearchQuery(''); }}
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
                        {cat.name === (lang === 'en' ? 'All' : '') ? (booksData || []).length : (categoryCounts[cat.name] || 0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Grid Area */}
          <div ref={gridRef} className="flex-1 w-full lg:w-3/4 scroll-mt-28">
            
            {/* Search Bar & Top Controls */}
            <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 p-2 rounded-xl flex items-center shadow-sm mb-6 transition-colors">
              <button 
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white w-11 h-11 rounded-lg ml-2 shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">filter_alt</span>
              </button>
              <span className="material-symbols-outlined text-gray-400 px-3 hidden lg:block">search</span>
              <input 
                type="text" 
                placeholder={t('library.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-dark dark:text-white outline-none border-none text-sm placeholder-gray-400 py-2 pr-2 lg:pr-0 min-h-[44px]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-rose-500 w-11 h-11 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {loading ? (
                <span className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse inline-block" />
              ) : (
                <span className="text-dark dark:text-white font-bold whitespace-nowrap shrink-0">
                  {processedBooks.length} {libraryTitle}
                </span>
              )}
              <div className="w-full sm:w-72">
                <CustomSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={val => setSortBy(val)}
                />
              </div>
            </div>
            
            {/* Books Grid */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center min-h-80 text-center transition-colors">
                <PageLoader message={isRtl ? 'جاري تحميل المكتبة...' : 'Loading library...'} />
              </div>
            ) : currentBooks.length > 0 ? (
              <>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {currentBooks.map(book => (
                    <motion.div
                      key={book.id}
                      variants={itemVariants}
                    >
                      <BookCard
                        book={book}
                        showBookmark={true}
                        isSaved={isSaved(book.id)}
                        onBookmarkClick={handleBookmarkClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination Controls Bar */}
                <div className="mt-10 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-colors">
                  {/* Results Counter & Per-Page Selector */}
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-bold">
                    {loading ? (
                      <span className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse inline-block" />
                    ) : (
                      <span>
                        {t('library.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, processedBooks.length)} - {Math.min(currentPage * itemsPerPage, processedBooks.length)} {t('library.of')} {processedBooks.length.toLocaleString()} {libraryTitle}
                      </span>
                    )}
                    <div className="w-56 font-bold">
                      <CustomSelect
                        options={itemsPerPageOptions}
                        value={itemsPerPage}
                        onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                      />
                    </div>
                  </div>

                  {/* Page Navigation Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700 text-dark dark:text-white hover:border-primary disabled:opacity-40 cursor-pointer transition-colors min-h-[44px]"
                    >
                      {t('library.prev')}
                    </button>

                    {getPageNumbers().map((pageNum, idx) => (
                      typeof pageNum === 'number' ? (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-11 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-primary text-white border-2 border-primary shadow-md shadow-primary/20 scale-105'
                              : 'border border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 text-dark dark:text-white hover:border-primary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 font-bold">...</span>
                      )
                    ))}

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700 text-dark dark:text-white hover:border-primary disabled:opacity-40 cursor-pointer transition-colors min-h-[44px]"
                    >
                      {t('library.next')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm transition-colors my-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 shadow-inner">
                  <span className="material-symbols-outlined text-4xl">menu_book</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2 font-headline-md">
                  {t('library.noResults') || (isRtl ? 'لم نجد أي كتب مطابقة' : 'No books found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
                  {t('library.noResultsHint') || (isRtl ? 'جرب البحث عن اسم الكاتب أو عنوان الكتاب بشكل مختلف، أو قم بإلغاء الفلاتر المحددة.' : 'Try searching for author or title keywords, or reset active filters.')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={() => { setSelectedCategory(''); setSearchQuery(''); setSortBy('highest'); }}
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
      <Footer />
    </div>
  );
};

export default Library;






