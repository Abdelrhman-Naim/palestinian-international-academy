/**
 * Helper to determine current site URL dynamically across environments:
 * - Browser runtime: window.location.origin (supports both netlify.app and vercel.app seamlessly)
 * - Vercel SSR/Build: VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL
 * - Custom domain / Env: NEXT_PUBLIC_SITE_URL
 * - Fallback: Netlify production URL
 */
export const getDynamicSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
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
