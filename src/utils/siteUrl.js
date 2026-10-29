/**
 * Helper to determine current site URL dynamically across environments:
 * - Browser runtime: window.location.origin (supports both netlify.app and vercel.app seamlessly)
 * - Vercel SSR/Build: check VERCEL=1 or NEXT_PUBLIC_VERCEL_ENV -> defaults to https://palestine-international-academy.vercel.app
 * - Netlify SSR/Build: check NETLIFY=true -> defaults to https://palestine-international-academy.netlify.app
 * - Custom domain / Env: NEXT_PUBLIC_SITE_URL
 */
export const getDynamicSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return 'https://palestine-international-academy.vercel.app';
  }
  if (process.env.NETLIFY === 'true') {
    return 'https://palestine-international-academy.netlify.app';
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://palestine-international-academy.netlify.app';
};

export default getDynamicSiteUrl;
