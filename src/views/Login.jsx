"use client";
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.webp';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Login = ({ defaultRole }) => {
  const { t, dir, toggleLang, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Forgot password modal state (AUTH-BUG-01 fix)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, currentUser, userRole, resetPassword } = useAuth();

  // Determine role based on defaultRole prop or URL path
  const role = defaultRole || (location.pathname?.startsWith('/login-trainer') ? 'instructor' : 'student');

  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userRole === 'instructor') {
        navigate('/instructor-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
      setEmailError(dir === 'rtl' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError(dir === 'rtl' ? 'يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com).' : 'Please enter a valid email address (e.g. name@example.com).');
        hasError = true;
      }
    }
    
    if (!password) {
      setPasswordError(dir === 'rtl' ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(dir === 'rtl' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await login(trimmedEmail, password);
      const actualRole = res?.role || userRole || role;
      if (actualRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (actualRole === 'instructor') {
        navigate('/instructor-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      const errMsg = err?.message || '';
      if (errMsg.includes('Email not confirmed')) {
        setError(dir === 'rtl' ? 'يرجى تفعيل حسابك من خلال رابط التفعيل المرسل إلى بريدك الإلكتروني.' : 'Please confirm your email via the link sent to your inbox.');
      } else if (errMsg === 'admin_unauthorized') {
        setError(dir === 'rtl' ? 'هذا الحساب مخصص للمسؤولين. يرجى الدخول من صفحة تسجيل دخول الإدارة.' : 'This account has administrator privileges. Please login from the admin portal.');
      } else {
        setError(dir === 'rtl' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const targetEmail = (forgotEmail || '').trim();
    if (!targetEmail) {
      setForgotError(dir === 'rtl' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setForgotError(dir === 'rtl' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const { error: resetErr } = await resetPassword(targetEmail);
      if (resetErr) throw resetErr;
      setForgotSuccess(
        dir === 'rtl'
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.'
          : 'Password reset email sent successfully.'
      );
    } catch (err) {
      console.error('Error resetting password:', err);
      setForgotError(
        dir === 'rtl'
          ? 'حدث خطأ أثناء إرسال البريد. يرجى التأكد من صحة البريد والمحاولة لاحقاً.'
          : (err.message || 'Failed to send reset link.')
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const isRtl = dir === 'rtl';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-[#FAF7F2] dark:bg-gray-900 font-alexandria transition-colors relative" dir={dir}>
      <SEO
        title={role === 'instructor' 
          ? (isRtl ? 'تسجيل دخول المدربين | أكاديمية فلسطين الدولية' : 'Instructor Login | Palestinian International Academy')
          : (isRtl ? 'تسجيل دخول الطلاب | أكاديمية فلسطين الدولية' : 'Student Login | Palestinian International Academy')}
        description={isRtl ? 'بوابة تسجيل الدخول لمنصة أكاديمية فلسطين الدولية للوصول إلى الدورات والمحاضرات والمكتبة الرقمية.' : 'Sign in to Palestinian International Academy to access your courses and library.'}
        canonical={location.pathname}
      />
      <div className="w-full max-w-5xl bg-white border border-[#E8E2D5] dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row transition-colors">
        
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-1/2 text-dark dark:text-white p-10 flex-col justify-center items-center text-center relative overflow-hidden bg-gradient-to-br from-[#FAF7F2] via-[#F3EFE6] to-[#E8E2D5] dark:from-black dark:via-gray-900 dark:to-[#4a3820] border-e border-[#E8E2D5] dark:border-gray-700">
          <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto">
            <div className="flex-1 flex items-center justify-center w-full mb-12">
              <img src={logo?.src || logo} alt="Logo" className="w-full max-w-sm lg:max-w-md h-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" />
            </div>
            <div className="mt-auto">
              <h2 className="text-2xl lg:text-3xl font-extrabold mb-4 font-headline-lg leading-relaxed tracking-tight text-dark dark:text-white">
                {t('login.heroTitle')}
              </h2>
              <p className="text-base lg:text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('login.heroSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <section className="w-full lg:w-1/2 p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          {/* Language Switcher Button */}
          <div className="absolute top-4 sm:top-6 end-4 sm:end-6">
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-amber-400 transition-colors cursor-pointer shadow-xs"
              title={lang === 'ar' ? 'English' : 'عربي'}
            >
              <span className="material-symbols-outlined text-sm">language</span>
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>
          </div>

          <div className="w-full max-w-sm mx-auto">
            
            <div className="mb-10 text-center">
              <Link to="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
                <img src={logo?.src || logo} alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)" className="h-16 w-auto object-contain rounded-xl drop-shadow-lg transition-transform duration-300 hover:scale-105" />
              </Link>
              <h1 className="text-3xl font-extrabold text-dark dark:text-white mb-2 transition-colors">{t('login.welcome')}</h1>
              <p className="text-text-main dark:text-gray-400 transition-colors text-sm">{t('login.chooseAccount')}</p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex bg-[#F3EFE6] dark:bg-gray-700 p-1 rounded-xl mb-8 border border-[#E8E2D5] dark:border-gray-600">
              <Link 
                to="/login"
                onClick={() => setError('')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg text-center transition-all ${role === 'student' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-dark dark:hover:text-white'}`}
              >
                {t('common.students')}
              </Link>
              <Link 
                to="/login-trainer"
                onClick={() => setError('')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg text-center transition-all ${role === 'instructor' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-dark dark:hover:text-white'}`}
              >
                {t('instructorOverview.instructor')}
              </Link>
            </div>
            
            <form onSubmit={handleLogin} noValidate className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="email">{t('register.email')}</label>
                <input 
                  className={`w-full bg-[#FAF7F2] dark:bg-gray-700 border ${emailError ? 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500' : 'border-[#E8E2D5] dark:border-gray-600 focus:ring-primary'} text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:border-transparent transition-all dark:placeholder-gray-400`}
                  id="email" 
                  required 
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
                />
                {emailError && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{emailError}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="password">{t('adminLogin.password')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email ? email.trim() : '');
                      setShowForgotModal(true);
                      setForgotSuccess('');
                      setForgotError('');
                    }}
                    className="text-sm text-primary hover:underline font-bold transition-colors cursor-pointer"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    className={`w-full bg-[#FAF7F2] dark:bg-gray-700 border ${passwordError ? 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500' : 'border-[#E8E2D5] dark:border-gray-600 focus:ring-primary'} text-dark dark:text-white rounded-xl py-3 px-4 pe-11 focus:outline-none focus:border-transparent transition-all dark:placeholder-gray-400`}
                    id="password" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(''); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center justify-center cursor-pointer"
                    aria-label={showPassword ? (dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password') : (dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password')}
                    title={showPassword ? (dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password') : (dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password')}
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>
              
              <button 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary hover:bg-secondary cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" 
                type="submit"
              >
                {t('login.signIn')}
              </button>
            </form>
            
            <p className="text-center text-sm text-text-main dark:text-gray-400 mt-8 transition-colors">
              {t('login.noAccount')} <Link className="font-bold text-primary hover:text-secondary transition-colors" to="/register">{t('login.signUpNow')}</Link>
            </p>
          </div>
        </section>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 inset-s-4 text-gray-400 hover:text-dark dark:hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              aria-label={dir === 'rtl' ? 'إغلاق' : 'Close'}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 dark:bg-amber-400/10 dark:text-amber-400">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <h3 className="text-xl font-extrabold text-dark dark:text-white mb-1">
                {dir === 'rtl' ? 'استعادة كلمة المرور' : 'Reset Password'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {dir === 'rtl' ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين.' : 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {forgotSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs sm:text-sm font-bold border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl text-xs sm:text-sm font-bold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{forgotError}</span>
                </div>
              )}

              <div className="space-y-1.5 text-start">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="forgot-email">
                  {t('register.email')}
                </label>
                <input
                  id="forgot-email"
                  required
                  type="email"
                  placeholder="example@domain.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel') || 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-secondary dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50"
                >
                  {forgotLoading ? (dir === 'rtl' ? 'جاري الإرسال...' : 'Sending...') : (dir === 'rtl' ? 'إرسال الرابط' : 'Send Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

