"use client";

import React, { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  getShortVideos,
  addShortVideo,
  updateShortVideo,
  deleteShortVideo,
  parseVideoEmbed,
} from '../../services/shortsService';

const AVAILABLE_ICONS = [
  { id: 'smart_display', label: 'فيديو' },
  { id: 'code', label: 'برمجة' },
  { id: 'engineering', label: 'هندسة' },
  { id: 'smart_toy', label: 'ذكاء اصطناعي' },
  { id: 'terminal', label: 'طرفية وكود' },
  { id: 'shield', label: 'أمن وحماية' },
  { id: 'memory', label: 'معالجات وأنظمة' },
  { id: 'bolt', label: 'إضاءة سريعة' },
];

const AVAILABLE_CATEGORIES = [
  'برمجة',
  'هندسة',
  'ذكاء اصطناعي',
  'أمن سيبراني',
  'سحاب وأنظمة',
  'معلومات تقنية عامة',
];

export default function AdminShorts() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { showSuccess, showError } = useToast();

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'برمجة',
    icon: 'smart_display',
  });
  const [submitting, setSubmitting] = useState(false);

  // Test player modal
  const [previewVideo, setPreviewVideo] = useState(null);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      const data = await getShortVideos();
      setShorts(data);
    } catch (err) {
      showError(isRtl ? 'حدث خطأ أثناء تحميل الفيديوهات' : 'Failed to load short videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      category: 'برمجة',
      icon: 'smart_display',
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      video_url: item.video_url || '',
      category: item.category || 'برمجة',
      icon: item.icon || 'smart_display',
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.video_url.trim()) {
      showError(isRtl ? 'يرجى إدخال اسم الفيديو والرابط' : 'Please provide video title and URL');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateShortVideo(editingId, formData);
        showSuccess(isRtl ? 'تم تحديث الفيديو بنجاح' : 'Short video updated successfully');
      } else {
        await addShortVideo(formData);
        showSuccess(isRtl ? 'تمت إضافة الفيديو الجديد بنجاح' : 'Short video added successfully');
      }
      resetForm();
      fetchShorts();
    } catch (err) {
      showError(err.message || (isRtl ? 'فشل حفظ الفيديو' : 'Failed to save video'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف الفيديو "${item.title}"؟`
      : `Are you sure you want to delete "${item.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteShortVideo(item.id);
      showSuccess(isRtl ? 'تم حذف الفيديو' : 'Video deleted');
      fetchShorts();
    } catch (err) {
      showError(isRtl ? 'فشل حذف الفيديو' : 'Failed to delete video');
    }
  };

  const filteredShorts = shorts.filter((item) => {
    const matchSearch =
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <AdminPageShell
      parent={isRtl ? 'لوحة التحكم' : 'Admin'}
      title={isRtl ? 'الفيديوهات والمعلومات السريعة' : 'Tech Short Videos & Bites'}
      subtitle={
        isRtl
          ? 'إدارة محتوى الفيديوهات القصيرة والمعلومات الهندسية والبرمجية المعروضة في الصفحة الرئيسية'
          : 'Manage engineering and coding short videos displayed on the homepage'
      }
      icon="smart_display"
      actions={
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-secondary text-stone-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>{isRtl ? 'إضافة فيديو جديد' : 'Add New Short Video'}</span>
        </button>
      }
    >
      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'البحث بالاسم أو الوصف...' : 'Search by title or description...'}
            className="w-full ps-10 pe-4 py-2 bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-primary text-stone-950 shadow-xs'
                : 'bg-stone-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200'
            }`}
          >
            {isRtl ? 'الكل' : 'All'} ({shorts.length})
          </button>
          {AVAILABLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-stone-950 shadow-xs'
                  : 'bg-stone-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm text-gray-500 font-bold">
            {isRtl ? 'جاري تحميل الفيديوهات والمعلومات...' : 'Loading short videos...'}
          </p>
        </div>
      ) : filteredShorts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">smart_display</span>
          </div>
          <h3 className="font-bold text-lg text-dark dark:text-white mb-2">
            {isRtl ? 'لا توجد فيديوهات مسجلة بعد' : 'No short videos found'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {isRtl
              ? 'يمكنك إضافة فيديوهات ومعلومات هندسية جديدة لتظهر لزوار المنصة بالصفحة الرئيسية.'
              : 'Add technical updates and short videos to engage visitors on the homepage.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-stone-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>{isRtl ? 'إضافة أول فيديو' : 'Add First Video'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShorts.map((item) => {
            const parsed = parseVideoEmbed(item.video_url);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Thumbnail / Header Area */}
                <div className="relative aspect-16/9 bg-stone-900 overflow-hidden flex items-center justify-center group">
                  {parsed.thumbnailUrl && (
                    <img
                      src={parsed.thumbnailUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Category Pill */}
                  <span className="absolute top-3 start-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-400/30">
                    {item.category}
                  </span>

                  {/* Centered Play / Icon */}
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(item)}
                    className="relative z-10 w-12 h-12 rounded-full bg-primary text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer"
                    title={isRtl ? 'تشغيل وتجربة الفيديو' : 'Preview video'}
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {item.icon === 'smart_display' ? 'play_arrow' : (item.icon || 'play_arrow')}
                    </span>
                  </button>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-dark dark:text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E8E2D5] dark:border-gray-700/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewVideo(item)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">play_circle</span>
                      <span>{isRtl ? 'تجربة العرض' : 'Preview'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        title={isRtl ? 'تعديل' : 'Edit'}
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title={isRtl ? 'حذف' : 'Delete'}
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-gray-800"
            dir={dir}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E8E2D5] dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {editingId ? 'edit_note' : 'add_circle'}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-dark dark:text-white">
                  {editingId
                    ? (isRtl ? 'تعديل الفيديو والمعلومات' : 'Edit Video & Insight')
                    : (isRtl ? 'إضافة فيديو ومعلومات سريعة' : 'Add New Tech Short')}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title (اسم) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRtl ? 'اسم / عنوان الفيديو والمعلومة *' : 'Video Title / Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isRtl ? 'مثال: ثورة الذكاء الاصطناعي في هندسة البرمجيات' : 'e.g. AI Agents in Software Engineering'}
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white"
                />
              </div>

              {/* Description (وصف) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRtl ? 'الوصف والمعلومة السريعة *' : 'Description / Insight Summary *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isRtl ? 'اكتب ملخصاً مكثفاً عن المعلومة التقنية أو موضوع الفيديو...' : 'Brief summary of the engineering insight or video topic...'}
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white resize-none"
                />
              </div>

              {/* Video URL (رابط) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRtl ? 'رابط الفيديو (YouTube / YouTube Shorts / Google Drive / MP4) *' : 'Video URL (YouTube / Shorts / Drive / MP4) *'}
                </label>
                <input
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... أو https://youtube.com/shorts/..."
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white"
                />
              </div>

              {/* Category & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRtl ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white"
                  >
                    {AVAILABLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRtl ? 'أيقونة المركز' : 'Center Icon'}
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-primary text-dark dark:text-white"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.label} ({ic.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E2D5] dark:border-gray-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-stone-100 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-secondary text-stone-950 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>
                    {submitting
                      ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
                      : (isRtl ? 'حفظ الفيديو' : 'Save Video')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Preview Player Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="px-5 py-4 border-b border-[#E8E2D5] dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-dark dark:text-white truncate">
                {previewVideo.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="relative aspect-16/9 bg-black">
              {(() => {
                const parsed = parseVideoEmbed(previewVideo.video_url);
                if (parsed.type === 'youtube' || parsed.type === 'drive') {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={previewVideo.title}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  );
                }
                if (parsed.type === 'html5') {
                  return (
                    <video
                      src={parsed.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }
                return (
                  <iframe
                    src={parsed.embedUrl}
                    title={previewVideo.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
