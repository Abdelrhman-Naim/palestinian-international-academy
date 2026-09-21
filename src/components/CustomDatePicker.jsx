import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AR_DAYS = ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CustomDatePicker({
  value = "",
  onChange,
  minDate = "",
  placeholder,
  hasError = false,
  disabled = false,
  className = "",
  label = "",
  required = false,
}) {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current initial view date from value or fallback to today
  const [viewDate, setViewDate] = useState(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [viewMode, setViewMode] = useState("days"); // 'days' | 'months' | 'years'

  // Keep viewDate in sync when value changes externally
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNames = isRtl ? AR_MONTHS : EN_MONTHS;
  const dayNames = isRtl ? AR_DAYS : EN_DAYS;

  // Format YYYY-MM-DD helper
  const formatISO = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  // Today ISO string
  const todayObj = new Date();
  const todayISO = formatISO(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());

  // Check if date is before minDate
  const isDateDisabled = (iso) => {
    if (!minDate) return false;
    return iso < minDate;
  };

  // Generate calendar days
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    // In RTL (Arabic), we start the week on Saturday (index 0 for Saturday)
    // Sunday in JS getDay() is 0, Monday is 1 ... Saturday is 6.
    const startOffset = isRtl ? (firstDay + 1) % 7 : firstDay;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = formatISO(prevY, prevM, d);
      cells.push({
        day: d,
        iso,
        isCurrentMonth: false,
        disabled: true,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const iso = formatISO(viewYear, viewMonth, d);
      cells.push({
        day: d,
        iso,
        isCurrentMonth: true,
        disabled: isDateDisabled(iso),
      });
    }

    // Next month padding to make full weeks (multiple of 7)
    const totalFilled = cells.length;
    const remaining = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = formatISO(nextY, nextM, d);
      cells.push({
        day: d,
        iso,
        isCurrentMonth: false,
        disabled: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth, isRtl, minDate]);

  // Navigate month
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Format localized display for input button
  const displayFormattedDate = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    try {
      const [y, m, d] = value.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return value;
      return date.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }, [value, isRtl]);

  // Quick preset dates
  const handleQuickSelect = (daysFromToday) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const iso = formatISO(target.getFullYear(), target.getMonth(), target.getDate());
    if (!isDateDisabled(iso)) {
      onChange(iso);
      setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
      setIsOpen(false);
    }
  };

  const handleSelectDay = (cell) => {
    if (cell.disabled) return;
    onChange(cell.iso);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Year choices for year selector
  const yearChoices = useMemo(() => {
    const baseYear = todayObj.getFullYear();
    const list = [];
    for (let y = baseYear; y <= baseYear + 6; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
          {required && <span className="text-rose-500 font-bold ml-1">*</span>}
          {label}
        </label>
      )}

      {/* Trigger Input Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`group relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-start text-sm transition-all duration-200 outline-none ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800"
            : "cursor-pointer bg-white hover:border-indigo-400 dark:bg-gray-900 dark:hover:border-indigo-500"
        } ${
          hasError
            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 dark:border-rose-500"
            : isOpen
            ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm dark:border-indigo-500"
            : "border-[#E8E2D5] dark:border-gray-700"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              hasError
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                : value
                ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
            }`}
          >
            <i className="fa-regular fa-calendar-days text-sm"></i>
          </div>

          <span
            className={`block truncate font-medium ${
              value
                ? "font-bold text-gray-800 dark:text-gray-100 text-sm"
                : "text-gray-400 dark:text-gray-500 text-sm"
            }`}
          >
            {displayFormattedDate || placeholder || (isRtl ? "اختر تاريخ الاستحقاق..." : "Select due date...")}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              title={isRtl ? "مسح التاريخ" : "Clear date"}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </span>
          )}
          <span className="flex h-6 w-6 items-center justify-center text-gray-400 transition-transform duration-200 dark:text-gray-500">
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`}></i>
          </span>
        </div>
      </button>

      {/* Luxury Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full min-w-[310px] sm:min-w-[340px] rounded-3xl border border-[#E8E2D5] bg-white/98 p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/98 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] select-none"
          >
            {/* Header: Month / Year Navigation */}
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#E8E2D5]/70 pb-3 dark:border-gray-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                title={isRtl ? "الشهر السابق" : "Previous Month"}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-500 transition hover:border-[#E8E2D5] hover:bg-[#FAF7F2] hover:text-indigo-600 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
              >
                <i className={`fa-solid ${isRtl ? "fa-chevron-right" : "fa-chevron-left"} text-xs`}></i>
              </button>

              <div className="flex items-center gap-1">
                {/* Month Picker Toggle */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
                  className={`rounded-xl px-2.5 py-1 text-sm font-bold transition ${
                    viewMode === "months"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-800 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                  }`}
                >
                  {monthNames[viewMonth]}
                  <i className="fa-solid fa-angle-down mr-1 text-[10px] opacity-70"></i>
                </button>

                {/* Year Picker Toggle */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "years" ? "days" : "years")}
                  className={`rounded-xl px-2.5 py-1 text-sm font-bold transition ${
                    viewMode === "years"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-800 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                  }`}
                >
                  {viewYear}
                  <i className="fa-solid fa-angle-down mr-1 text-[10px] opacity-70"></i>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title={isRtl ? "الشهر التالي" : "Next Month"}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-500 transition hover:border-[#E8E2D5] hover:bg-[#FAF7F2] hover:text-indigo-600 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
              >
                <i className={`fa-solid ${isRtl ? "fa-chevron-left" : "fa-chevron-right"} text-xs`}></i>
              </button>
            </div>

            {/* View Mode: Months Picker */}
            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {monthNames.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(viewYear, idx, 1));
                      setViewMode("days");
                    }}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      idx === viewMonth
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode: Years Picker */}
            {viewMode === "years" && (
              <div className="grid grid-cols-3 gap-2 py-2 max-h-52 overflow-y-auto">
                {yearChoices.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(y, viewMonth, 1));
                      setViewMode("days");
                    }}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      y === viewYear
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode: Days Grid */}
            {viewMode === "days" && (
              <>
                {/* Days of Week Header */}
                <div className="mb-2 grid grid-cols-7 text-center">
                  {dayNames.map((d) => (
                    <span
                      key={d}
                      className="text-[11px] font-bold text-gray-400 dark:text-gray-500 py-1"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {calendarGrid.map((cell, idx) => {
                    const isSelected = cell.iso === value;
                    const isToday = cell.iso === todayISO;

                    if (!cell.isCurrentMonth) {
                      return (
                        <div
                          key={idx}
                          className="flex h-9 items-center justify-center text-xs text-gray-300 dark:text-gray-700 cursor-default select-none"
                        >
                          {cell.day}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="flex items-center justify-center">
                        <button
                          type="button"
                          disabled={cell.disabled}
                          onClick={() => handleSelectDay(cell)}
                          className={`group relative flex h-8.5 w-8.5 items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 ${
                            cell.disabled
                              ? "cursor-not-allowed text-gray-300 dark:text-gray-700 opacity-40 line-through"
                              : isSelected
                              ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/40 scale-105"
                              : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                          } ${
                            isToday && !isSelected
                              ? "ring-1 ring-indigo-500/60 text-indigo-600 dark:text-indigo-400"
                              : ""
                          }`}
                        >
                          {cell.day}
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Presets & Actions Footer */}
                <div className="mt-4 border-t border-[#E8E2D5]/70 pt-3 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(0)}
                        className="rounded-lg bg-indigo-50 px-2 py-1 font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80"
                      >
                        {isRtl ? "اليوم" : "Today"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(1)}
                        className="rounded-lg bg-[#FAF7F2] px-2 py-1 font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {isRtl ? "غداً" : "Tomorrow"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(7)}
                        className="rounded-lg bg-[#FAF7F2] px-2 py-1 font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {isRtl ? "+ أسبوع" : "+ 1 Week"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(14)}
                        className="rounded-lg bg-[#FAF7F2] px-2 py-1 font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {isRtl ? "+ أسبوعين" : "+ 2 Weeks"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      {isRtl ? "إغلاق" : "Close"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
