import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Luxury Centered Circular PageLoader
 * Designed with concentric spinning rings, ambient gold glow,
 * crystal-clear localized typography, and animated status pulses.
 */
export default function PageLoader({ 
  title, 
  subtitle, 
  message, 
  fullScreen = false, 
  size = 'md',
  pointerEventsNone = false
}) {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const defaultTitle = message || title || (isRtl ? 'جاري التحميل...' : 'Loading...');
  const defaultSubtitle = subtitle || (isRtl 
    ? 'يتم الآن تجهيز المحتوى بأعلى دقة وسرعة، يرجى الانتظار لحظات...' 
    : 'Preparing your content with highest quality, please wait a moment...');

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="relative max-w-sm w-[92%] sm:w-88 mx-auto p-8 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-primary/30 shadow-[0_20px_50px_rgba(212,175,55,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center text-center select-none overflow-hidden"
      dir={dir}
    >
      {/* Ambient background glow inside card */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 bg-gradient-to-b from-primary/25 via-amber-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ================= Circular Spinner Centerpiece ================= */}
      <div className="relative w-28 h-28 my-2 flex items-center justify-center">
        {/* Soft pulsing gold aura */}
        <div className="absolute inset-2 rounded-full bg-primary/20 blur-xl animate-pulse" />

        {/* Outer orbital gradient ring (Clockwise) */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-amber-400/80 animate-spin" style={{ animationDuration: '1.2s' }} />

        {/* Middle reverse-orbiting dashed ring (Counter-Clockwise) */}
        <div 
          className="absolute inset-3 rounded-full border-2 border-dashed border-primary/40 border-b-secondary animate-spin" 
          style={{ animationDirection: 'reverse', animationDuration: '2.5s' }} 
        />

        {/* Orbiting Satellite Dot */}
        <div className="absolute inset-1 rounded-full animate-spin" style={{ animationDuration: '2s' }}>
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-300 to-primary shadow-[0_0_8px_#d4af37]" />
        </div>

        {/* Inner Golden Badge with SVG Emblem (Zero Font Dependency) */}
        <div className="relative z-10 w-13 h-13 rounded-2xl bg-gradient-to-tr from-secondary via-primary to-amber-300 text-white shadow-[0_8px_20px_rgba(212,175,55,0.4)] flex items-center justify-center">
          <svg className="w-7 h-7 animate-pulse text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
        </div>
      </div>

      {/* ================= Clear Localized Typography ================= */}
      <div className="mt-4 z-10">
        <h3 className="text-xl font-extrabold font-headline-lg text-dark dark:text-white tracking-wide mb-2">
          {defaultTitle}
        </h3>
        <p className="text-xs font-body-md text-stone-500 dark:text-gray-400 leading-relaxed max-w-[260px] mx-auto">
          {defaultSubtitle}
        </p>
      </div>

      {/* ================= Animated Dots & Mini Progress Bar ================= */}
      <div className="mt-5 flex flex-col items-center gap-3 w-full z-10">
        {/* Synchronized pulsing golden dots */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" style={{ animationDuration: '1.4s', animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary/70 animate-ping" style={{ animationDuration: '1.4s', animationDelay: '400ms' }} />
        </div>

        {/* Sliding golden beam inside track */}
        <div className="w-36 h-1 rounded-full bg-stone-200/80 dark:bg-gray-800 overflow-hidden relative">
          <div 
            className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-[shimmer_1.6s_infinite_linear]"
            style={{
              animation: 'slide-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        </div>
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all ${pointerEventsNone ? 'pointer-events-none' : ''}`}>
        {cardContent}
      </div>
    );
  }

  return (
    <div className="py-14 w-full flex items-center justify-center p-4">
      {cardContent}
    </div>
  );
}
