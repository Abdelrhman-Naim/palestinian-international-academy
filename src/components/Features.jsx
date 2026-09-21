import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const Features = () => {
  const { t, } = useLanguage();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-24 px-4 md:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4 flex flex-col items-center">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t("features.label")}
          </span>
          <h2 className="font-headline-lg text-3xl md:text-4xl text-dark dark:text-white font-black">{t("features.title")}</h2>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Feature 1 */}
          <motion.div variants={item} className="group bg-white dark:bg-gray-800/90 border border-[#E8E2D5] dark:border-gray-700/50 p-10 rounded-3xl text-center transition-all duration-300 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.25)] flex flex-col items-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary mb-6 transition-transform duration-300 group-hover:scale-110">
              <span className="material-symbols-outlined text-2xl">route</span>
            </div>
            <h3 className="font-bold text-xl mb-3 text-dark dark:text-white group-hover:text-primary transition-colors">{t("features.structuredPaths")}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 grow">{t("features.structuredPathsDesc")}</p>
            <div className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
              {t("hero.cta2")}
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </div>
          </motion.div>
          
          {/* Feature 2 */}
          <motion.div variants={item} className="group bg-white dark:bg-gray-800/90 border border-[#E8E2D5] dark:border-gray-700/50 p-10 rounded-3xl text-center transition-all duration-300 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.25)] flex flex-col items-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary mb-6 transition-transform duration-300 group-hover:scale-110">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <h3 className="font-bold text-xl mb-3 text-dark dark:text-white group-hover:text-primary transition-colors">{t("features.trackProgress")}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 grow">{t("features.trackProgressDesc")}</p>
            <div className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
              {t("hero.cta2")}
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </div>
          </motion.div>
          
          {/* Feature 3 */}
          <motion.div variants={item} className="group bg-white dark:bg-gray-800/90 border border-[#E8E2D5] dark:border-gray-700/50 p-10 rounded-3xl text-center transition-all duration-300 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.25)] flex flex-col items-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary mb-6 transition-transform duration-300 group-hover:scale-110">
              <span className="material-symbols-outlined text-2xl">quiz</span>
            </div>
            <h3 className="font-bold text-xl mb-3 text-dark dark:text-white group-hover:text-primary transition-colors">{t("features.quizAfterVideo")}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 grow">{t("features.quizAfterVideoDesc")}</p>
            <div className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
              {t("hero.cta2")}
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;

