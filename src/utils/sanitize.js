/**
 * Data Sanitization & Normalization Utility
 * Automatically fixes common typos and formatting anomalies in seed/mock data.
 */

export function sanitizeTypo(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\bwep-starts\b/gi, 'web-starts')
    .replace(/\bwep-finsh\b/gi, 'web-finish')
    .replace(/\bwep\b/gi, 'web')
    .replace(/\bfinsh\b/gi, 'finish')
    .replace(/يبل4ق/g, 'تطبيق');
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeTypo(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
