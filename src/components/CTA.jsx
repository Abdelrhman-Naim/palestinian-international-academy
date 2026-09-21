import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CTA = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  return (
    <section className="w-full py-24 px-4 md:px-8 bg-[#F3EFE6] dark:bg-gray-900 transition-colors border-t border-[#E8E2D5] dark:border-gray-800" dir={dir}>
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative shadow-sm border border-[#E8E2D5] dark:border-gray-700">
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center">
          
          {/* Quick Registration Form Side */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 order-2 lg:order-1">
            <div className="bg-[#FAF7F2] dark:bg-gray-900/60 rounded-3xl p-8 shadow-sm border border-[#E8E2D5] dark:border-gray-700">
              <h3 className="font-headline-md font-bold text-xl text-dark dark:text-white mb-2 text-center">
                {t('cta.startAcademicAccount')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs text-center mb-6">
                {t('cta.joinInstantAccess')}
              </p>
                <Link
                  to="/register"
                  className="w-full bg-primary hover:bg-amber-500 text-dark dark:text-gray-950 font-bold text-sm px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer min-h-12"
                >
                  <span>{t("cta.createAccount")}</span>
                  <span className="material-symbols-outlined text-sm">
                    {isRtl ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </Link>
              <p className="text-[11px] text-gray-400 text-center mt-4">
                {t('cta.termsNotice')}
              </p>
            </div>
          </div>

          {/* Text Side */}
          <div className="w-full lg:w-1/2 p-8 md:p-14 lg:ps-0 order-1 lg:order-2 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide font-label-caps mb-2">
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              <span>{t('cta.joinElite')}</span>
            </div>
            <h2 className="font-headline-lg text-3xl md:text-5xl font-black text-dark dark:text-white leading-tight my-4">
              {t("cta.title")}
            </h2>
            <p className="font-body-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0 text-base md:text-lg leading-relaxed mb-8">
              {t("cta.subtitle")}
            </p>

            {/* Checkpoints */}
            <div className="space-y-3 mb-8 text-gray-700 dark:text-gray-300 text-sm">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                <span>{t('cta.check1')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                <span>{t('cta.check2')}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/courses"
                className="bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-label-caps px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <span>{t("cta.browseCourses")}</span>
                <span className="material-symbols-outlined text-sm">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTA;
