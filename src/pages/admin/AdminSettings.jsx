import { useState, useEffect, useMemo } from 'react';
import AdminPageShell from './AdminPageShell';
import { useLanguage } from '../../context/LanguageContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useCourses } from '../../context/CoursesContext';
import CustomSelect from '../../components/CustomSelect';

export default function AdminSettings() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  // Maintenance Context
  const { isMaintenance, maintenanceData, toggleMaintenance } = useMaintenance();
  const [customMsg, setCustomMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Courses Context for Hero Featured Course
  const { courses, featuredCourseConfig, updateFeaturedCourse } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [totalLessons, setTotalLessons] = useState(10);
  const [completedLessons, setCompletedLessons] = useState(8);
  const [customLabel, setCustomLabel] = useState('');
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroSuccess, setHeroSuccess] = useState('');

  useEffect(() => {
    if (maintenanceData?.message) {
      setCustomMsg(maintenanceData.message);
    }
  }, [maintenanceData?.message]);

  useEffect(() => {
    if (featuredCourseConfig) {
      setSelectedCourseId(featuredCourseConfig.courseId || '');
      setCompletedLessons(featuredCourseConfig.completedLessons ?? 8);
      setCustomLabel(featuredCourseConfig.customLabel || '');
      if (featuredCourseConfig.totalLessons) {
        setTotalLessons(featuredCourseConfig.totalLessons);
      }
    }
  }, [featuredCourseConfig]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    const selectedCourse = (courses || []).find(c => c.id === courseId);
    if (selectedCourse) {
      const lecturesCount = selectedCourse.lectures?.length || selectedCourse.lecturesCount || 10;
      setTotalLessons(lecturesCount);
    }
  };

  const numTotal = Number(totalLessons) > 0 ? Number(totalLessons) : 1;
  const numCompleted = Math.max(0, Number(completedLessons) || 0);
  const calculatedProgress = Math.min(100, Math.round((numCompleted / numTotal) * 100));

  const handleToggle = async () => {
    setIsUpdating(true);
    setActionSuccess('');
    const newStatus = !isMaintenance;
    const res = await toggleMaintenance(newStatus, customMsg);
    setIsUpdating(false);
    if (res.success) {
      setActionSuccess(newStatus ? (t('maintenance.successEnabled') || 'تم تفعيل وضع الصيانة بنجاح') : (t('maintenance.successDisabled') || 'تم تعطيل وضع الصيانة بنجاح'));
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      alert((t('maintenance.errorToggle') || 'خطأ أثناء تغيير وضع الصيانة:') + ' ' + res.error);
    }
  };

  const handleSaveMessage = async () => {
    setIsUpdating(true);
    setActionSuccess('');
    const res = await toggleMaintenance(isMaintenance, customMsg);
    setIsUpdating(false);
    if (res.success) {
      setActionSuccess(t('maintenance.successMessageSaved') || 'تم حفظ رسالة الصيانة بنجاح');
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  const handleSaveHeroCourse = async (e) => {
    e.preventDefault();
    setIsSavingHero(true);
    setHeroSuccess('');

    const res = await updateFeaturedCourse({
      courseId: selectedCourseId,
      progress: calculatedProgress,
      completedLessons: numCompleted,
      totalLessons: numTotal,
      customLabel: customLabel.trim()
    });

    setIsSavingHero(false);
    if (res.ok) {
      setHeroSuccess(isRtl ? 'تم حفظ وإعادة ضبط الكورس المميز للواجهة الرئيسية بنجاح!' : 'Featured Hero course updated successfully!');
      setTimeout(() => setHeroSuccess(''), 4000);
    }
  };

  const courseOptions = useMemo(() => {
    const defaultOpt = { value: '', label: isRtl ? '-- اختر كورس من القائمة --' : '-- Select a course --' };
    const items = (courses || []).map((course) => ({
      value: course.id,
      label: `${course.title}${course.category ? ` (${course.category})` : ''}`
    }));
    return [defaultOpt, ...items];
  }, [courses, isRtl]);

  // Preview computations
  const currentPreviewCourse = (courses || []).find(c => c.id === selectedCourseId) 
    || (courses && courses.length > 0 ? courses[0] : null);

  const previewTitle = currentPreviewCourse?.title || (isRtl ? 'دورة الهندسة والتصميم التطبيقي' : 'Applied Digital Engineering');
  const previewLabelText = customLabel.trim() || currentPreviewCourse?.category || (isRtl ? 'منصة التعلم الهندسية' : 'Engineering Platform');

  return (
    <AdminPageShell
      title={t('adminSettings.title') || (isRtl ? 'إعدادات النظام والمنصة' : 'System Settings')}
      subtitle={t('adminSettings.subtitle') || (isRtl ? 'إدارة وضع الصيانة وإعدادات العرض بالصفحة الرئيسية' : 'Manage maintenance mode and homepage settings')}
      icon="settings"
    >
      <div className="space-y-8 pb-16 mb-8">
        
        {/* ================= HERO FEATURED COURSE SETTINGS SECTION ================= */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
          <div className="flex items-center gap-4 pb-6 border-b border-[#E8E2D5] dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-primary border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">stars</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark dark:text-white">
                {isRtl ? 'الكورس المميز في قسم الـ Hero (الصفحة الرئيسية)' : 'Hero Section Featured Course'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-gray-400 mt-1 leading-relaxed">
                {isRtl ? 'اختر الكورس الذي يظهر في كارت المعاينة التفاعلي بالصفحة الرئيسية لجميع الزوار' : 'Select which course is displayed in the interactive preview card on the homepage'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveHeroCourse} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form Inputs Column */}
              <div className="space-y-4">
                {/* Course Select */}
                <div>
                  <label className="block text-xs font-bold text-dark dark:text-white mb-2">
                    {isRtl ? 'اختر الكورس المميز' : 'Select Course'} <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    options={courseOptions}
                    value={selectedCourseId}
                    onChange={(val) => handleCourseChange(val)}
                    placeholder={isRtl ? '-- اختر كورس من القائمة --' : '-- Select a course --'}
                  />
                </div>

                {/* Custom Promotional Label */}
                <div>
                  <label className="block text-xs font-bold text-dark dark:text-white mb-2">
                    {isRtl ? 'العنوان الترويجي العلوي (Label Badge)' : 'Top Badge Text'}
                  </label>
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder={isRtl ? 'منصة التعلم الهندسية (أو اترك فارغاً لاستخدام القسم)' : 'Engineering Platform (or leave blank)'}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Progress & Lessons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-dark dark:text-white mb-2">
                      {isRtl ? 'إجمالي دروس الكورس' : 'Total Lessons'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalLessons}
                      onChange={(e) => setTotalLessons(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark dark:text-white mb-2">
                      {isRtl ? 'عدد الدروس المكتملة' : 'Completed Lessons'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={completedLessons}
                      onChange={(e) => setCompletedLessons(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark dark:text-white mb-2 flex items-center justify-between">
                      <span>{isRtl ? 'نسبة الإنجاز (%)' : 'Progress (%)'}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
                        {isRtl ? 'تلقائي' : 'Auto'}
                      </span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${calculatedProgress}%`}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-extrabold cursor-not-allowed select-none text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingHero}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-amber-600 text-dark dark:text-gray-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSavingHero ? (
                    <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">save</span>
                  )}
                  <span>{isRtl ? 'حفظ الكورس المميز' : 'Save Featured Course'}</span>
                </button>

                {heroSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{heroSuccess}</span>
                  </div>
                )}
              </div>

              {/* Live Card Preview Column */}
              <div className="bg-[#FAF7F2] dark:bg-gray-900/60 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 flex flex-col justify-center items-center">
                <span className="text-xs font-bold text-stone-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                  <span>{isRtl ? 'معاينة حية لكارت الـ Hero:' : 'Live Preview:'}</span>
                </span>

                {/* Card Preview Component */}
                <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-xl max-w-sm transition-all">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {previewLabelText}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                      {calculatedProgress}%
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-2 truncate">
                    {previewTitle}
                  </h4>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-stone-200/80 dark:bg-gray-700 overflow-hidden mb-2.5">
                    <div className="h-full bg-gradient-to-r from-amber-600 via-primary to-amber-400 rounded-full transition-all duration-300" style={{ width: `${calculatedProgress}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
                      <span>{isRtl ? `${numCompleted} من ${numTotal} درساً مكتملة` : `${numCompleted} of ${numTotal} Lessons Done`}</span>
                    </span>
                    <span className="text-primary font-bold">{isRtl ? 'الدرس التالي ▶' : 'Next Lesson ▶'}</span>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* ================= MAINTENANCE MODE MANAGEMENT SECTION ================= */}
        <div className={`rounded-2xl border p-6 sm:p-8 transition-all duration-300 shadow-sm ${
          isMaintenance 
            ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_10px_30px_rgba(245,158,11,0.15)] dark:bg-amber-950/20 dark:border-amber-500/30' 
            : 'bg-white dark:bg-gray-800 border-[#E8E2D5] dark:border-gray-700'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E8E2D5] dark:border-gray-700">
            
            {/* Header Info */}
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isMaintenance 
                  ? 'bg-amber-500 text-white shadow-amber-500/30' 
                  : 'bg-[#FAF7F2] dark:bg-gray-700 text-primary border border-[#E8E2D5] dark:border-gray-600'
              }`}>
                <span className="material-symbols-outlined text-2xl">
                  {isMaintenance ? 'engineering' : 'construction'}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-dark dark:text-white">
                    {t('maintenance.title') || (isRtl ? 'وضع الصيانة للمنصة' : 'Maintenance Mode')}
                  </h3>
                  {isMaintenance ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      {t('maintenance.enabledBadge') || (isRtl ? 'مُفعّل' : 'Active')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {t('maintenance.disabledBadge') || (isRtl ? 'معطل' : 'Disabled')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-main dark:text-gray-400 mt-1 leading-relaxed">
                  {t('maintenance.desc') || (isRtl ? 'عند التفعيل يتم تحويل جميع الزوار لصفحة الصيانة' : 'Redirects all visitors to maintenance page when active')}
                </p>
              </div>
            </div>

            {/* Toggle Button Switch */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
              <button
                onClick={handleToggle}
                disabled={isUpdating}
                className={`relative inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50 ${
                  isMaintenance
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-linear-to-r from-secondary to-primary hover:opacity-95 text-white shadow-primary/20'
                }`}
              >
                {isUpdating ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">
                    {isMaintenance ? 'power_settings_new' : 'toggle_on'}
                  </span>
                )}
                <span>{isMaintenance ? (t('maintenance.turnOff') || (isRtl ? 'إيقاف الصيانة' : 'Turn Off')) : (t('maintenance.turnOn') || (isRtl ? 'تفعيل الصيانة' : 'Turn On'))}</span>
              </button>
            </div>
          </div>

          {/* Action success alert */}
          {actionSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Message Editor */}
          <div className="mt-6">
            <label className="block text-xs font-bold text-dark dark:text-white mb-2">
              {t('maintenance.messageLabel') || (isRtl ? 'رسالة التوضيح للزوار' : 'Visitor Notice Message')}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={t('maintenance.placeholder') || (isRtl ? 'أدخل رسالة الصيانة هنا...' : 'Enter maintenance message...')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleSaveMessage}
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (t('maintenance.saving') || 'جاري الحفظ...') : (t('maintenance.saveMessage') || (isRtl ? 'حفظ الرسالة' : 'Save Message'))}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex-wrap gap-2">
              <span>{t('maintenance.adminBypassHint') || (isRtl ? 'ملاحظة: المدير يسجل الدخول دون تأثر بصفحة الصيانة' : 'Admins retain full access during maintenance')}</span>
              {maintenanceData?.updatedBy && (
                <span className="text-gray-400">{t('maintenance.lastUpdatedBy') || (isRtl ? 'آخر تحديث بواسطة:' : 'Last updated by:')} {maintenanceData.updatedBy}</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminPageShell>
  );
}
