import { useLanguage } from '../../context/LanguageContext';

export default function AdminPageShell({ parent, title, subtitle, icon, actions, children }) {
  const { t, dir } = useLanguage();
  return (
    <div dir={dir} className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#E8E2D5] dark:border-gray-800 pb-6">
          <div className="space-y-1">
            {parent && (
              <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                <span>{parent}</span>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-primary font-extrabold">{title}</span>
              </div>
            )}
            <div className="flex items-center gap-3.5">
              {icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-secondary to-primary text-white shadow-lg shadow-primary/20 border border-primary/20 dark:text-gray-950 shrink-0">
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-dark dark:text-white tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
