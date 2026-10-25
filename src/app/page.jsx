import Home from '@/pages/Home';
import { getDynamicSiteUrl } from '@/utils/siteUrl';

const currentSiteUrl = getDynamicSiteUrl();

export const metadata = {
  title: 'أكاديمية فلسطين الدولية (PIA) | الموقع الرسمي للدورات المعتمدة والمختبرات السحابية',
  description: 'الموقع الرسمي لأكاديمية فلسطين الدولية (PIA). منصة تعليمية وتدريبية معتمدة تقدم دورات البرمجة والذكاء الاصطناعي، ومكتبة رقمية ومختبرات سحابية تفاعلية بشهادات موثوقة.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const homeWebsiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${currentSiteUrl}/#website`,
    'name': 'أكاديمية فلسطين الدولية',
    'alternateName': [
      'أكاديمية فلسطين الدولية (PIA)',
      'أكاديمية فلسطين',
      'PIA',
      'Palestinian International Academy',
      'PIA Academy'
    ],
    'url': `${currentSiteUrl}/`,
    'inLanguage': 'ar',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${currentSiteUrl}/courses?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeWebsiteSchema) }}
      />
      <Home />
    </>
  );
}
