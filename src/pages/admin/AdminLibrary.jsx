import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { useLibrary } from '../../context/LibraryContext';
import { useCategories } from '../../context/CategoriesContext';
import CustomSelect from '../../components/CustomSelect';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';

export default function AdminLibrary() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { books, removeBook, updateBook } = useLibrary();
  const { categories, rawCategories } = useCategories();

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest_year');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, sortBy]);

  const openEdit = (book) => {
    const orig = book.originalData || {};
    const cat = orig.category || orig.category_name || book.category || book.category_name || '';
    setEditForm({
      ...orig,
      ...book,
      category: cat,
      category_name: cat
    });
    setEditErrors({});
    setEditModal(book.id);
  };

  const handleSaveEdit = () => {
    const errs = {};
    if (!editForm.title?.trim()) {
      errs.title = isRtl ? 'عنوان الكتاب مطلوب' : 'Book title is required';
    }
    if (!editForm.author?.trim()) {
      errs.author = isRtl ? 'اسم المؤلف مطلوب' : 'Author name is required';
    }
    const cat = (editForm.category || editForm.category_name || '').trim();
    if (!cat) {
      errs.category = isRtl ? 'التصنيف مطلوب' : 'Category is required';
    }
    if (editForm.pages && Number(editForm.pages) <= 0) {
      errs.pages = isRtl ? 'عدد الصفحات يجب أن يكون أكبر من 0' : 'Pages must be greater than 0';
    }
    const fileLink = (editForm.link || editForm.pdf_url || '').trim();
    if (fileLink) {
      const urlPattern = /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i;
      if (!urlPattern.test(fileLink)) {
        errs.link = isRtl 
          ? 'يرجى إدخال رابط صالح يبدأ بـ https:// أو http://' 
          : 'Please enter a valid URL starting with https:// or http://';
      }
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    updateBook(editModal, {
      ...editForm,
      link: fileLink,
      pdf_url: fileLink,
      category: cat,
      category_name: cat
    });
    setEditErrors({});
    setEditModal(null);
  };

  // Categories list
  const categoryOptions = useMemo(() => {
    const fromContext = categories?.library || rawCategories?.library || [];
    const fromBooks = Array.from(new Set(books.map(b => b.category).filter(Boolean)));
    const allUnique = Array.from(new Set([...fromContext, ...fromBooks])).filter(
      c => c !== 'الكل' && c !== 'All'
    );
    return [
      { value: 'all', label: isRtl ? 'جميع التصنيفات' : 'All Categories' },
      ...allUnique.map(cat => ({ value: cat, label: cat }))
    ];
  }, [categories, rawCategories, books, isRtl]);

  const sortOptions = [
    { value: 'newest_year', label: isRtl ? 'سنة النشر (الأحدث)' : 'Year (Newest)' },
    { value: 'oldest_year', label: isRtl ? 'سنة النشر (الأقدم)' : 'Year (Oldest)' },
    { value: 'title_asc', label: isRtl ? 'العنوان (أ - ي)' : 'Title (A - Z)' },
    { value: 'author_asc', label: isRtl ? 'المؤلف (أ - ي)' : 'Author (A - Z)' },
  ];

  // Filtering & Sorting
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const query = debouncedSearch.trim().toLowerCase();
        const matchSearch =
          !query ||
          book.title?.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query);

        const matchCategory =
          selectedCategory === 'all' || book.category === selectedCategory;

        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'newest_year') {
          return (Number(b.year) || 0) - (Number(a.year) || 0);
        }
        if (sortBy === 'oldest_year') {
          return (Number(a.year) || 0) - (Number(b.year) || 0);
        }
        if (sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'author_asc') {
          return (a.author || '').localeCompare(b.author || '');
        }
        return 0;
      });
  }, [books, debouncedSearch, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(start, start + itemsPerPage);
  }, [filteredBooks, currentPage, itemsPerPage]);

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    sortBy !== 'newest_year';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest_year');
    setCurrentPage(1);
  };

  return (
    <AdminPageShell
      parent={t('adminLibrary.parent')}
      title={t('adminLibrary.title')}
      subtitle={t('adminLibrary.subtitle')}
      icon="library_books"
      actions={
        <Link
          to="/admin-dashboard/add-book"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">bookmark_add</span>
          {t('adminLibrary.addBook')}
        </Link>
      }
    >
      {/* ===== Controls Bar: Search, Category, Sort ===== */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              aria-label={isRtl ? 'ابحث باسم الكتاب أو المؤلف' : 'Search by title or author'}
              placeholder={isRtl ? 'ابحث باسم الكتاب أو المؤلف...' : 'Search by title or author...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 pr-10 pl-9 text-sm text-gray-700 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
            />
          </div>

          {/* Sort By */}
          <div>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Reset Filter Action */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث والفلترة: (${filteredBooks.length}) كتاب ومرجع`
                : `Filtered Results: (${filteredBooks.length}) items`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* ===== Books Grid & Pagination Container ===== */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        {paginatedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {isRtl ? 'لم يتم العثور على أي كتب أو مراجع' : 'No books or references found'}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isRtl
                ? 'جرب تعديل كلمات البحث أو تصفية الخيارات لإظهار النتائج.'
                : 'Try adjusting your search terms or filters.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paginatedBooks.map((book) => (
                <div
                  key={book.id}
                  className="hover-lift rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-sm hover:border-[#D4AF37] dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {book.category && (
                        <span className="rounded-full bg-[#FAF7F2] border border-[#E8E2D5] px-2.5 py-0.5 text-[10px] font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {book.category}
                        </span>
                      )}
                    </div>
                    <h3 className="flex-1 text-right font-bold text-dark dark:text-white">{book.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {book.author} · {book.year}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(book)}
                      className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                      title={t('common.edit')}
                      aria-label={t('common.edit')}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal(book)}
                      className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-bold text-secondary transition-colors hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredBooks.length}
          itemsPerPage={itemsPerPage}
          itemName={isRtl ? 'كتاب ومرجع' : 'books'}
        />
      </div>

      {/* ===== Edit Modal ===== */}
      {editModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setEditModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditModal(null)}
              className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700"
              title={t('common.close') || 'Close'}
              aria-label={t('common.close') || 'Close'}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-xl">edit</span>
            </div>
            <h3 className="text-center text-xl font-bold text-dark dark:text-white mb-6">{t('adminLibrary.editTitle')}</h3>

            <div className="space-y-4">
              {[
                { key: 'title', label: t('adminAddBook.bookTitle'), type: 'text', required: true, placeholder: '' },
                { key: 'author', label: t('adminAddBook.author'), type: 'text', required: true, placeholder: '' },
                { key: 'year', label: t('adminLibrary.publicationYear'), type: 'text', required: false, placeholder: '2024' },
                { key: 'pages', label: t('adminAddBook.pageCount'), type: 'number', required: false, placeholder: '120' },
                { key: 'link', label: t('adminAddBook.fileLink'), type: 'url', required: false, placeholder: 'https://...' },
              ].map(({ key, label, type, required, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`edit-book-${key}`} className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                    {label} {required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id={`edit-book-${key}`}
                    type={type}
                    placeholder={placeholder}
                    value={editForm[key] || ''}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, [key]: e.target.value }));
                      if (editErrors[key]) setEditErrors(prev => ({ ...prev, [key]: null }));
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-gray-900 dark:text-white ${
                      editErrors[key] ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-[#E8E2D5] dark:border-gray-700'
                    }`}
                  />
                  {editErrors[key] && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{editErrors[key]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t('adminAddBook.category')} <span className="text-rose-500">*</span>
                </label>
                <div className={editErrors.category ? 'rounded-xl ring-2 ring-rose-500/20' : ''}>
                  <CustomSelect
                    value={editForm.category || ''}
                    onChange={(val) => {
                      setEditForm(prev => ({ ...prev, category: val }));
                      if (editErrors.category) setEditErrors(prev => ({ ...prev, category: null }));
                    }}
                    options={Array.from(new Set([
                      ...(categories?.library || rawCategories?.library || []),
                      ...(editForm.category ? [editForm.category] : [])
                    ]))
                      .filter(cat => cat && cat !== 'الكل' && cat !== 'All')
                      .map(cat => ({ value: cat, label: cat }))}
                  />
                </div>
                {editErrors.category && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{editErrors.category}</p>
                )}
              </div>
            </div>

            {Object.keys(editErrors).length > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{t('adminAddBook.requiredFields')}</span>
              </div>
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
              >
                {t('adminLibrary.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirm Modal ===== */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-secondary dark:bg-rose-900/20">
              <span className="material-symbols-outlined text-xl">delete</span>
            </div>
            <h3 className="text-center text-xl font-bold text-dark dark:text-white">{t('adminLibrary.deleteTitle')}</h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('adminLibrary.deleteConfirm', { title: deleteModal.title }).replace('{title}', deleteModal.title)}
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeBook(deleteModal.id);
                  setDeleteModal(null);
                }}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600"
              >
                {t('adminLibrary.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
