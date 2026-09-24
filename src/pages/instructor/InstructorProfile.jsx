import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CoursesContext';
import { useLanguage } from '../../context/LanguageContext';
import { isCourseOwnedByInstructor } from '../../utils/courseUtils';
import { auth, db, storage, doc, updateDoc } from '../../supabase/db';
import { supabase } from '../../supabase/client';
import { Link } from 'react-router-dom';

export default function InstructorProfile() {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const { currentUser, userData, resetPassword } = useAuth();
  const { courses } = useCourses();
  const fileInputRef = useRef(null);

  // Instructor's courses
  const myCourses = courses.filter(c => isCourseOwnedByInstructor(c, currentUser, userData));
  const totalStudents = myCourses.reduce((acc, c) => acc + (c.students || 0), 0);
  const avgRating = myCourses.length > 0 
    ? (myCourses.reduce((acc, c) => acc + (Number(c.ratingAverage ?? c.rating) || 0), 0) / myCourses.length).toFixed(1)
    : '0.0';

  // Personal info form state
  const [formData, setFormData] = useState({
    fullName: '',
    fullName_en: '',
    phone: '',
    field: '',
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

  // Status and feedback states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Sync user data to form
  useEffect(() => {
    if (userData || currentUser) {
      setFormData({
        fullName: userData?.full_name || userData?.name || userData?.fullName || currentUser?.displayName || '',
        fullName_en: userData?.name_en || userData?.fullName_en || '',
        phone: userData?.phone || '',
        field: userData?.specialization || userData?.field || '',
        bio: userData?.bio || '',
        photoURL: userData?.avatar_url || userData?.photoURL || currentUser?.photoURL || ''
      });
    }
  }, [userData, currentUser]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwdData(prev => ({ ...prev, [name]: value }));
  };

  // Upload or change avatar photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({
        type: 'error',
        text: isRtl ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت' : 'Image size too large, please select under 5MB'
      });
      return;
    }

    setUploadingPhoto(true);
    setProfileMessage({ type: '', text: '' });

    try {
      let downloadUrl = '';
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}.${fileExt}`);
        const uploadTask = uploadBytes(storageRef, file).then(snap => getDownloadURL(snap.ref));
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        downloadUrl = await Promise.race([uploadTask, timeout]);
      } catch (storageErr) {
        console.warn('Falling back to Data URL for avatar:', storageErr);
        downloadUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      if (downloadUrl) {
        setFormData(prev => ({ ...prev, photoURL: downloadUrl }));
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photoURL: downloadUrl,
          updatedAt: new Date().toISOString()
        });
        try {
          await updateProfile(auth.currentUser, { photoURL: downloadUrl });
        } catch (authErr) {
          console.warn('Could not update photoURL on auth user:', authErr);
        }
        setProfileMessage({
          type: 'success',
          text: isRtl ? 'تم تحديث الصورة الشخصية بنجاح' : 'Profile photo updated successfully'
        });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setProfileMessage({
        type: 'error',
        text: isRtl ? 'حدث خطأ أثناء رفع الصورة، يرجى المحاولة لاحقاً' : 'Error uploading photo, please try again'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser?.uid) return;
    setFormData(prev => ({ ...prev, photoURL: '' }));
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: '',
        updatedAt: new Date().toISOString()
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: '' });
      }
      setProfileMessage({
        type: 'success',
        text: isRtl ? 'تم حذف الصورة الشخصية' : 'Profile photo removed'
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  };

  // Save personal & professional profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setProfileMessage({
        type: 'error',
        text: t('instructorProfile.nameRequired')
      });
      return;
    }

    // Validate phone if provided
    const phoneTrimmed = (formData.phone || '').trim();
    if (phoneTrimmed) {
      const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setProfileMessage({
          type: 'error',
          text: isRtl ? 'يرجى إدخال رقم هاتف صحيح (أرقام فقط)' : 'Please enter a valid phone number'
        });
        return;
      }
    }

    setSavingProfile(true);
    setProfileMessage({ type: '', text: '' });

    const userId = currentUser?.id || currentUser?.uid || userData?.id;
    if (!userId) return;

    try {
      const updatePayload = {
        full_name: formData.fullName.trim(),
        phone: phoneTrimmed,
        specialization: formData.field.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.photoURL || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (error) throw error;

      try {
        await supabase.auth.updateUser({
          data: { full_name: formData.fullName.trim(), avatar_url: formData.photoURL || '' }
        });
      } catch (authErr) {}

      setProfileMessage({
        type: 'success',
        text: t('instructorProfile.profileUpdated')
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Error updating instructor profile:', err);
      setProfileMessage({
        type: 'error',
        text: isRtl ? 'حدث خطأ أثناء حفظ التغييرات، يرجى المحاولة ثانية' : 'Error updating profile, please try again'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password with strict current password verification
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!pwdData.currentPassword) {
      setPasswordMessage({
        type: 'error',
        text: isRtl ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter your current password'
      });
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: t('instructorProfile.passwordTooShort')
      });
      return;
    }

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: t('instructorProfile.passwordMismatch')
      });
      return;
    }

    const email = currentUser?.email || userData?.email;
    if (!email) {
      setPasswordMessage({
        type: 'error',
        text: isRtl ? 'تعذر التعرف على البريد الإلكتروني للحساب' : 'Account email not found'
      });
      return;
    }

    setSavingPassword(true);

    try {
      // 1. Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: pwdData.currentPassword
      });

      if (verifyError) {
        setPasswordMessage({
          type: 'error',
          text: isRtl ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect'
        });
        return;
      }

      // 2. Update password
      const { error } = await supabase.auth.updateUser({
        password: pwdData.newPassword
      });

      if (error) throw error;

      setPasswordMessage({
        type: 'success',
        text: t('instructorProfile.passwordUpdated')
      });
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordMessage({
        type: 'error',
        text: err.message || (isRtl ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error updating password')
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Send password reset email
  const handleSendResetEmail = async () => {
    const email = currentUser?.email || userData?.email;
    if (!email) return;

    setSendingReset(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      if (resetPassword) {
        await resetPassword(email);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`
        });
        if (error) throw error;
      }
      setPasswordMessage({
        type: 'success',
        text: isRtl ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك بنجاح' : 'Password reset link sent to your email successfully'
      });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 6000);
    } catch (err) {
      console.error('Error sending reset email:', err);
      setPasswordMessage({
        type: 'error',
        text: isRtl ? 'تعذر إرسال الرابط، يرجى المحاولة لاحقاً' : 'Could not send reset link, try again later'
      });
    } finally {
      setSendingReset(false);
    }
  };

  // Format joined date
  const rawJoined = userData?.created_at || userData?.createdAt || currentUser?.created_at;
  const joinedDate = rawJoined 
    ? (rawJoined.toDate ? rawJoined.toDate().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
       : new Date(rawJoined).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
    : '—';

  const initials = (formData.fullName || currentUser?.email || 'IN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div dir={dir} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= Header & Breadcrumb ================= */}
        <div className="border-b border-[#E8E2D5] dark:border-gray-700 pb-6 transition-colors">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <Link to="/instructor-dashboard" className="hover:text-primary transition-colors">
              {t('instructorDashboard.overview')}
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">{t('instructorProfile.title')}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-dark dark:text-white flex items-center gap-2.5">
                <span className="material-symbols-outlined text-3xl text-primary">account_circle</span>
                <span>{t('instructorProfile.title')}</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('instructorProfile.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* ================= Profile Hero Card ================= */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 p-6 md:p-8 shadow-sm transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-500" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar with edit trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white flex items-center justify-center text-3xl md:text-4xl font-extrabold shadow-lg overflow-hidden border-4 border-white dark:border-gray-800">
                {formData.photoURL ? (
                  <img 
                    src={formData.photoURL} 
                    alt={formData.fullName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title={t('instructorProfile.changePhoto')}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-primary hover:bg-secondary text-white shadow-md flex items-center justify-center transition-all hover:scale-105 border-2 border-white dark:border-gray-800"
              >
                {uploadingPhoto ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                )}
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-right space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl font-bold text-dark dark:text-white">
                  {lang === 'en' && formData.fullName_en ? formData.fullName_en : formData.fullName || t('instructorOverview.instructor')}
                </h2>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>{t('instructorProfile.instructorBadge')}</span>
                </span>
              </div>

              <p className="text-sm font-semibold text-primary">
                {formData.field || (isRtl ? 'مدرب ومحاضر معتمد' : 'Certified Instructor')}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  <span>{currentUser?.email}</span>
                </span>
                {formData.phone && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span dir="ltr">{formData.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>{t('instructorProfile.memberSince')}: {joinedDate}</span>
                </span>
              </div>

              {formData.photoURL && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-rose-500 hover:text-rose-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                    <span>{t('instructorProfile.removePhoto')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#E8E2D5] dark:border-gray-700">
              <div className="bg-[#FAF7F2] dark:bg-gray-700/50 p-3 rounded-2xl text-center border border-[#E8E2D5] dark:border-gray-600 min-w-20">
                <span className="block text-xl font-extrabold text-primary">{myCourses.length}</span>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{t('instructorProfile.statsCourses')}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-700/50 p-3 rounded-2xl text-center border border-[#E8E2D5] dark:border-gray-600 min-w-20">
                <span className="block text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalStudents}</span>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{t('instructorProfile.statsStudents')}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-700/50 p-3 rounded-2xl text-center border border-[#E8E2D5] dark:border-gray-600 min-w-20">
                <span className="block text-xl font-extrabold text-amber-500">{avgRating}</span>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{t('instructorProfile.statsRating')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* ================= Forms Grid ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= SECTION 1: PERSONAL & PROFESSIONAL INFO (2 cols) ================= */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 p-6 md:p-8 shadow-sm transition-colors">
            
            <div className="flex items-center gap-2.5 pb-5 mb-6 border-b border-[#E8E2D5] dark:border-gray-700">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">badge</span>
              </span>
              <div>
                <h2 className="text-lg font-bold text-dark dark:text-white">
                  {t('instructorProfile.personalInfo')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRtl ? 'بيانات هويتك وظهورك أمام الطلاب والإدارة' : 'Your identity details shown to students and administrators'}
                </p>
              </div>
            </div>

            {/* Profile Alert Message */}
            {profileMessage.text && (
              <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2.5 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                <span className="material-symbols-outlined text-lg">
                  {profileMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Names row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t('instructorProfile.fullNameAr')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                      person
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleProfileChange}
                      required
                      placeholder={isRtl ? 'مثال: م. أحمد محمد' : 'e.g. Eng. Ahmed'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 pr-10 pl-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t('instructorProfile.fullNameEn')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                      language
                    </span>
                    <input
                      type="text"
                      name="fullName_en"
                      value={formData.fullName_en}
                      onChange={handleProfileChange}
                      placeholder="e.g. Eng. Ahmed Mohamed"
                      dir="ltr"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 pr-10 pl-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t('instructorProfile.email')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                      mail
                    </span>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      dir="ltr"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 pr-10 pl-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed font-medium text-left"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t('instructorProfile.emailNotice')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t('instructorProfile.phone')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                      call
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      placeholder={isRtl ? 'مثال: 0591234567' : 'e.g. +970591234567'}
                      dir="ltr"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 pr-10 pl-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Specialization / Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('instructorProfile.field')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                    school
                  </span>
                  <input
                    type="text"
                    name="field"
                    value={formData.field}
                    onChange={handleProfileChange}
                    placeholder={t('instructorProfile.fieldPlaceholder')}
                    className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 pr-10 pl-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('instructorProfile.bio')}
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleProfileChange}
                  placeholder={t('instructorProfile.bioPlaceholder')}
                  className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 p-4 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('instructorProfile.saving')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      <span>{t('instructorProfile.saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ================= SECTION 2: SECURITY & PASSWORD (1 col) ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 p-6 md:p-8 shadow-sm transition-colors flex flex-col justify-between">
            
            <div>
              <div className="flex items-center gap-2.5 pb-5 mb-6 border-b border-[#E8E2D5] dark:border-gray-700">
                <span className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-dark dark:text-white">
                    {t('instructorProfile.securityInfo')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRtl ? 'حماية الحساب وتغيير كلمة المرور' : 'Account protection & credentials'}
                  </p>
                </div>
              </div>

              {/* Password Message */}
              {passwordMessage.text && (
                <div className={`p-3.5 rounded-2xl mb-5 text-xs font-bold flex items-start gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                    {passwordMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                
                {/* Current password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('instructorProfile.currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      name="currentPassword"
                      value={pwdData.currentPassword}
                      onChange={handlePwdChange}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-2.5 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showCurrentPwd ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('instructorProfile.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      name="newPassword"
                      value={pwdData.newPassword}
                      onChange={handlePwdChange}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-2.5 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showNewPwd ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('instructorProfile.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      name="confirmPassword"
                      value={pwdData.confirmPassword}
                      onChange={handlePwdChange}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-2.5 text-sm text-dark dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPwd ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('instructorProfile.updatingPassword')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">key</span>
                      <span>{t('instructorProfile.updatePassword')}</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* Alternative: Send reset link */}
            <div className="pt-6 mt-6 border-t border-[#E8E2D5] dark:border-gray-700 text-center">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
                {t('instructorProfile.orSendResetEmail')}
              </p>
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={sendingReset}
                className="w-full py-2 px-3 rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {sendingReset ? (
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm text-primary">send</span>
                )}
                <span>{t('instructorProfile.sendResetLink')}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
