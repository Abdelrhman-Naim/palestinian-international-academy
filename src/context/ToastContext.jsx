import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { dir } = useLanguage();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastHelpers = {
    show: showToast,
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div 
        dir={dir}
        className="fixed bottom-5 end-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isInfo = t.type === 'info';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-md border text-sm font-bold transition-all ${
                  isSuccess
                    ? 'bg-white text-gray-900 border-emerald-500/30 shadow-emerald-500/10 dark:bg-stone-900/95 dark:border-emerald-500/40 dark:text-white'
                    : isError
                    ? 'bg-white text-gray-900 border-rose-500/30 shadow-rose-500/10 dark:bg-stone-900/95 dark:border-rose-500/40 dark:text-white'
                    : 'bg-white text-gray-900 border-amber-400/30 shadow-amber-500/10 dark:bg-stone-900/95 dark:border-amber-400/40 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      isSuccess
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isError
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-400/20 text-amber-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isSuccess ? 'check_circle' : isError ? 'error' : 'info'}
                    </span>
                  </div>
                  <span className="leading-snug">{t.message}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                  aria-label="إغلاق"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      showToast: (msg) => console.log('Toast:', msg),
      toast: {
        show: (msg) => console.log('Toast:', msg),
        success: (msg) => console.log('Toast success:', msg),
        error: (msg) => console.log('Toast error:', msg),
        info: (msg) => console.log('Toast info:', msg),
      }
    };
  }
  return context;
};
