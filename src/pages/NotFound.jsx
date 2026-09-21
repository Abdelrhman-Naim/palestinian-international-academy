import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const quickLinks = [
    {
      title: isRtl ? 'الدورات التدريبية' : 'Courses',
      desc: isRtl ? 'استكشف مساراتنا التعلمية' : 'Explore our learning tracks',
      icon: 'school',
      link: '/courses',
    },
    {
      title: isRtl ? 'المكتبة الرقمية' : 'Digital Library',
      desc: isRtl ? 'مئات الكتب والمراجع الأكاديمية' : 'Hundreds of books & references',
      icon: 'local_library',
      link: '/library',
    },
    {
      title: isRtl ? 'مركز الدعم الفني' : 'Support Center',
      desc: isRtl ? 'نحن هنا لمساعدتك دائماً' : 'We are here to help you anytime',
      icon: 'support_agent',
      link: '/support',
    },
    {
      title: isRtl ? 'لوحة التحكم' : 'Dashboard',
      desc: isRtl ? 'متابعة تقدمك التعليمي' : 'Track your learning progress',
      icon: 'dashboard',
      link: '/dashboard',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-950 font-alexandria transition-colors duration-300 relative overflow-hidden p-4 sm:p-8" dir={dir}>
      
      {/* Background Decorators */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-amber-500/20 dark:bg-amber-600/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-3xl py-8 flex flex-col items-center text-center">
        
        {/* Glow 404 Number */}
        <div className="relative group cursor-default mb-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary via-amber-500 to-orange-500 rounded-2xl blur-2xl opacity-25 group-hover:opacity-45 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <h1 className="relative text-[7rem] sm:text-[10rem] leading-none font-black font-headline-lg text-transparent bg-clip-text bg-gradient-to-br from-primary via-amber-500 to-orange-600 drop-shadow-sm select-none">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-3 max-w-lg">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {isRtl ? 'عذراً! الصفحة التي تبحث عنها غير موجودة' : 'Oops! Page Not Found'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {isRtl
              ? 'قد تكون كتبت العنوان بشكل خاطئ أو تم نقل الصفحة إلى مسار جديد. استخدم الأزرار أدناه للعودة.'
              : 'The page might have been removed, had its name changed, or is temporarily unavailable.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-primary hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>{isRtl ? 'العودة للرئيسية' : 'Go to Home'}</span>
          </Link>
          
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-[#E8E2D5] dark:border-gray-700 font-bold rounded-2xl hover:bg-[#FAF7F2] dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary hover:-translate-y-0.5 transition-all duration-300 shadow-sm text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_back</span>
            <span>{isRtl ? 'العودة للخلف' : 'Go Back'}</span>
          </button>
        </div>

        {/* Quick Links Section */}
        <div className="mt-12 w-full border-t border-[#E8E2D5] dark:border-gray-800 pt-8">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">
            {isRtl ? 'أو يمكنك زيارة إحدى الصفحات التالية:' : 'Or explore these popular sections:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.link}
                to={item.link}
                className="bg-white dark:bg-gray-800/80 border border-[#E8E2D5] dark:border-gray-700/80 rounded-2xl p-4 text-start hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-primary gap-1">
                  <span>{isRtl ? 'الانتقال' : 'Visit'}</span>
                  <span className="material-symbols-outlined text-sm rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs font-medium text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Platform. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;