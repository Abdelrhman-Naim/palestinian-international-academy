"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getShortVideos, parseVideoEmbed } from '../services/shortsService';

export default function TechShortsSection() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  const loadShorts = async () => {
    try {
      const data = await getShortVideos();
      setShorts(data);
    } catch (err) {
      console.warn('Failed to load tech shorts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShorts();

    const handleUpdate = () => {
      loadShorts();
    };

    window.addEventListener('pia:shorts-updated', handleUpdate);
    return () => window.removeEventListener('pia:shorts-updated', handleUpdate);
  }, []);

  // Keyboard navigation for video modal (Escape to close)
  useEffect(() => {
    if (!activeVideo) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveVideo(null);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideo]);

  if (!loading && (!shorts || shorts.length === 0)) {
    return null;
  }

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-14 sm:py-20 px-4 md:px-8 transition-colors border-t border-[#E8E2D5] dark:border-gray-800" dir={dir}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 space-y-3 flex flex-col items-center">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-flex items-center gap-1.5 font-label-caps">
            <span className="material-symbols-outlined text-base">bolt</span>
            <span>{isRtl ? 'إضاءات ومعلومات سريعة' : 'Quick Tech & Engineering Insights'}</span>
          </span>

          <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-5xl text-dark dark:text-white font-black tracking-tight">
            {isRtl ? 'فيديوهات ومعلومات هندسية وبرمجية سريعة' : 'Short Videos & Fast Tech Capsules'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            {isRtl 
              ? 'كبسولات علمية وتقنية مكثفة تواكب أحدث المستجدات في البرمجة والذكاء الاصطناعي والهندسة المتطورة.'
              : 'Concise, high-impact video capsules keeping you at the forefront of programming, AI, and modern engineering.'}
          </p>
        </div>

        {/* Cards Grid (Maximum 4 cards on home section) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shorts.slice(0, 4).map((item) => {
            const parsed = parseVideoEmbed(item.video_url);
            const iconName = item.icon || 'smart_display';

            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-[#E8E2D5] dark:border-gray-700/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Decorative Top Gradient Glow */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary/40 via-primary to-amber-500 rounded-t-3xl opacity-80 group-hover:opacity-100 transition-opacity" />

                {/* Media Preview Area with Centered Glowing Icon */}
                <div 
                  className="relative w-full aspect-16/10 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 flex items-center justify-center cursor-pointer mb-4 shadow-inner group/thumb"
                  onClick={() => setActiveVideo(item)}
                  title={isRtl ? `مشاهدة: ${item.title}` : `Watch: ${item.title}`}
                >
                  {/* YouTube thumbnail background if available */}
                  {parsed.thumbnailUrl && (
                    <img 
                      src={parsed.thumbnailUrl} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover/thumb:opacity-60 group-hover/thumb:scale-105 transition-all duration-500"
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/70" />

                  {/* Category Pill on top-start */}
                  {item.category && (
                    <span className="absolute top-3 start-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-400/30">
                      {item.category}
                    </span>
                  )}

                  {/* Centered Glowing Icon (أيقونة بالنص) */}
                  <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr from-primary to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-primary/40 group-hover/thumb:scale-110 group-hover/thumb:shadow-primary/60 transition-all duration-300 ring-4 ring-white/20">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl font-black">
                      {iconName === 'smart_display' ? 'play_arrow' : iconName}
                    </span>
                    <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75 pointer-events-none" />
                  </div>
                </div>

                {/* Content: Title & Description */}
                <div className="flex-1 flex flex-col justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-dark dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Card Action View Button (زر عرض على البطاقات) */}
                <button
                  type="button"
                  onClick={() => setActiveVideo(item)}
                  className="w-full flex items-center justify-center gap-2 bg-[#FAF7F2] dark:bg-gray-700/60 hover:bg-primary dark:hover:bg-primary text-dark dark:text-white hover:text-stone-950 dark:hover:text-stone-950 border border-[#E8E2D5] dark:border-gray-600/70 hover:border-primary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base text-primary group-hover:text-stone-950 transition-colors">
                    play_circle
                  </span>
                  <span>{isRtl ? 'عرض الفيديو والمعلومات' : 'View Video & Details'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer CTA: Link to full /shorts catalog page */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/shorts"
            className="inline-flex items-center justify-center gap-2.5 bg-white dark:bg-gray-800 hover:bg-primary dark:hover:bg-primary text-dark dark:text-white hover:text-stone-950 dark:hover:text-stone-950 border border-[#E8E2D5] dark:border-gray-700 font-bold text-sm px-7 py-3.5 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{isRtl ? 'استعراض كافة الفيديوهات والمعلومات' : 'Browse All Tech Shorts & Videos'}</span>
            <span className="material-symbols-outlined text-base">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </Link>
        </div>
      </div>

      {/* Video Preview Modal */}
      {activeVideo && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveVideo(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 dark:border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-[#FAF7F2] dark:bg-gray-900/90 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">smart_display</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-dark dark:text-white truncate">
                    {activeVideo.title}
                  </h3>
                  <span className="text-xs text-primary font-bold">
                    {activeVideo.category || (isRtl ? 'معلومات تقنية' : 'Tech Insight')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label={isRtl ? 'إغلاق نافذة العرض' : 'Close video modal'}
                className="w-9 h-9 rounded-xl hover:bg-stone-200/60 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-gray-700"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Video Player Body */}
            <div className="relative w-full aspect-16/9 bg-black overflow-hidden flex items-center justify-center">
              {(() => {
                const parsed = parseVideoEmbed(activeVideo.video_url);

                if (parsed.type === 'youtube' || parsed.type === 'drive') {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }

                if (parsed.type === 'html5') {
                  return (
                    <video
                      src={parsed.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <iframe
                    src={parsed.embedUrl}
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                );
              })()}
            </div>

            {/* Modal Description Footer */}
            <div className="p-5 bg-white dark:bg-gray-900 border-t border-stone-200 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {activeVideo.description}
              </p>
              {activeVideo.video_url && (
                <a
                  href={activeVideo.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                >
                  <span>{isRtl ? 'فتح الرابط الأصلي للمحتوى' : 'Open original video link'}</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
