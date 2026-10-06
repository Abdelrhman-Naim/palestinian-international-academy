"use client";
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SITE_URL = 'https://palestine-international-academy.netlify.app';
const DEFAULT_IMAGE = `${SITE_URL}/screen.webp`;

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  noindex = false,
  schema = null,
  breadcrumbs = null,
}) {
  const { language, dir } = useLanguage();
  const location = useLocation();

  const isAr = language === 'ar';
  const siteName = isAr ? 'أكاديمية فلسطين الدولية (PIA)' : 'Palestinian International Academy (PIA)';
  const defaultDesc = isAr
    ? 'الأكاديمية الفلسطينية الدولية - منصة تعليمية وتدريبية رائدة تقدم دورات مهنية معتمدة، مكتبة رقمية متكاملة، ومختبرات سحابية ذكية.'
    : 'Palestinian International Academy (PIA) - Premier educational platform providing accredited professional courses, digital library, and smart cloud labs.';
  
  const defaultKeywords = isAr
    ? 'أكاديمية فلسطين الدولية, PIA, دورات تدريبية, برمجة, ذكاء اصطناعي, أمن سيبراني, مكتبة رقمية, شهادات معتمدة, مختبر سحابي'
    : 'Palestinian International Academy, PIA, online courses, programming, artificial intelligence, cybersecurity, digital library, accredited certificates, cloud lab';

  // Construct absolute canonical URL
  const canonicalUrl = useMemo(() => {
    if (canonical) {
      return canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}`;
    }
    return `${SITE_URL}${location.pathname}`;
  }, [canonical, location.pathname]);

  // Construct absolute og:image URL
  const absoluteOgImage = useMemo(() => {
    if (!ogImage) return DEFAULT_IMAGE;
    return ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;
  }, [ogImage]);

  // Format page title
  const fullTitle = useMemo(() => {
    if (!title) return siteName;
    if (title.includes('PIA') || title.includes('الأكاديمية الفلسطينية الدولية') || title.includes('Palestinian International Academy')) {
      return title;
    }
    return `${title} | ${siteName}`;
  }, [title, siteName]);

  const metaDesc = description || defaultDesc;
  const metaKeywords = Array.isArray(keywords) ? keywords.join(', ') : (keywords || defaultKeywords);

  // Generate BreadcrumbList Schema if breadcrumbs prop is provided
  const breadcrumbsSchema = useMemo(() => {
    if (!breadcrumbs || !Array.isArray(breadcrumbs) || breadcrumbs.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': crumb.name,
        'item': crumb.item?.startsWith('http') ? crumb.item : `${SITE_URL}${crumb.item || ''}`
      }))
    };
  }, [breadcrumbs]);

  return (
    <Helmet>
      {/* HTML Language & Direction Attributes */}
      <html lang={language} dir={dir} />

      {/* Basic Title and Meta */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />

      {/* Robots Indexation Directives */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate Language Links for Hreflang SEO */}
      <link rel="alternate" hrefLang="ar" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:secure_url" content={absoluteOgImage} />
      <meta property="og:locale" content={isAr ? 'ar_AR' : 'en_US'} />
      <meta property="og:locale:alternate" content={isAr ? 'en_US' : 'ar_AR'} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* Injected Breadcrumbs Schema */}
      {breadcrumbsSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbsSchema)}
        </script>
      )}

      {/* Injected Page-Specific Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
