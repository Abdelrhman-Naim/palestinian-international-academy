import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getDynamicSiteUrl } from '../utils/siteUrl';

/**
 * Custom Hook for setting document SEO programmatically if needed
 */
export function useSEO({ title, description, canonical }) {
  const { language, dir } = useLanguage();

  useEffect(() => {
    const isAr = language === 'ar';
    const siteName = isAr ? 'أكاديمية فلسطين الدولية (PIA)' : 'Palestinian International Academy (PIA)';
    const siteUrl = getDynamicSiteUrl();
    
    // Set document title
    if (title) {
      document.title = title.includes('PIA') ? title : `${title} | ${siteName}`;
    }

    // Set meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // Set canonical link
    if (canonical) {
      const fullCanonical = canonical.startsWith('http') ? canonical : `${siteUrl}${canonical.startsWith('/') ? canonical : `/${canonical}`}`;
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = fullCanonical;
    }

    // Ensure document lang and dir match
    document.documentElement.lang = language || 'ar';
    document.documentElement.dir = dir || 'rtl';
  }, [title, description, canonical, language, dir]);
}

export default useSEO;
