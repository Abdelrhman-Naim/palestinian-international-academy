"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminPageShell from './AdminPageShell';
import { useCategories } from '../../context/CategoriesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getShortVideos, renameCategoryInShorts } from '../../services/shortsService';

export default function AdminShortsCategories() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { showSuccess, showError } = useToast();
  const { rawCategories, addCategory, updateCategory, removeCategory } = useCategories();
  const items = rawCategories.shorts || [];

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editModal, setEditModal] = useState(null); // { item, newName, error, saving }
  const [shortsCounts, setShortsCounts] = useState({});

  useEffect(() => {
    async function loadCounts() {
      try {
        const list = await getShortVideos();
        const counts = {};
        list.forEach((s) => {
          const cat = s.category || '';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        setShortsCounts(counts);
      } catch (err) {
        console.warn('Could not load shorts counts:', err);
      }
    }
    loadCounts();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (isAdding) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      const result = await addCategory('shorts', trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName('');
      setError('');
      showSuccess(isRtl ? 'تمت إضافة التصنيف بنجاح' : 'Category added successfully');
    } catch (err) {
      setError(isRtl ? 'حدث خطأ أثناء إضافة التصنيف' : 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editModal) return;
    const trimmed = editModal.newName.trim();
    if (!trimmed) {
      setEditModal((prev) => ({
        ...prev,
        error: isRtl ? 'اسم التصنيف مطلوب' : 'Category name is required',
      }));
      return;
    }

    setEditModal((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const res = await updateCategory('shorts', editModal.item, trimmed);
      if (!res.ok) {
        setEditModal((prev) => ({ ...prev, saving: false, error: res.error }));
        return;
      }
      // Also update category across all existing shorts
      await renameCategoryInShorts(editModal.item, trimmed);

      // Update local count cache
      setShortsCounts((prev) => {
        const next = { ...prev };
        const existingCount = next[editModal.item] || 0;
        delete next[editModal.item];
        next[trimmed] = (next[trimmed] || 0) + existingCount;
        return next;
      });

      showSuccess(isRtl ? 'تم تعديل التصنيف بنجاح' : 'Category updated successfully');
      setEditModal(null);
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        saving: false,
        error: isRtl ? 'فشل حفظ التعديل' : 'Failed to save edit',
      }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await removeCategory('shorts', pendingDelete);
      showSuccess(isRtl ? 'تم حذف التصنيف بنجاح' : 'Category removed');
      setPendingDelete(null);
    } catch (err) {
      showError(isRtl ? 'فشل حذف التصنيف' : 'Failed to delete category');
    }
  };

  return (
    <AdminPageShell
      parent={t('adminShortsCategories.parent')}
      title={t('adminShortsCategories.title')}
      subtitle={t('adminShortsCategories.subtitle')}
      icon="category"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin-dashboard/shorts"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-stone-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">smart_display</span>
            <span>{isRtl ? 'معاينة كل المحتوى' : 'All Shorts Content'}</span>
          </Link>
          <Link
            href="/admin-dashboard/add-short"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-stone-950 shadow-md shadow-primary/20 transition-all hover:bg-secondary cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>{isRtl ? 'إضافة فيديو/معلومة' : 'Add Short'}</span>
          </Link>
        </div>
      }
    >
      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs dark:border-gray-700 dark:bg-gray-800 sm:flex-row"
      >
        <label htmlFor="add-shorts-category-input" className="sr-only">
          {t('adminShortsCategories.placeholder')}
        </label>
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            sell
          </span>
          <input
            id="add-shorts-category-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t('adminShortsCategories.placeholder')}
            className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] ps-10 pe-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={isAdding || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-stone-950 transition-all hover:bg-secondary shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isAdding ? (
            <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-base">add</span>
          )}
          <span>{isAdding ? (isRtl ? 'جاري الإضافة...' : 'Adding...') : t('adminShortsCategories.add')}</span>
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 dark:border-rose-800 dark:bg-rose-900/20">
          {error}
        </div>
      )}

      {/* Categories List */}
      {items.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] text-gray-400 dark:border-gray-700">
          <span className="material-symbols-outlined mb-3 text-5xl text-gray-300 dark:text-gray-600">
            category
          </span>
          <p className="font-bold text-gray-500 dark:text-gray-400">
            {t('adminShortsCategories.noCategories')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-xs dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-[#E8E2D5] dark:divide-gray-700">
            {items.map((item, idx) => {
              const videoCount = shortsCounts[item] || 0;
              return (
                <div
                  key={item}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-[#FAF7F2] dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 shrink-0 font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-dark dark:text-white text-base block">
                        {item}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {videoCount} {t('adminShortsCategories.videosCount') || (isRtl ? 'فيديو' : 'videos')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditModal({ item, newName: item, error: '', saving: false });
                      }}
                      className="rounded-lg bg-primary/10 dark:bg-primary/15 text-primary hover:bg-primary/20 px-3 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>{t('adminShortsCategories.edit')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>{t('adminShortsCategories.delete')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-xs dark:bg-black/60"
          onClick={() => !editModal.saving && setEditModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">edit</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  {t('adminShortsCategories.editTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('adminShortsCategories.editSubtitle')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRtl ? 'اسم التصنيف الجديد' : 'New Category Name'}
                </label>
                <input
                  type="text"
                  value={editModal.newName}
                  onChange={(e) =>
                    setEditModal((prev) => ({ ...prev, newName: e.target.value, error: '' }))
                  }
                  placeholder={t('adminShortsCategories.editPlaceholder')}
                  autoFocus
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2.5 text-sm text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                {editModal.error && (
                  <p className="mt-1.5 text-xs font-bold text-rose-500">{editModal.error}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5] dark:border-gray-700">
                <button
                  type="button"
                  disabled={editModal.saving}
                  onClick={() => setEditModal(null)}
                  className="rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-stone-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
                >
                  {t('adminShortsCategories.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editModal.saving || !editModal.newName.trim()}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-stone-950 hover:bg-secondary cursor-pointer disabled:opacity-50"
                >
                  {editModal.saving
                    ? t('adminShortsCategories.saving')
                    : t('adminShortsCategories.saveEdit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-xs dark:bg-black/60"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-dark dark:text-white">
                {t('adminShortsCategories.deleteTitle')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-bold text-dark dark:text-white">"{pendingDelete}"</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              {t('adminShortsCategories.deleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-[#E8E2D5] dark:border-gray-700 pt-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-stone-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                {t('adminShortsCategories.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                {t('adminShortsCategories.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
