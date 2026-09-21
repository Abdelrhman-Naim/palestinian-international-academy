import { useLanguage } from '../context/LanguageContext';
import { useMaintenance } from '../context/MaintenanceContext';

export default function MaintenancePage() {
  const { t, dir, lang } = useLanguage();
  const { maintenanceData } = useMaintenance();

  const isRtl = dir === 'rtl';

  const defaultMessage = isRtl
    ? 'المنصة تخضع حالياً لأعمال صيانة دورية وتحديثات هامة لتقديم تجربة استثنائية لكافة المهندسين والطلاب. سنعود للعمل بكامل طاقتنا في أقرب وقت.'
    : 'The platform is currently undergoing scheduled maintenance and important enhancements to deliver an exceptional experience. We will be back online shortly.';

  const displayMessage = maintenanceData?.message || defaultMessage;

  return (
    <div 
      className="min-h-screen w-full bg-[#FAF7F2] dark:bg-gray-950 text-dark dark:text-gray-100 flex flex-col justify-between font-alexandria antialiased relative overflow-hidden transition-colors selection:bg-primary selection:text-white"
      dir={dir}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-137.5 h-137.5 bg-linear-to-tr from-primary/20 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-center sm:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-secondary via-primary to-amber-300 text-white flex items-center justify-center shadow-lg shadow-primary/25 ring-2 ring-primary/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-dark dark:text-white">{isRtl ? 'أكاديمية فلسطين الدولية' : 'PIA Academy'}</span>
            <span className="block text-[10px] font-bold text-primary tracking-widest uppercase">System Maintenance</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        {/* Animated Central Icon with Rotating Gears */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          {/* Subtle pulsating outer ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          
          {/* Orbital dashed ring */}
          <div 
            className="absolute inset-2 rounded-full border-2 border-dashed border-primary/40 animate-spin" 
            style={{ animationDuration: '14s' }}
          />
          
          {/* Reverse gear ring */}
          <div 
            className="absolute inset-5 rounded-full border-2 border-primary/20 border-t-amber-500 animate-spin" 
            style={{ animationDirection: 'reverse', animationDuration: '6s' }}
          />

          {/* Central Luxury Emblem */}
          <div className="relative z-10 w-20 h-20 rounded-3xl bg-linear-to-tr from-secondary via-primary to-amber-300 text-white shadow-2xl shadow-primary/40 flex items-center justify-center rotate-3 transform hover:rotate-0 transition-transform">
            <svg className="w-10 h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Maintenance Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold font-label-caps mb-4 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{isRtl ? 'وضع الصيانة نشط' : 'Maintenance Mode Active'}</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold font-headline-lg text-dark dark:text-white mb-4 tracking-tight leading-tight">
          {isRtl ? 'المنصة تحت أعمال الصيانة الدورية' : 'Platform Under Scheduled Maintenance'}
        </h1>

        {/* Message */}
        <p className="text-base sm:text-lg font-body-lg text-stone-600 dark:text-gray-300 leading-relaxed max-w-xl mb-8">
          {displayMessage}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-linear-to-r from-secondary via-primary to-amber-400 text-white font-bold text-sm shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRtl ? 'إعادة المحاولة الآن' : 'Check Again'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-stone-500 dark:text-gray-500 border-t border-stone-200 dark:border-gray-800/80">
        <p>© {new Date().getFullYear()} PALESTINIAN INTERNATIONAL ACADEMY (PIA). {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
