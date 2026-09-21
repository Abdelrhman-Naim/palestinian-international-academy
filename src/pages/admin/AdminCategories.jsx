import { useState } from 'react';
import AdminPageShell from './AdminPageShell';
import { useCategories } from '../../context/CategoriesContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminCategories() {
  const { t } = useLanguage();
  const { rawCategories, addCategory, updateCategory, removeCategory } = useCategories();
  const items = rawCategories.courses;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editModal, setEditModal] = useState(null); // { item, newName, error, saving }

  const handleAdd = async (e) => {
    e.preventDefault();
    const result = await addCategory('courses', name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName('');
    setError('');
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editModal) return;
    const trimmed = editModal.newName.trim();
    if (!trimmed) {
      setEditModal(prev => ({ ...prev, error: t('adminCategories.editPlaceholder') || 'يرجى إدخال اسم التصنيف' }));
      return;
    }
    setEditModal(prev => ({ ...prev, saving: true, error: '' }));
    const res = await updateCategory('courses', editModal.item, trimmed);
    if (!res.ok) {
      setEditModal(prev => ({ ...prev, saving: false, error: res.error }));
      return;
    }
    setEditModal(null);
  };

  return (
    <AdminPageShell
      parent={t('adminCourses.parent')}
      title={t('adminCategories.title')}
      subtitle={t('adminCategories.subtitle')}
      icon="category"
    >
      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder={t('adminCategories.placeholder')}
          className="flex-1 rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {t('adminLibraryCategories.add')}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-secondary dark:border-rose-800 dark:bg-rose-900/20">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] text-gray-400 dark:border-gray-700">
          <span className="material-symbols-outlined mb-3 text-5xl text-gray-300 dark:text-gray-600">
            category
          </span>
          <p className="font-bold text-gray-500 dark:text-gray-400">{t('adminLibraryCategories.noCategories')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 border-b border-[#E8E2D5] px-5 py-4 last:border-0 hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal({ item, newName: item, error: '', saving: false });
                  }}
                  className="rounded-lg bg-orange-50 dark:bg-orange-950/40 text-primary dark:text-amber-400 px-3 py-2 text-sm font-bold transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/40 flex items-center gap-1.5"
                  title={t('adminCategories.edit') || t('common.edit')}
                  aria-label={t('adminCategories.edit') || t('common.edit')}
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>{t('adminCategories.edit') || t('common.edit')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(item)}
                  className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-secondary transition-colors hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 flex items-center gap-1.5"
                  title={t('common.delete')}
                  aria-label={t('common.delete')}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>{t('common.delete')}</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-dark dark:text-white">{item}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-primary dark:bg-orange-900/30">
                  <span className="material-symbols-outlined text-lg">label</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Category Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => !editModal.saving && setEditModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40">
              <span className="material-symbols-outlined text-2xl">edit</span>
            </div>
            <h3 className="text-center text-xl font-bold text-dark dark:text-white">
              {t('adminCategories.editTitle')}
            </h3>
            <p className="mt-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
              {t('adminCategories.editSubtitle')}
            </p>

            <form onSubmit={handleSaveEdit} className="mt-5">
              <label className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
                {t('adminCategories.editTitle')}
              </label>
              <input
                type="text"
                autoFocus
                disabled={editModal.saving}
                value={editModal.newName}
                onChange={(e) => setEditModal(prev => ({ ...prev, newName: e.target.value, error: '' }))}
                placeholder={t('adminCategories.editPlaceholder')}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
              />

              {editModal.error && (
                <p className="mt-2 text-xs font-bold text-rose-500 dark:text-rose-400">
                  {editModal.error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={editModal.saving}
                  onClick={() => setEditModal(null)}
                  className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editModal.saving}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {editModal.saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('adminCategories.saving')}</span>
                    </>
                  ) : (
                    <span>{t('adminCategories.saveEdit')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-secondary dark:bg-rose-900/20">
              <span className="material-symbols-outlined text-xl">delete</span>
            </div>
            <h3 className="text-center text-xl font-bold text-dark dark:text-white">{t('adminCategories.deleteTitle')}</h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('adminCategories.deleteConfirm')}
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeCategory('courses', pendingDelete);
                  setPendingDelete(null);
                }}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600"
              >
                {t('adminCategories.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

