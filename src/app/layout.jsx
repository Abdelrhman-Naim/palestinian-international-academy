import './globals.css';
import { Providers } from './providers';

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#12100e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL('https://palestine-international-academy.netlify.app'),
  title: {
    default: 'أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة',
    template: '%s | أكاديمية فلسطين الدولية (PIA)',
  },
  description: 'منصة تعليمية وتدريبية معتمدة تقدم دورات احترافية في البرمجة والذكاء الاصطناعي، ومكتبة رقمية ومختبرات تفاعلية بشهادات موثوقة.',
  applicationName: 'PIA Academy',
  authors: [{ name: 'أكاديمية فلسطين الدولية (PIA)' }],
  generator: 'Next.js',
  keywords: [
    'أكاديمية فلسطين الدولية',
    'PIA Academy',
    'دورات برمجة في فلسطين',
    'تعليم الذكاء الاصطناعي',
    'شهادات معتمدة فلسطين',
    'مكتبة رقمية',
    'مختبر افتراضي سحابي',
    'دورات تدريبية أونلاين',
  ],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png?v=3', sizes: '128x128', type: 'image/png' },
      { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    alternateLocale: ['en_US'],
    url: 'https://palestine-international-academy.netlify.app/',
    siteName: 'أكاديمية فلسطين الدولية | PIA',
    title: 'أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة',
    description: 'منصة تعليمية وتدريبية معتمدة تقدم دورات احترافية في البرمجة والذكاء الاصطناعي، ومكتبة رقمية ومختبرات تفاعلية بشهادات موثوقة.',
    images: [
      {
        url: '/screen.png',
        width: 1200,
        height: 630,
        alt: 'أكاديمية فلسطين الدولية (PIA)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة',
    description: 'منصة تعليمية وتدريبية معتمدة تقدم دورات احترافية في البرمجة والذكاء الاصطناعي ومكتبة رقمية تفاعلية.',
    images: ['/screen.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'PIA Academy',
    'geo.region': 'PS',
    'geo.placename': 'Palestine',
    'geo.position': '31.9522;35.2332',
    'ICBM': '31.9522, 35.2332',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Cairo:wght@300;400;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#12100e] text-dark dark:text-gray-100 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
