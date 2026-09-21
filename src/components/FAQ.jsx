import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const FAQ = () => {
  const { t, dir } = useLanguage();
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    { q: t('homeNew.faq1Q'), a: t('homeNew.faq1A') },
    { q: t('homeNew.faq2Q'), a: t('homeNew.faq2A') },
    { q: t('homeNew.faq3Q'), a: t('homeNew.faq3A') },
    { q: t('homeNew.faq4Q'), a: t('homeNew.faq4A') },
  ];

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-24 px-4 md:px-8 border-t border-[#E8E2D5] dark:border-gray-800 transition-colors" dir={dir}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t('homeNew.faqBadge')}
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-extrabold text-dark dark:text-white">
            {t('homeNew.faqTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
            {t('homeNew.faqSubtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-start flex items-center justify-between gap-4 font-bold text-base md:text-lg text-dark dark:text-white hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-[#FAF7F2] dark:border-gray-700/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
