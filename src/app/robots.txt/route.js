export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'palestine-international-academy.netlify.app';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const cleanHost = host.split(':')[0];
  const baseUrl = `${proto}://${cleanHost}`;

  const content = `# Robots.txt for Palestinian International Academy (PIA)
# Domain: ${baseUrl}

User-agent: *
Allow: /
Allow: /courses
Allow: /courses/*
Allow: /library
Allow: /library/*
Allow: /about
Allow: /contact
Allow: /virtual-lab
Allow: /partnerships
Allow: /verify-certificate
Allow: /support
Allow: /privacy
Allow: /terms
Allow: /login
Allow: /login-trainer
Allow: /register

# Disallow Private Dashboards & Admin Areas
Disallow: /admin-dashboard
Disallow: /admin-dashboard/
Disallow: /AdminDashboard
Disallow: /AdminDashboard/
Disallow: /instructor-dashboard
Disallow: /instructor-dashboard/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /chat
Disallow: /login-admin
Disallow: /forgot-password
Disallow: /*?*token=
Disallow: /*?*auth=

# Modern AI Search Crawlers & LLM Engines (GEO - Generative Engine Optimization)
User-agent: GPTBot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: ChatGPT-User
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: ClaudeBot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: Claude-Web
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: anthropic-ai
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: PerplexityBot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: Google-Extended
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: Googlebot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: Bingbot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

User-agent: Applebot
Allow: /
Disallow: /admin-dashboard/
Disallow: /instructor-dashboard/
Disallow: /dashboard/

# Sitemaps & Host Definition
Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
