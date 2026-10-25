import { supabase } from '../../supabase/client.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'palestine-international-academy.netlify.app';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  // Strip any port if standard
  const cleanHost = host.split(':')[0];
  const baseUrl = `${proto}://${cleanHost}`;
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily', hasImage: true },
    { url: '/courses', priority: '0.95', changefreq: 'daily' },
    { url: '/library', priority: '0.95', changefreq: 'daily' },
    { url: '/virtual-lab', priority: '0.85', changefreq: 'weekly' },
    { url: '/verify-certificate', priority: '0.85', changefreq: 'weekly' },
    { url: '/about', priority: '0.80', changefreq: 'weekly' },
    { url: '/contact', priority: '0.80', changefreq: 'monthly' },
    { url: '/partnerships', priority: '0.75', changefreq: 'monthly' },
    { url: '/support', priority: '0.70', changefreq: 'monthly' },
    { url: '/register', priority: '0.65', changefreq: 'monthly' },
    { url: '/login', priority: '0.60', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.50', changefreq: 'yearly' },
    { url: '/terms', priority: '0.50', changefreq: 'yearly' },
  ];

  let courses = [];
  let books = [];
  try {
    const { data: c } = await supabase.from('courses').select('id, title');
    if (c) courses = c;
  } catch (e) {}

  try {
    const { data: b } = await supabase.from('books').select('id, title').limit(30);
    if (b) books = b;
  } catch (e) {}

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const page of staticRoutes) {
    const loc = page.url === '/' ? `${baseUrl}/` : `${baseUrl}${page.url}`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${loc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />\n`;
    if (page.hasImage) {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${baseUrl}/screen.webp</image:loc>\n`;
      xml += '      <image:title>أكاديمية فلسطين الدولية (PIA) - المنصة التعليمية الرائدة</image:title>\n';
      xml += '      <image:caption>منصة تدريبية وتعليمية معتمدة تقدم دورات تقنية ومكتبة رقمية ومختبرات سحابية</image:caption>\n';
      xml += '    </image:image>\n';
    }
    xml += '  </url>\n';
  }

  for (const c of courses) {
    const cLoc = `${baseUrl}/courses/${c.id}`;
    xml += '  <url>\n';
    xml += `    <loc>${cLoc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.85</priority>\n';
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${cLoc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${cLoc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${cLoc}" />\n`;
    xml += '  </url>\n';
  }

  for (const b of books) {
    const bLoc = `${baseUrl}/library/${b.id}`;
    xml += '  <url>\n';
    xml += `    <loc>${bLoc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.75</priority>\n';
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${bLoc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${bLoc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${bLoc}" />\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
