/**
 * Formats dates uniformly across the platform using standard digits (0-9)
 * Format: 15/9/2026, 12:11 م (or 15/9/2026, 12:11 PM for English)
 */
export function formatCustomDateTime(dateInput, lang = 'ar') {
  if (!dateInput) return '-';

  let d;
  if (dateInput?.seconds) {
    d = new Date(dateInput.seconds * 1000);
  } else if (typeof dateInput?.toDate === 'function') {
    d = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else {
    return '-';
  }

  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = d.getMonth() + 1; // 1 to 12
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const isAr = lang === 'ar' || lang === 'rtl';
  const ampm = hours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');

  hours = hours % 12;
  hours = hours ? hours : 12;

  const comma = isAr ? '،' : ',';
  return `${day}/${month}/${year}${comma} ${hours}:${minutes} ${ampm}`;
}

export function formatCustomDate(dateInput) {
  if (!dateInput) return '-';

  let d;
  if (dateInput?.seconds) {
    d = new Date(dateInput.seconds * 1000);
  } else if (typeof dateInput?.toDate === 'function') {
    d = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else {
    return '-';
  }

  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
