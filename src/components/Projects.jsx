import heroImg from '../assets/hero.png';
import { useLanguage } from '../context/LanguageContext';

const Projects = () => {
  const { t, } = useLanguage();
  return (
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <span className="font-label-caps text-text-main dark:text-gray-400 tracking-widest uppercase text-sm transition-colors">{t("projects.label")}</span>
        <h2 className="font-headline-lg text-3xl md:text-4xl text-dark dark:text-white font-bold transition-colors">
          {t("projects.title1")} <span className="text-secondary">{t("projects.title2")}</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project 1 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl overflow-hidden hover-lift hover:shadow-lg transition-all flex flex-col">
          <div className="relative h-48 w-full border-b border-stone-200 dark:border-gray-700 bg-[#F3EFE6] dark:bg-gray-800 flex items-center justify-center overflow-hidden transition-colors">
            <img 
              alt="MedLink Logo" 
              className="w-full h-full object-cover opacity-80" 
              src={heroImg}
            />
            <div className="absolute top-3 right-3 bg-secondary text-white text-[10px] font-label-caps px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">star</span> {t("projects.featured")}
            </div>
          </div>
          <div className="p-6 flex flex-col grow">
            <h3 className="font-headline-md text-lg font-bold mb-2 text-dark dark:text-white transition-colors">{t("projects.project1Title")}</h3>
            <p className="font-body-md text-sm text-text-main dark:text-gray-300 mb-4 line-clamp-3 transition-colors">
              {t("projects.project1Desc")}
            </p>
            <div className="mt-auto">
              <p className="text-xs text-text-main dark:text-gray-400 mb-3 transition-colors">{t("projects.by")} <strong className="text-dark dark:text-white">{t("projects.project1Author")}</strong></p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">React</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">Figma</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project 2 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl overflow-hidden hover-lift hover:shadow-lg transition-all flex flex-col">
          <div className="relative h-48 w-full border-b border-stone-200 dark:border-gray-700 bg-[#F3EFE6] dark:bg-gray-800 flex items-center justify-center overflow-hidden transition-colors">
            <img 
              alt="Trainova" 
              className="w-full h-full object-cover opacity-80" 
              src={heroImg}
            />
            <div className="absolute top-3 right-3 bg-secondary text-white text-[10px] font-label-caps px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">star</span> {t("projects.featured")}
            </div>
          </div>
          <div className="p-6 flex flex-col grow">
            <h3 className="font-headline-md text-lg font-bold mb-2 text-dark dark:text-white transition-colors">{t("projects.project2Title")}</h3>
            <p className="font-body-md text-sm text-text-main dark:text-gray-300 mb-4 line-clamp-3 transition-colors">
              {t("projects.project2Desc")}
            </p>
            <div className="mt-auto">
              <p className="text-xs text-text-main dark:text-gray-400 mb-3 transition-colors">{t("projects.by")} <strong className="text-dark dark:text-white">{t("projects.project2Author")}</strong></p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">PHP</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">MySQL</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project 3 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl overflow-hidden hover-lift hover:shadow-lg transition-all flex flex-col">
          <div className="relative h-48 w-full border-b border-stone-200 dark:border-gray-700 bg-[#F3EFE6] dark:bg-gray-800 flex items-center justify-center overflow-hidden transition-colors">
            <img 
              alt="Talabati" 
              className="w-full h-full object-cover opacity-80"
              src={heroImg}
            />
            <div className="absolute top-3 right-3 bg-secondary text-white text-[10px] font-label-caps px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">star</span> {t("projects.featured")}
            </div>
          </div>
          <div className="p-6 flex flex-col grow">
            <h3 className="font-headline-md text-lg font-bold mb-2 text-dark dark:text-white transition-colors">{t("projects.project3Title")}</h3>
            <p className="font-body-md text-sm text-text-main dark:text-gray-300 mb-4 line-clamp-3 transition-colors">
              {t("projects.project3Desc")}
            </p>
            <div className="mt-auto">
              <p className="text-xs text-text-main dark:text-gray-400 mb-3 transition-colors">{t("projects.by")} <strong className="text-dark dark:text-white">{t("projects.project3Author")}</strong></p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">Laravel</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white text-[10px] font-label-caps px-2 py-1 rounded transition-colors">React.js</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center">
        <a className="inline-flex items-center justify-center gap-2 font-label-caps text-primary hover:text-dark dark:hover:text-white transition-colors bg-white dark:bg-gray-800 px-6 py-3 border border-[#E8E2D5] dark:border-gray-700 rounded-full shadow-sm hover:shadow uppercase" href="#">
          {t("projects.browseAll")} <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
        </a>
      </div>
    </section>
  );
};

export default Projects;

