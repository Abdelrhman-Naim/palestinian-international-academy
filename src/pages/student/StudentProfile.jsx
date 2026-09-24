import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CoursesContext';
import { useLanguage } from '../../context/LanguageContext';
import { auth, db, storage, doc, updateDoc } from '../../supabase/db';
import { supabase } from '../../supabase/client';
import { useSavedBooks } from '../../hooks/useSavedBooks';
import { Link } from 'react-router-dom';

export default function StudentProfile() {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const { currentUser, userData } = useAuth();
  const { courses } = useCourses();
  const { savedList } = useSavedBooks();
  const fileInputRef = useRef(null);

  // Enrolled courses count
  const enrolledCount = (userData?.enrolledCourses || []).length;
  const savedBooksCount = savedList.length || (userData?.savedBooks || []).length;

  // Personal info form state
  const [formData, setFormData] = useState({
    fullName: '',
    fullName_en: '',
    phone: '',
    bio: '',
    photoURL: ''
  });

  // Password form state
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Status feedback
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const [photoUploading, setPhotoUploading] = useState(false);
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.full_name || userData.fullName || userData.name || currentUser?.displayName || '',
        fullName_en: userData.fullName_en || userData.name_en || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        photoURL: userData.avatar_url || userData.photoURL || currentUser?.photoURL || ''
      });
    }
  }, [userData, currentUser]);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?.uid || userData?.id;
    if (!userId) return;

    setInfoSaving(true);
    // Validate phone if provided
    const phoneTrimmed = (formData.phone || '').trim();
    if (phoneTrimmed) {
      const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setInfoError(isRtl ? 'يرجى إدخال رقم هاتف صحيح (أرقام فقط)' : 'Please enter a valid phone number');
        setInfoSaving(false);
        return;
      }
    }

    setInfoSuccess('');
    setInfoError('');

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.fullName.trim(),
        phone: phoneTrimmed,
        bio: formData.bio.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (error) throw error;

      try {
        await supabase.auth.updateUser({
          data: { full_name: formData.fullName.trim() }
        });
      } catch (authErr) {}

      setInfoSuccess(isRtl ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully');
      setTimeout(() => setInfoSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating student profile:', err);
      setInfoError(isRtl ? 'حدث خطأ أثناء حفظ التغيرات.' : 'Failed to update profile.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (!pwdData.currentPassword) {
      setPwdError(isRtl ? 'يرجى إدخال كلمة المرور الحالية.' : 'Please enter your current password.');
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPwdError(isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف.' : 'Password must be at least 6 characters.');
      return;
    }

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdError(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }

    const email = currentUser?.email || userData?.email;
    if (!email) {
      setPwdError(isRtl ? 'تعذر التعرف على البريد الإلكتروني للحساب.' : 'User email not found.');
      return;
    }

    setPwdSaving(true);

    try {
      // 1. Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: pwdData.currentPassword
      });

      if (verifyError) {
        setPwdError(isRtl ? 'كلمة المرور الحالية غير صحيحة.' : 'Current password is incorrect.');
        return;
      }

      // 2. Update password
      const { error } = await supabase.auth.updateUser({
        password: pwdData.newPassword
      });

      if (error) throw error;

      setPwdSuccess(isRtl ? 'تم تغيير كلمة المرور بنجاح.' : 'Password changed successfully.');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPwdError(err.message || (isRtl ? 'فشل تغيير كلمة المرور. يرجى المحاولة لاحقاً.' : 'Failed to change password.'));
    } finally {
      setPwdSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    const userId = currentUser?.id || currentUser?.uid || userData?.id;
    if (!file || !userId) return;

    setPhotoUploading(true);
    setInfoError('');
    try {
      let downloadURL = '';
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const filePath = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          downloadURL = urlData?.publicUrl || '';
        }
      } catch (storageErr) {
        console.warn('Falling back to Data URL for avatar:', storageErr);
      }

      if (!downloadURL) {
        downloadURL = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      if (downloadURL) {
        await supabase.from('profiles').update({ avatar_url: downloadURL }).eq('id', userId);
        try {
          await supabase.auth.updateUser({ data: { avatar_url: downloadURL } });
        } catch (authErr) {}

        setFormData(prev => ({ ...prev, photoURL: downloadURL }));
        setInfoSuccess(isRtl ? 'تم تحديث الصورة الشخصية بنجاح' : 'Profile photo updated');
        setTimeout(() => setInfoSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setInfoError(isRtl ? 'فشل رفع الصورة.' : 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!currentUser?.email) return;
    setResetEmailSending(true);
    setResetEmailSuccess('');

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(currentUser.email);
      if (resetErr) throw resetErr;
      setResetEmailSuccess(isRtl ? 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' : 'Reset email sent.');
      setTimeout(() => setResetEmailSuccess(''), 5000);
    } catch (err) {
      console.error('Error sending reset email:', err);
      setInfoError(isRtl ? 'فشل إرسال رابط التعيين.' : 'Failed to send reset email.');
    } finally {
      setResetEmailSending(false);
    }
  };

  const displayName = lang === 'en'
    ? (formData.fullName_en || formData.fullName || 'Student')
    : (formData.fullName || 'طالب');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 min-h-full font-alexandria" dir={dir}>
      {/* Header Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E2D5] bg-gradient-to-br from-white via-[#FAF7F2] to-[#F3EFE6] p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-primary text-white flex items-center justify-center text-3xl font-black">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials || 'ST'}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute bottom-0 end-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer dark:bg-amber-500 dark:text-amber-950"
              title={isRtl ? 'تغيير الصورة' : 'Change photo'}
            >
              <span className="material-symbols-outlined text-lg">
                {photoUploading ? 'sync' : 'photo_camera'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 text-center sm:text-start space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-dark dark:text-white tracking-tight">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 dark:bg-amber-400/15 px-3 py-1 text-xs font-black text-primary dark:text-amber-400 border border-primary/20">
                <span className="material-symbols-outlined text-sm">school</span>
                {isRtl ? 'طالب معتمد' : 'Student'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {currentUser?.email}
            </p>

            {/* Quick Metrics */}
            <div className="pt-3 flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-gray-800/80 px-3.5 py-1.5 border border-[#E8E2D5] dark:border-gray-700">
                <span className="material-symbols-outlined text-primary dark:text-amber-400 text-lg">menu_book</span>
                <span className="text-xs font-bold text-dark dark:text-white">
                  {enrolledCount} {isRtl ? 'دورات مسجلة' : 'Enrolled Courses'}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-gray-800/80 px-3.5 py-1.5 border border-[#E8E2D5] dark:border-gray-700">
                <span className="material-symbols-outlined text-primary dark:text-amber-400 text-lg">bookmark</span>
                <span className="text-xs font-bold text-dark dark:text-white">
                  {savedBooksCount} {isRtl ? 'كتب محفوظة' : 'Saved Books'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Form */}
        <div className="lg:col-span-2 rounded-3xl border border-[#E8E2D5] bg-white p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between border-b border-[#E8E2D5]/60 dark:border-gray-700 pb-4">
            <h2 className="text-lg font-black text-dark dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-amber-400">person</span>
              {isRtl ? 'البيانات الشخصية' : 'Personal Details'}
            </h2>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-5">
            {infoSuccess && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{infoSuccess}</span>
              </div>
            )}
            {infoError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{infoError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-start">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-start">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
                </label>
                <input
                  type="text"
                  value={formData.fullName_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName_en: e.target.value }))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                {isRtl ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="tel"
                placeholder="+966 50 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-start">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                {isRtl ? 'نبذة عني (Bio)' : 'About Me'}
              </label>
              <textarea
                rows={3}
                placeholder={isRtl ? 'اكتب نبذة مختصرة عن اهتماماتك الأكاديمية...' : 'Short bio about your academic interests...'}
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={infoSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-secondary transition-colors dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                <span>{infoSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Form */}
        <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:bg-gray-800 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-[#E8E2D5]/60 dark:border-gray-700 pb-4">
              <h2 className="text-lg font-black text-dark dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-amber-400">shield_lock</span>
                {isRtl ? 'الأمان وكلمة المرور' : 'Security & Password'}
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwdSuccess && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3.5 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{pwdSuccess}</span>
                </div>
              )}
              {pwdError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="space-y-1 text-start">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={pwdData.currentPassword}
                    onChange={(e) => setPwdData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-2.5 pe-10 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(prev => !prev)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-lg">{showCurrentPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-2.5 pe-10 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(prev => !prev)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-lg">{showNewPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] dark:bg-gray-900 dark:border-gray-700 px-4 py-2.5 pe-10 text-sm text-dark dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(prev => !prev)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-lg">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={pwdSaving}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-secondary dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50"
              >
                {pwdSaving ? (isRtl ? 'جاري التعديل...' : 'Updating...') : (isRtl ? 'تحديث كلمة المرور' : 'Update Password')}
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-[#E8E2D5]/60 dark:border-gray-700 mt-6">
            {resetEmailSuccess && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">{resetEmailSuccess}</p>
            )}
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={resetEmailSending}
              className="w-full py-2.5 rounded-xl border border-[#E8E2D5] dark:border-gray-700 text-xs font-bold text-primary dark:text-amber-400 hover:bg-[#FAF7F2] dark:hover:bg-gray-900 transition-colors"
            >
              {resetEmailSending ? (isRtl ? 'جاري إرسال البريد...' : 'Sending email...') : (isRtl ? 'إرسال رابط إعادة تعيين للبريد الإلكتروني' : 'Send password reset link via email')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
