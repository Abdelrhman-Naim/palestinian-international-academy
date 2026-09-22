import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminPageShell from './AdminPageShell';
import { useCategories } from '../../context/CategoriesContext';
import { useLibrary } from '../../context/LibraryContext';
import CustomSelect from '../../components/CustomSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminAddBook() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { rawCategories } = useCategories();
  const { addBook } = useLibrary();
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [pages, setPages] = useState('');
  const [link, setLink] = useState('');
  const [modal, setModal] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = dir === 'rtl' ? 'يرجى إدخال عنوان الكتاب' : 'Please enter book title';
    }
    if (!author.trim()) {
      errs.author = dir === 'rtl' ? 'يرجى إدخال اسم المؤلف' : 'Please enter author name';
    }
    if (!category.trim()) {
      errs.category = dir === 'rtl' ? 'يرجى اختيار التصنيف' : 'Please select a category';
    }
    if (!pages || Number(pages) <= 0) {
      errs.pages = dir === 'rtl' ? 'يرجى إدخال عدد صفحات صالح (أكبر من 0)' : 'Please enter a valid page count (> 0)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenSaveModal = () => {
    if (validateForm()) {
      setErrors({});
      setModal('save');
    }
  };
  
  const handleSave = async () => {
    if (!title || !author || !category) {
      alert(t('adminAddBook.requiredFields'));
      setModal(null);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addBook({
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        category_name: category.trim(),
        link: link.trim(),
        pdf_url: link.trim(),
        coverUrl: '',
        cover_url: '',
        description: title.trim(),
        year: new Date().getFullYear().toString(),
        pages: Number(pages) > 0 ? Number(pages) : 120,
        downloads: 0,
        downloads_count: 0
      });
      
      setModal(null);
      navigate('/admin-dashboard/library');
    } catch (err) {
      console.error('Error adding book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPageShell
      parent={t('adminAddBook.parent')}
      title={t('adminAddBook.title')}
      subtitle={t('adminAddBook.subtitle')}
      icon="bookmark_add"
    >
      <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-5 dark:border-gray-700 dark:bg-gray-800/60 sm:p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('adminAddBook.bookTitle')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('adminAddBook.bookTitlePlaceholder')}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-800 dark:text-gray-100 ${
                errors.title
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:border-rose-500'
                  : 'border-[#E8E2D5] focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('adminAddBook.author')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('adminAddBook.authorPlaceholder')}
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                if (errors.author) setErrors(prev => ({ ...prev, author: null }));
              }}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-800 dark:text-gray-100 ${
                errors.author
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:border-rose-500'
                  : 'border-[#E8E2D5] focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700'
              }`}
            />
            {errors.author && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.author}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                {t('adminAddBook.category')} <span className="text-rose-500">*</span>
              </label>
              <div className={errors.category ? 'rounded-xl ring-2 ring-rose-500/20' : ''}>
                <CustomSelect
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                  }}
                  placeholder={t('adminAddBook.selectCategory')}
                  options={[
                    { value: "", label: t('adminAddBook.selectCategory') },
                    ...rawCategories.library.map((item) => ({ value: item, label: item }))
                  ]}
                />
              </div>
              {errors.category && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errors.category}
                </p>
              )}
              {rawCategories.library.length === 0 && (
                <p className="mt-2 text-xs font-bold text-rose-500">
                  {t('adminAddBook.noCategories')}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                {t('adminAddBook.pageCount')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder={t('adminAddBook.pageCountPlaceholder')}
                value={pages}
                onChange={(e) => {
                  setPages(e.target.value);
                  if (errors.pages) setErrors(prev => ({ ...prev, pages: null }));
                }}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-800 dark:text-gray-100 ${
                  errors.pages
                    ? 'border-rose-500 ring-2 ring-rose-500/10 focus:border-rose-500'
                    : 'border-[#E8E2D5] focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700'
                }`}
              />
              {errors.pages && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errors.pages}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">{t('adminAddBook.fileLink')}</label>
            <input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{t('adminAddBook.requiredFields')}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E8E2D5] pt-6 dark:border-gray-800 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setModal('cancel')}
            className="rounded-xl border border-rose-200 bg-white dark:bg-gray-800 px-8 py-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50 dark:border-rose-900/40"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white transition hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
          >
            {t('adminAddBook.addToLibrary')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 dark:border dark:border-gray-700 dark:bg-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-center text-xl font-bold text-gray-800 dark:text-gray-100">
                {modal === 'save' ? t('adminAddBook.saveBook') : t('adminAddBook.cancelTitle')}
              </h3>
              <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                {modal === 'save'
                  ? t('adminAddBook.confirmSave')
                  : t('adminAddBook.confirmCancel')}
              </p>
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition hover:bg-[#F3EFE6] dark:hover:bg-gray-700"
                >
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (modal === 'save') {
                      await handleSave();
                    } else {
                      setModal(null);
                      navigate('/admin-dashboard/library');
                    }
                  }}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    modal === 'save' 
                      ? 'bg-primary hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-primary/20' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                  }`}
                >
                  {isSubmitting && modal === 'save' && (
                    <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                  )}
                  <span>
                    {isSubmitting && modal === 'save'
                      ? (dir === 'rtl' ? 'جاري الحفظ...' : 'Saving...')
                      : (modal === 'save' ? t('adminAddBook.confirmSaveBtn') : t('adminAddBook.confirmCancelBtn'))}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageShell>
  );
}



