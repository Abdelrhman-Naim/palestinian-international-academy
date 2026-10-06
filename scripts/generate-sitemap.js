import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://palestine-international-academy.netlify.app';
const TODAY = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'daily', hasImage: true },
  { url: '/courses', priority: '0.9', changefreq: 'daily' },
  { url: '/library', priority: '0.9', changefreq: 'daily' },
  { url: '/virtual-lab', priority: '0.85', changefreq: 'weekly' },
  { url: '/verify-certificate', priority: '0.85', changefreq: 'weekly' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/contact', priority: '0.8', changefreq: 'monthly' },
  { url: '/partnerships', priority: '0.75', changefreq: 'monthly' },
  { url: '/support', priority: '0.7', changefreq: 'monthly' },
  { url: '/register', priority: '0.65', changefreq: 'monthly' },
  { url: '/login', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { url: '/terms', priority: '0.5', changefreq: 'yearly' },
];

function generateSitemapXml(routes) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  for (const route of routes) {
    const loc = `${BASE_URL}${route.url === '/' ? '' : route.url}`;
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
      <image:loc>${BASE_URL}/screen.png</image:loc>
      <image:title>أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة</image:title>
      <image:caption>منصة تدريبية وتعليمية معتمدة تقدم دورات تقنية ومكتبة رقمية ومختبرات سحابية</image:caption>
    </image:image>`;
    }

    xml += `
  </url>
`;
  }

  xml += `</urlset>\n`;
  return xml;
}

const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
const content = generateSitemapXml(staticRoutes);
fs.writeFileSync(sitemapPath, content, 'utf8');
console.log(`✅ Sitemap successfully generated at: ${sitemapPath} with ${staticRoutes.length} URLs.`);
