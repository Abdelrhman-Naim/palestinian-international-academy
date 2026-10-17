"use client";
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.webp';
import { useLanguage } from '../context/LanguageContext';
import { useCourses } from '../context/CoursesContext';

const Projects = () => {
  const { t, dir } = useLanguage();
  const { courses, loading } = useCourses();
  const isRtl = dir === 'rtl';

  // Derive dynamic practical project showcases from real Supabase courses
  const showcaseProjects = useMemo(() => {
    return (courses || [])
      .filter(c => c.is_published !== false && c.status !== 'Draft' && c.status !== 'مسودة')
      .slice(0, 3)
      .map((course, idx) => {
        const goals = Array.isArray(course.goals) ? course.goals : [];
        const primaryGoal = goals[0] || '';
        const tags = [
          course.category || course.category_name || (isRtl ? 'هندسة' : 'Engineering'),
          course.level || (isRtl ? 'متقدم' : 'Advanced')
        ].filter(Boolean);

        return {
          id: course.id,
          title: primaryGoal ? `${course.title} — ${primaryGoal}` : course.title,
          desc: course.description || (isRtl ? 'مشروع تطبيقي معتمد يحاكي تحديات بيئات العمل الهندسية والبرمجية.' : 'Accredited applied project simulating real engineering and industry challenges.'),
          author: course.instructor || course.instructor_name || (isRtl ? 'طاقم الأكاديمية' : 'Academy Faculty'),
          image: course.image_url || heroImg,
          tags,
          isFeatured: idx === 0 || Number(course.rating || 0) >= 4.5
        };
      });
  }, [courses, isRtl]);

  return (
    <section id="projects" className="py-14 sm:py-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors" dir={dir}>
      <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
        <span className="font-label-caps text-primary dark:text-[#D9A54C] tracking-widest uppercase text-xs sm:text-sm transition-colors font-bold">
          {t("projects.label") || (isRtl ? 'معرض المشاريع التطبيقية' : 'Applied Projects Showcase')}
        </span>
        <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-dark dark:text-white font-bold transition-colors">
          {t("projects.title1") || (isRtl ? 'مشاريع' : 'Projects')} <span className="text-secondary">{t("projects.title2") || (isRtl ? 'المهندسين والطلاب' : 'Built by Students')}</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl overflow-hidden animate-pulse flex flex-col">
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-700" />
              <div className="p-6 space-y-3 flex flex-col grow">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
              </div>
            </div>
          ))
        ) : showcaseProjects.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-gray-400 dark:text-gray-500 border border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl">
            <span className="material-symbols-outlined text-5xl mb-3 text-gray-300 dark:text-gray-600">deployed_code</span>
            <p className="text-base font-bold">{isRtl ? 'لا توجد مشاريع منشورة حالياً' : 'No projects published currently'}</p>
          </div>
        ) : (
          showcaseProjects.map((project) => (
            <Link
              key={project.id}
              to={`/courses/${project.id}`}
              className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-xl overflow-hidden hover-lift hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="relative h-48 w-full border-b border-stone-200 dark:border-gray-700 bg-[#F3EFE6] dark:bg-gray-800 flex items-center justify-center overflow-hidden transition-colors">
                <img 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={typeof project.image === 'string' ? project.image : (project.image?.src || heroImg)}
                />
                {project.isFeatured && (
                  <div className="absolute top-3 end-3 bg-secondary text-white text-[10px] font-label-caps px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[12px]">star</span> {t("projects.featured") || (isRtl ? 'مميز' : 'Featured')}
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col grow">
                <h3 className="font-headline-md text-base sm:text-lg font-bold mb-2 text-dark dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="font-body-md text-xs sm:text-sm text-text-main dark:text-gray-300 mb-4 line-clamp-3 transition-colors leading-relaxed">
                  {project.desc}
                </p>
                <div className="mt-auto pt-3 border-t border-stone-100 dark:border-gray-700/60">
                  <p className="text-xs text-text-main dark:text-gray-400 mb-3 transition-colors">
                    {t("projects.by") || (isRtl ? 'إشراف / إنجاز:' : 'By')} <strong className="text-dark dark:text-white font-bold">{project.author}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="bg-[#F5F0E6] dark:bg-gray-700 text-stone-800 dark:text-stone-200 text-[10px] font-label-caps px-2.5 py-1 rounded-md font-semibold transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      <div className="mt-10 sm:mt-14 text-center">
        <Link 
          to="/courses" 
          className="inline-flex items-center justify-center gap-2 font-label-caps text-primary hover:text-dark dark:hover:text-white transition-colors bg-white dark:bg-gray-800 px-6 py-3 border border-[#E8E2D5] dark:border-gray-700 rounded-full shadow-sm hover:shadow uppercase font-bold text-xs sm:text-sm"
        >
          <span>{t("projects.browseAll") || (isRtl ? 'تصفح جميع المسارات والمشاريع' : 'Browse All Tracks & Projects')}</span>
          <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </Link>
      </div>
    </section>
  );
};

export default Projects;
