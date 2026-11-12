"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPageShell from './AdminPageShell';
import CustomSelect from '../../components/CustomSelect';
import { useCategories } from '../../context/CategoriesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { addShortVideo, parseVideoEmbed } from '../../services/shortsService';

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

export default function AdminAddShort() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { rawCategories } = useCategories();
  const categoriesList = rawCategories.shorts || [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [category, setCategory] = useState(categoriesList[0] || 'برمجة');
  const [icon, setIcon] = useState('smart_display');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const parsedVideo = parseVideoEmbed(videoUrl);

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = isRtl ? 'يرجى إدخال عنوان الفيديو أو المعلومة' : 'Please enter video title';
    }
    if (!videoUrl.trim()) {
      errs.videoUrl = isRtl ? 'يرجى إدخال رابط الفيديو' : 'Please enter video URL';
    }
    if (!category.trim()) {
      errs.category = isRtl ? 'يرجى تحديد التصنيف' : 'Please select a category';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      await addShortVideo({
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        category: category.trim(),
        icon: icon.trim(),
      });
      showSuccess(isRtl ? 'تمت إضافة ونشر الفيديو بنجاح' : 'Short video published successfully');
      router.push('/admin-dashboard/shorts');
    } catch (err) {
      showError(err.message || (isRtl ? 'حدث خطأ أثناء حفظ الفيديو' : 'Failed to save short video'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPageShell
      parent={t('adminAddShort.parent')}
      title={t('adminAddShort.title')}
      subtitle={t('adminAddShort.subtitle')}
      icon="add_circle"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin-dashboard/shorts"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-stone-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>{t('adminAddShort.cancel')}</span>
          </Link>
          <Link
            href="/admin-dashboard/shorts-categories"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-stone-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">category</span>
            <span>{isRtl ? 'إدارة التصنيفات' : 'Categories'}</span>
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inputs (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 sm:p-6 shadow-xs dark:border-gray-700 dark:bg-gray-800 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="short-title" className="block text-sm font-bold text-dark dark:text-white mb-2">
                {t('adminAddShort.shortTitle')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="short-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                placeholder={t('adminAddShort.shortTitlePlaceholder')}
                className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900 ${
                  errors.title ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-[#E8E2D5]'
                }`}
              />
              {errors.title && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-dark dark:text-white">
                  {t('adminAddShort.category')} <span className="text-rose-500">*</span>
                </label>
                <Link
                  href="/admin-dashboard/shorts-categories"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>{isRtl ? 'إضافة تصنيف جديد' : 'New category'}</span>
                </Link>
              </div>
              <CustomSelect
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                }}
                placeholder={t('adminAddShort.selectCategory')}
                options={
                  categoriesList.length > 0
                    ? categoriesList.map((item) => ({ value: item, label: item }))
                    : [{ value: 'عام', label: isRtl ? 'عام' : 'General' }]
                }
              />
              {errors.category && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errors.category}
                </p>
              )}
            </div>

            {/* Video URL */}
            <div>
              <label htmlFor="short-url" className="block text-sm font-bold text-dark dark:text-white mb-2">
                {t('adminAddShort.videoUrl')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  link
                </span>
                <input
                  id="short-url"
                  type="url"
                  dir="ltr"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (errors.videoUrl) setErrors((prev) => ({ ...prev, videoUrl: null }));
                  }}
                  placeholder={t('adminAddShort.videoUrlPlaceholder')}
                  className={`w-full rounded-xl border bg-[#FAF7F2] ps-10 pe-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900 ${
                    errors.videoUrl ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-[#E8E2D5]'
                  }`}
                />
              </div>
              {errors.videoUrl && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errors.videoUrl}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-400">
                {isRtl
                  ? 'يدعم روابط يوتيوب (Shorts وفيديوهات عادية) أو روابط Google Drive المباشرة أو ملفات الفيديو MP4.'
                  : 'Supports YouTube (shorts and regular), Google Drive preview links, and direct MP4 streams.'}
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="short-desc" className="block text-sm font-bold text-dark dark:text-white mb-2">
                {t('adminAddShort.description')}
              </label>
              <textarea
                id="short-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('adminAddShort.descriptionPlaceholder')}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] p-4 text-sm text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings: Icon Selector & Live Video Preview (1 col) */}
        <div className="space-y-6">
          {/* Icon Selector */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
            <h4 className="font-bold text-sm text-dark dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">category</span>
              <span>{t('adminAddShort.icon')}</span>
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((ic) => {
                const isSelected = icon === ic.id;
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    title={ic.label}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 ring-2 ring-primary/20'
                        : 'border-[#E8E2D5] dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-gray-700/50 text-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-1">{ic.id}</span>
                    <span className="text-[10px] font-bold line-clamp-1">{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
            <h4 className="font-bold text-sm text-dark dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">preview</span>
              <span>{t('adminAddShort.livePreview')}</span>
            </h4>

            <div className="relative aspect-video rounded-xl bg-stone-900 overflow-hidden flex items-center justify-center border border-[#E8E2D5] dark:border-gray-700">
              {parsedVideo.embedUrl ? (
                parsedVideo.type === 'html5' ? (
                  <video
                    src={parsedVideo.embedUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={parsedVideo.embedUrl}
                    title="Live preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <div className="p-4 text-center text-gray-400">
                  <span className="material-symbols-outlined text-3xl mb-1 block">smart_display</span>
                  <p className="text-xs">{t('adminAddShort.noPreview')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-bold text-stone-950 shadow-md shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">check_circle</span>
              )}
              <span>{submitting ? (isRtl ? 'جاري الحفظ والنشر...' : 'Publishing...') : t('adminAddShort.save')}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin-dashboard/shorts')}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E8E2D5] py-2.5 px-4 text-xs font-bold text-gray-600 hover:bg-stone-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              {t('adminAddShort.cancel')}
            </button>
          </div>
        </div>
      </form>
    </AdminPageShell>
  );
}
