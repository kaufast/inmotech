import { getSql } from '@/lib/neon-edge';

export const runtime = 'edge';

export async function GET() {
  try {
    const sql = getSql();
    // Test simple query
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    
    return new Response(JSON.stringify({
      status: 'ok',
      database: 'connected',
      userCount: result[0].count,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}