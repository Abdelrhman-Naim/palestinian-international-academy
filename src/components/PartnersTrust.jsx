import { useLanguage } from '../context/LanguageContext';

const PartnersTrust = () => {
  const { t, dir } = useLanguage();

  const partners = [
    { name: 'ENG-CONSULT', icon: 'architecture' },
    { name: 'STRUCTURA LABS', icon: 'domain' },
    { name: 'FUTURE TECH', icon: 'memory' },
    { name: 'SMART ARCH', icon: 'apartment' },
    { name: 'CIVIL PRO', icon: 'construction' },
    { name: 'INNOVATE AI', icon: 'neurology' },
  ];

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900/80 py-12 px-4 border-t border-[#E8E2D5] dark:border-gray-800 transition-colors" dir={dir}>
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">
          {t('homeNew.partnersTitle')}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 opacity-70 hover:opacity-100 transition-opacity">
          {partners.map((partner, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-stone-600 dark:text-gray-300 font-bold text-sm sm:text-base font-mono tracking-wider hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl text-primary">{partner.icon}</span>
              <span>{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersTrust;
