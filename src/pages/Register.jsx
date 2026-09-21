import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t, dir } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const isPasswordTooShort = password.length > 0 && password.length < 6;
  const isPasswordMismatch = (confirmTouched || confirmPassword.length > 0) && password !== confirmPassword;
  const isPasswordMatchSuccess = (confirmTouched || confirmPassword.length > 0) && password.length >= 6 && password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setConfirmTouched(true);

    if (!fullName.trim()) {
      setError(dir === 'rtl' ? 'يرجى إدخال الاسم الكامل.' : 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError(dir === 'rtl' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError(t('register.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await register(email, password, fullName, role);
      setSuccess(true);
      if (role === 'student') {
        setTimeout(() => navigate('/login'), 1500);
      } else {
        // Instructor: stay on success page, no redirect (they need admin approval)
        setTimeout(() => navigate('/login-trainer'), 1500);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('register.emailExists'));
      } else {
        setError(dir === 'rtl' ? 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.' : 'An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-[#FAF7F2] dark:bg-gray-900 font-alexandria transition-colors" dir={dir}>
      <main className="w-full max-w-250 bg-white border border-[#E8E2D5] dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row transition-colors">
        
        {/* Left Side */}
        <div className="hidden lg:flex w-1/2 text-dark dark:text-white p-12 flex-col justify-center items-center text-center relative overflow-hidden bg-gradient-to-br from-[#FAF7F2] via-[#F3EFE6] to-[#E8E2D5] dark:from-black dark:via-gray-900 dark:to-[#4a3820] border-e border-[#E8E2D5] dark:border-gray-700">
          <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto">
            <div className="flex-1 flex items-center justify-center w-full mb-12">
              <img src={logo} alt="Logo" className="w-full max-w-sm lg:max-w-md h-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" />
            </div>
            <div className="mt-auto">
              <h2 className="text-2xl lg:text-3xl font-extrabold mb-4 font-headline-lg leading-relaxed tracking-tight text-dark dark:text-white">
                {t('register.heroTitle')}
              </h2>
              <p className="text-base lg:text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('register.heroSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <section className="w-full lg:w-1/2 p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            
            <div className="mb-8 text-center">
              <Link to="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
                <img src={logo} alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)" className="h-16 w-auto object-contain rounded-xl drop-shadow-lg transition-transform duration-300 hover:scale-105" />
              </Link>
              <h1 className="text-3xl font-extrabold text-dark dark:text-white mb-2 transition-colors">{t('register.title')}</h1>
              <p className="text-text-main dark:text-gray-400 transition-colors text-sm">{t('register.subtitle')}</p>
            </div>

            {/* Role Switcher Tabs (AUTH-BUG-04 fix) */}
            <div className="space-y-1.5 mb-6 text-start">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                {dir === 'rtl' ? 'اختر نوع الحساب:' : 'Select Account Type:'}
              </label>
              <div role="tablist" aria-label={dir === 'rtl' ? 'نوع الحساب' : 'Account Type'} className="grid grid-cols-2 gap-2 bg-[#F3EFE6] dark:bg-gray-900 p-1.5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700">
                <button 
                  type="button"
                  role="tab"
                  aria-selected={role === 'student'}
                  onClick={() => setRole('student')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'student' 
                      ? 'bg-primary text-white shadow-md shadow-primary/25 border-2 border-primary ring-2 ring-primary/20 dark:bg-amber-500 dark:text-amber-950 dark:border-amber-400 dark:ring-amber-400/30 scale-[1.02]' 
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {role === 'student' ? 'check_circle' : 'school'}
                  </span>
                  <span>{t('common.students')}</span>
                </button>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={role === 'instructor'}
                  onClick={() => setRole('instructor')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'instructor' 
                      ? 'bg-primary text-white shadow-md shadow-primary/25 border-2 border-primary ring-2 ring-primary/20 dark:bg-amber-500 dark:text-amber-950 dark:border-amber-400 dark:ring-amber-400/30 scale-[1.02]' 
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-dark dark:hover:text-white border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {role === 'instructor' ? 'check_circle' : 'badge'}
                  </span>
                  <span>{t('instructorOverview.instructor')}</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm font-bold border border-emerald-200">
                  {role === 'student' 
                    ? t('register.successStudent')
                    : t('register.successInstructor')
                  }
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="fullName">{t('register.fullName')}</label>
                <input 
                  className="w-full bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:placeholder-gray-400" 
                  id="fullName" 
                  required 
                  type="text"
                  placeholder={t('register.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="regEmail">{t('register.email')}</label>
                <input 
                  className="w-full bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:placeholder-gray-400" 
                  id="regEmail" 
                  required 
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="regPassword">{t('adminLogin.password')}</label>
                <input 
                  className={`w-full bg-[#FAF7F2] dark:bg-gray-700 border text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 transition-all dark:placeholder-gray-400 ${
                    isPasswordTooShort 
                      ? 'border-amber-500 focus:ring-amber-500 focus:border-amber-500' 
                      : 'border-[#E8E2D5] dark:border-gray-600 focus:ring-primary focus:border-transparent'
                  }`} 
                  id="regPassword" 
                  required 
                  type="password"
                  placeholder={t('register.passwordHint')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isPasswordTooShort && (
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{t('register.passwordMinLength')}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-dark dark:text-gray-200 transition-colors" htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
                <input 
                  className={`w-full bg-[#FAF7F2] dark:bg-gray-700 border text-dark dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 transition-all dark:placeholder-gray-400 ${
                    isPasswordMismatch 
                      ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20' 
                      : isPasswordMatchSuccess
                      ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-[#E8E2D5] dark:border-gray-600 focus:ring-primary focus:border-transparent'
                  }`} 
                  id="confirmPassword" 
                  required 
                  type="password"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (!confirmTouched) setConfirmTouched(true);
                  }}
                  onBlur={() => setConfirmTouched(true)}
                />
                
                {/* Inline Validation Warnings */}
                {isPasswordMismatch && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{t('register.passwordMismatch')}</span>
                  </p>
                )}

                {isPasswordMatchSuccess && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{dir === 'rtl' ? 'كلمتا المرور متطابقتان ✓' : 'Passwords match ✓'}</span>
                  </p>
                )}
              </div>
              
              <button 
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition-colors ${loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-primary hover:bg-orange-700'}`} 
                type="submit"
                disabled={loading}
              >
                {loading ? '...' : t('register.createAccount')}
              </button>
            </form>
            

            
            <p className="text-center text-sm text-text-main dark:text-gray-400 mt-8 transition-colors">
              {t('register.hasAccount')} <Link className="font-bold text-primary hover:text-secondary transition-colors" to="/login">{t('register.logIn')}</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;


