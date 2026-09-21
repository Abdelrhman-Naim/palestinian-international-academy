import { useState, useRef, useEffect } from "react";
import { useLanguage } from '../context/LanguageContext';

export default function CustomSelect({ options, value, onChange, placeholder, disabled = false, className = "" }) {
    const { t, dir } = useLanguage();
    const defaultPlaceholder = placeholder || t("customSelect.placeholder");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div ref={dropdownRef} className={`relative w-full ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
                <span className="block truncate">{selectedOption ? selectedOption.label : defaultPlaceholder}</span>
                <span className="pointer-events-none flex items-center pr-2">
                    <svg
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${isOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#E8E2D5] bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:ring-gray-700">
                    {options.length === 0 ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {t("customSelect.noOptions")}
                        </div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`relative cursor-pointer select-none py-2.5 text-sm transition-colors ${
                                    dir === 'rtl' ? 'pl-4 pr-9 text-right' : 'pl-9 pr-4 text-left'
                                } ${
                                    value === option.value
                                        ? "bg-orange-50 font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                        : "text-gray-700 hover:bg-[#FAF7F2] dark:text-gray-200 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <span className="block truncate">{option.label}</span>
                                {value === option.value && (
                                    <span className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-2.5' : 'left-0 pl-2.5'} flex items-center text-orange-600 dark:text-orange-400`}>
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

