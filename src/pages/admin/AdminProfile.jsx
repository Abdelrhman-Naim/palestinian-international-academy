import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { auth, db, storage, doc, updateDoc, collection, getDocs } from '../../firebase/config';
import { supabase } from '../../supabase/client';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AdminProfile() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { currentUser, userData } = useAuth();
  const fileInputRef = useRef(null);

  // Platform stats counters with instant sessionStorage cache
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem('admin_profile_stats');
      return cached ? JSON.parse(cached) : { usersCount: 0, coursesCount: 0, booksCount: 0, pendingInstructors: 0 };
    } catch (e) {
      return { usersCount: 0, coursesCount: 0, booksCount: 0, pendingInstructors: 0 };
    }
  });

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

  // Status & Feedback messages
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const [photoUploading, setPhotoUploading] = useState(false);
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState('');

  // Fast parallel stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, uSnap, coursesRes, cSnap, booksRes, bSnap] = await Promise.all([
          supabase.from('profiles').select('id, email, role, status, is_approved'),
          getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
          supabase.from('courses').select('id'),
          getDocs(collection(db, 'courses')).catch(() => ({ size: 0 })),
          supabase.from('books').select('id'),
          getDocs(collection(db, 'books')).catch(() => ({ size: 0 }))
        ]);

        const profiles = profilesRes.data || [];
        const firestoreUsers = uSnap.docs ? uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];

        const mergedUsers = new Map();
        profiles.forEach(p => {
          const key = p.id || p.email;
          if (key) mergedUsers.set(key, p);
        });
        firestoreUsers.forEach(fu => {
          const key = fu.id || fu.email;
          if (key && !mergedUsers.has(key)) mergedUsers.set(key, fu);
        });

        let pending = 0;
        mergedUsers.forEach(u => {
          if (u.role === 'instructor' && (u.status === 'pending' || u.is_approved === false || u.is_approved === null)) {
            pending++;
          }
        });

        const totalCourses = Math.max(coursesRes.data?.length || 0, cSnap.size || 0);
        const totalBooks = Math.max(booksRes.data?.length || 0, bSnap.size || 0);

        const newStats = {
          usersCount: mergedUsers.size,
          coursesCount: totalCourses,
          booksCount: totalBooks,
          pendingInstructors: pending
        };

        setStats(newStats);
        try { sessionStorage.setItem('admin_profile_stats', JSON.stringify(newStats)); } catch (e) {}
      } catch (e) {
        console.warn('Error fetching admin profile stats:', e);
      }
    };
    fetchStats();
  }, []);

  // Populate form with current user data
  useEffect(() => {
    if (userData || currentUser) {
      setFormData({
        fullName: userData?.fullName || userData?.name || currentUser?.displayName || '',
        fullName_en: userData?.fullName_en || userData?.name_en || '',
        phone: userData?.phone || '',
        bio: userData?.bio || (isRtl ? 'مدير النظام الرئيسي' : 'System Administrator'),
        photoURL: userData?.photoURL || currentUser?.photoURL || ''
      });
    }
  }, [userData, currentUser, isRtl]);

  // Handle Profile Submit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const userId = currentUser?.id || currentUser?.uid || userData?.id;
    if (!userId) return;

    setInfoSaving(true);
    setInfoSuccess('');
    setInfoError('');

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (error) throw error;

      try {
        await supabase.auth.updateUser({
          data: { full_name: formData.fullName.trim() }
        });
      } catch (authErr) {
        console.warn('Could not update metadata on auth user:', authErr);
      }

      setInfoSuccess(isRtl ? 'تم تحديث بيانات الملف الشخصي بنجاح' : 'Profile updated successfully');
      setTimeout(() => setInfoSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating admin profile:', err);
      setInfoError(isRtl ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to update profile');
    } finally {
      setInfoSaving(false);
    }
  };

  // Handle Image Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    const userId = currentUser?.id || currentUser?.uid || userData?.id;
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      setInfoError(isRtl ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setInfoError(isRtl ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must be under 5MB');
      return;
    }

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
        setInfoSuccess(isRtl ? 'تم تحديث الصورة الشخصية بنجاح' : 'Avatar updated successfully');
        setTimeout(() => setInfoSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setInfoError(isRtl ? 'حدث خطأ أثناء رفع الصورة' : 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handle Password Submit
  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (pwdData.newPassword.length < 6) {
      setPwdError(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdError(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: pwdData.newPassword
      });

      if (error) throw error;

      setPwdSuccess(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      console.error('Password change error:', err);
      setPwdError(err.message || (isRtl ? 'فشل تغيير كلمة المرور. حاول مرة أخرى.' : 'Failed to change password. Please try again.'));
    } finally {
      setPwdSaving(false);
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async () => {
    const userEmail = currentUser?.email || userData?.email;
    if (!userEmail) return;
    setResetEmailSending(true);
    setResetEmailSuccess('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
      if (error) throw error;
      setResetEmailSuccess(isRtl ? `تم إرسال رابط إعادة الضبط إلى ${userEmail}` : `Reset link sent to ${userEmail}`);
      setTimeout(() => setResetEmailSuccess(''), 5000);
    } catch (err) {
      console.error('Reset email error:', err);
    } finally {
      setResetEmailSending(false);
    }
  };

  const displayName = formData.fullName || currentUser?.displayName || (isRtl ? 'مدير النظام' : 'Admin');
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'AD';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto font-alexandria transition-colors" dir={dir}>
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm transition-colors relative overflow-hidden">
        <div className="absolute top-0 end-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-1 text-center sm:text-start">
          {/* Avatar Area */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-stone-900 text-white flex items-center justify-center text-3xl font-bold shadow-xl border-2 border-primary/40 relative">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{initials}</span>
              )}
              {photoUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-2 -end-2 w-9 h-9 rounded-2xl bg-primary text-dark dark:text-gray-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-white dark:border-gray-800"
              title={isRtl ? 'تغيير الصورة الشخصية' : 'Change Avatar'}
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden" 
            />
          </div>

          {/* User Details & Badges */}
          <div className="grow">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white">{displayName}</h1>
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold font-label-caps border border-primary/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified_user</span>
                {isRtl ? 'مدير النظام' : 'Administrator'}
              </span>
            </div>

            <p className="text-stone-500 dark:text-gray-400 text-sm mb-4 font-medium">{currentUser?.email}</p>

            {/* Platform Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#FAF7F2] dark:bg-gray-900/60 p-3 rounded-2xl border border-[#E8E2D5] dark:border-gray-700/80">
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-bold mb-0.5">{isRtl ? 'المستخدمين' : 'Total Users'}</span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-400">{stats.usersCount}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-900/60 p-3 rounded-2xl border border-[#E8E2D5] dark:border-gray-700/80">
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-bold mb-0.5">{isRtl ? 'الدورات' : 'Courses'}</span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-400">{stats.coursesCount}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-900/60 p-3 rounded-2xl border border-[#E8E2D5] dark:border-gray-700/80">
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-bold mb-0.5">{isRtl ? 'الكتب' : 'Library Books'}</span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-400">{stats.booksCount}</span>
              </div>
              <div className="bg-[#FAF7F2] dark:bg-gray-900/60 p-3 rounded-2xl border border-[#E8E2D5] dark:border-gray-700/80">
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-bold mb-0.5">{isRtl ? 'طلبات الانضمام' : 'Pending Requests'}</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{stats.pendingInstructors}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details Form Card */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E2D5] dark:border-gray-700">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">person</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-dark dark:text-white">{isRtl ? 'البيانات الشخصية' : 'Personal Details'}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'تعديل اسم الحساب ورقم الهاتف والنبذة التعريفية' : 'Update your profile information'}</p>
            </div>
          </div>

          {infoSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{infoSuccess}</span>
            </div>
          )}

          {infoError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{infoError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
              </label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
              </label>
              <input 
                type="text" 
                value={formData.fullName_en}
                onChange={e => setFormData({ ...formData, fullName_en: e.target.value })}
                dir="ltr"
                className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 50 000 0000"
                dir="ltr"
                className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'المسمى الوظيفي / النبذة' : 'Bio / Title'}
              </label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={infoSaving}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-xl min-h-[48px] shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {infoSaving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  <span>{isRtl ? 'حفظ البيانات' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E2D5] dark:border-gray-700">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">lock</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-dark dark:text-white">{isRtl ? 'الأمان وكلمة المرور' : 'Security & Password'}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'تحديث كلمة مرور الحساب وإعدادات الأمان' : 'Change your account password'}</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{pwdError}</span>
            </div>
          )}

          {resetEmailSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>{resetEmailSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePwdSubmit} className="space-y-4 grow">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <div className="relative">
                <input 
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={pwdData.currentPassword}
                  onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  required
                  className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-lg">{showCurrentPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <input 
                  type={showNewPwd ? 'text' : 'password'}
                  value={pwdData.newPassword}
                  onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-lg">{showNewPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={pwdData.confirmPassword}
                  onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-dark dark:text-white outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-lg">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={pwdSaving}
              className="w-full bg-stone-900 dark:bg-gray-700 hover:bg-stone-800 dark:hover:bg-gray-600 text-white font-bold py-3.5 px-6 rounded-xl min-h-[48px] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto"
            >
              {pwdSaving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">key</span>
                  <span>{isRtl ? 'تحديث كلمة المرور' : 'Update Password'}</span>
                </>
              )}
            </button>
          </form>

          {/* Reset link fallback */}
          <div className="mt-6 pt-4 border-t border-[#E8E2D5] dark:border-gray-700 text-center">
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={resetEmailSending}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              {resetEmailSending ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'نسيت كلمة المرور؟ إرسال رابط إعادة الضبط بالبريد' : 'Forgot Password? Send reset link via email')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
