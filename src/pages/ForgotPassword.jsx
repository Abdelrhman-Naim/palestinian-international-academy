import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.png';

export default function ForgotPassword() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;

      setSuccessMsg(
        t('forgotPasswordPage.successMsg') ||
          (isRtl
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد أو البريد العشوائي (Junk/Spam).'
            : 'A password reset link has been sent to your email. Please check your inbox or spam folder.')
      );
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/invalid-email') {
        setErrorMsg(
          t('forgotPasswordPage.invalidEmail') ||
            (isRtl ? 'يرجى إدخال عنوان بريد إلكتروني صحيح.' : 'Please enter a valid email address.')
        );
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg(
          t('forgotPasswordPage.userNotFound') ||
            (isRtl ? 'لم نتمكن من العثور على حساب مرتبك بهذا البريد الإلكتروني.' : 'No account found with this email address.')
        );
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg(
          t('forgotPasswordPage.tooManyRequests') ||
            (isRtl ? 'تم إجراء عدد كبير من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.' : 'Too many attempts. Please try again later.')
        );
      } else {
        setErrorMsg(
          t('forgotPasswordPage.generalError') ||
            (isRtl ? 'حدث خطأ غير متوقع أثناء إرسال البريد. يرجى المحاولة لاحقاً.' : 'An error occurred. Please try again later.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-gray-900 font-alexandria transition-colors" dir={dir}>
      <main className="w-full max-w-md bg-white border border-[#E8E2D5] dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-xl p-6 sm:p-8 relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <img src={logo} alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)" className="h-14 w-auto object-contain rounded-xl drop-shadow-md mx-auto" />
          </Link>

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <i className="fa-solid fa-key text-xl"></i>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mb-2">
            {t('forgotPasswordPage.title') || (isRtl ? 'استعادة كلمة المرور' : 'Reset Password')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('forgotPasswordPage.subtitle') || (isRtl ? 'أدخل بريدك الإلكتروني المكتتب لدينا وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.' : 'Enter your registered email address and we will send you a password reset link.')}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
              <i className="fa-solid fa-circle-check text-base shrink-0 mt-0.5"></i>
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs sm:text-sm font-bold border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-base shrink-0 mt-0.5"></i>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2 text-start">
            <label className="block text-sm font-bold text-dark dark:text-gray-200" htmlFor="reset-email">
              {t('register.email')}
            </label>
            <input
              id="reset-email"
              type="email"
              required
              placeholder={t('forgotPasswordPage.emailPlaceholder') || "example@domain.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm dark:placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-primary hover:bg-secondary cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>{t('forgotPasswordPage.sending') || (isRtl ? 'جاري إرسال الرابط...' : 'Sending...')}</span>
              </>
            ) : (
              <span>{t('forgotPasswordPage.submitBtn') || (isRtl ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-4 border-t border-[#E8E2D5] dark:border-gray-700">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors"
          >
            <i className={`fa-solid ${isRtl ? 'fa-arrow-right' : 'fa-arrow-left'} text-xs`}></i>
            <span>{t('forgotPasswordPage.backToLogin') || (isRtl ? 'العودة لصفحة تسجيل الدخول' : 'Back to Login')}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
