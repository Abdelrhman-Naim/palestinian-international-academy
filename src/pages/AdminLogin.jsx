import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

const AdminLogin = () => {
  const { t, dir } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    setLoading(true);
    try {
      await login(username, password, 'admin');
      navigate('/admin-dashboard');
    } catch (err) {
      if (err.message === 'role_mismatch') {
        setError(t('adminLogin.notAdmin'));
      } else {
        setError(t('adminLogin.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail?.trim()) {
      setForgotError(dir === 'rtl' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      return;
    }

    setForgotLoading(true);
    try {
      if (resetPassword) {
        await resetPassword(forgotEmail.trim());
      }
      setForgotSuccess(t('adminLogin.resetSuccess'));
    } catch (err) {
      console.warn('Password reset error:', err);
      setForgotError(t('adminLogin.resetError'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-gray-950 font-alexandria transition-colors relative" dir={dir}>
      
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none opacity-60 hidden dark:block"></div>
      
      <main className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group mb-5">
            <img src={logo} alt="Logo" className="h-16 sm:h-20 w-auto object-contain rounded-2xl drop-shadow-xl group-hover:scale-105 transition-transform duration-300" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight mb-2 font-headline-md">{t('adminLogin.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-label-caps tracking-widest uppercase">{t('adminLogin.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white shadow-xl border border-[#E8E2D5] dark:bg-gray-900 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
          
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <h2 className="text-xl font-extrabold text-dark dark:text-white mb-1">{t('adminLogin.panelTitle')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">{t('adminLogin.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl text-xs sm:text-sm font-bold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-start">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="admin-user">
                {t('adminLogin.username')}
              </label>
              <input
                className="w-full bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400 text-sm"
                id="admin-user"
                required
                type="text"
                placeholder="admin@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 text-start">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="admin-pass">
                  {t('adminLogin.password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(username.includes('@') ? username : '');
                    setForgotSuccess('');
                    setForgotError('');
                  }}
                  className="text-xs text-primary hover:underline font-bold transition-colors cursor-pointer"
                >
                  {t('adminLogin.forgotPassword')}
                </button>
              </div>

              <div className="relative">
                <input
                  className="w-full bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white rounded-xl py-3 px-4 pe-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400 text-sm"
                  id="admin-pass"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label={showPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                  title={showPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm sm:text-base font-bold text-white transition-all cursor-pointer ${
                loading ? 'bg-primary/70 cursor-not-allowed opacity-80' : 'bg-primary hover:bg-orange-700 active:scale-[0.99]'
              }`}
              type="submit"
              disabled={loading}
              aria-label={t('adminLogin.loginButton')}
              title={t('adminLogin.loginButton')}
            >
              <span className="material-symbols-outlined text-lg">
                {loading ? 'sync' : 'login'}
              </span>
              <span>{loading ? t('adminLogin.loggingIn') : t('adminLogin.loginButton')}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link className="font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors" to="/">
            {t('adminLogin.backHome')}
          </Link>
        </p>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 sm:p-7 shadow-2xl dark:border-gray-700 dark:bg-gray-800 transition-colors relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute end-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={t('common.close') || 'إغلاق'}
              title={t('common.close') || 'إغلاق'}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>

            <h3 className="text-center text-lg sm:text-xl font-bold text-dark dark:text-white">
              {t('adminLogin.resetPasswordTitle')}
            </h3>
            <p className="mt-2 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('adminLogin.resetPasswordDesc')}
            </p>

            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              {forgotSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{forgotError}</span>
                </div>
              )}

              <div className="text-start space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300" htmlFor="forgot-email">
                  {t('register.email')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-gray-900 border border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  aria-label={t('adminLogin.sendResetLink')}
                >
                  {forgotLoading ? (
                    <span>{t('adminLogin.sendingResetLink')}</span>
                  ) : (
                    <span>{t('adminLogin.sendResetLink')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;

