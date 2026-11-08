export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('9938c5f8aa8c83ac0413a486d5371175a04eccd9131e1460', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
