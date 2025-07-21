export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Basic test endpoint working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}