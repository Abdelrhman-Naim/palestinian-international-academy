export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('google-site-verification: google119906917dd2fdd3.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
