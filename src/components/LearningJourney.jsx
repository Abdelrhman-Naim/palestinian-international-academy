import { useLanguage } from '../context/LanguageContext';

const LearningJourney = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const steps = [
    {
      num: t('homeNew.journeyStep1Num'),
      title: t('homeNew.journeyStep1Title'),
      desc: t('homeNew.journeyStep1Desc'),
      icon: 'target',
    },
    {
      num: t('homeNew.journeyStep2Num'),
      title: t('homeNew.journeyStep2Title'),
      desc: t('homeNew.journeyStep2Desc'),
      icon: 'terminal',
    },
    {
      num: t('homeNew.journeyStep3Num'),
      title: t('homeNew.journeyStep3Title'),
      desc: t('homeNew.journeyStep3Desc'),
      icon: 'groups',
    },
    {
      num: t('homeNew.journeyStep4Num'),
      title: t('homeNew.journeyStep4Title'),
      desc: t('homeNew.journeyStep4Desc'),
      icon: 'workspace_premium',
    },
  ];

  return (
    <section className="w-full bg-[#F3EFE6] dark:bg-gray-900 text-dark dark:text-white py-24 px-4 md:px-8 relative overflow-hidden border-y border-[#E8E2D5] dark:border-gray-800 transition-colors" dir={dir}>
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 opacity-[0.03] dot-pattern pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t('homeNew.journeyBadge')}
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-extrabold tracking-tight text-dark dark:text-white">
            {t('homeNew.journeyTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
            {t('homeNew.journeySubtitle')}
          </p>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 hover:border-primary/50 rounded-3xl p-7 transition-all duration-300 hover-lift flex flex-col justify-between group shadow-sm relative overflow-hidden"
            >
              {/* Top indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/60 border border-[#E8E2D5] dark:border-gray-600 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-dark transition-colors duration-300">
                  <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                </div>
                <span className="font-mono text-2xl font-black text-secondary/80 group-hover:text-primary transition-colors">
                  {step.num}
                </span>
              </div>

              <div className="grow">
                <h3 className="font-headline-md text-lg md:text-xl font-bold text-dark dark:text-white mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF7F2] dark:border-gray-700/60 flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                <span>{isRtl ? `المرحلة ${step.num}` : `Phase ${step.num}`}</span>
                <span className="material-symbols-outlined text-sm">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningJourney;
