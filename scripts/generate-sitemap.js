import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_PROJECT_PRODUCTION_URL;
const BASE_URL = isVercel
  ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://palestine-international-academy.vercel.app')
  : (process.env.NEXT_PUBLIC_SITE_URL || 'https://palestine-international-academy.netlify.app');
const TODAY = new Date().toISOString().split('T')[0];

const supabaseUrl = 'https://erdogjeyqxufpsczriat.supabase.co';
const supabaseAnonKey = 'sb_publishable_stz6G3e9pbCTRpRCq_miOA_lmIORu-m';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'daily', hasImage: true },
  { url: '/courses', priority: '0.95', changefreq: 'daily' },
  { url: '/library', priority: '0.95', changefreq: 'daily' },
  { url: '/virtual-lab', priority: '0.85', changefreq: 'weekly' },
  { url: '/verify-certificate', priority: '0.85', changefreq: 'weekly' },
  { url: '/about', priority: '0.8', changefreq: 'weekly' },
  { url: '/contact', priority: '0.8', changefreq: 'monthly' },
  { url: '/partnerships', priority: '0.75', changefreq: 'monthly' },
  { url: '/support', priority: '0.7', changefreq: 'monthly' },
  { url: '/register', priority: '0.65', changefreq: 'monthly' },
  { url: '/login', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { url: '/terms', priority: '0.5', changefreq: 'yearly' },
];

async function generate() {
  const { data: courses } = await supabase.from('courses').select('id, title');
  const { data: books } = await supabase.from('books').select('id, title').limit(30);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  for (const route of staticRoutes) {
    const loc = route.url === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.url}`;
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`;

    if (route.hasImage) {
      xml += `
    <image:image>
      <image:loc>${BASE_URL}/screen.webp</image:loc>
      <image:title>أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة</image:title>
      <image:caption>منصة تدريبية وتعليمية معتمدة تقدم دورات تقنية ومكتبة رقمية ومختبرات سحابية</image:caption>
    </image:image>`;
    }

    xml += `
  </url>
`;
  }

  if (courses && courses.length > 0) {
    for (const c of courses) {
      const cLoc = `${BASE_URL}/courses/${c.id}`;
      xml += `  <url>
    <loc>${cLoc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${cLoc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${cLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${cLoc}" />
  </url>
`;
    }
  }

  if (books && books.length > 0) {
    for (const b of books) {
      const bLoc = `${BASE_URL}/library/${b.id}`;
      xml += `  <url>
    <loc>${bLoc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${bLoc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${bLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${bLoc}" />
  </url>
`;
    }
  }

  xml += `</urlset>\n`;

  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✅ Sitemap successfully generated at: ${sitemapPath} with ${staticRoutes.length + (courses?.length || 0) + (books?.length || 0)} URLs.`);
}

generate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
