export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('39d173aa5401fbd47ac7d9b46ffeeec13c05fed59f087648', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
