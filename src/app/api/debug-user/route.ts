import { getSql } from '@/lib/neon-edge';

export const runtime = 'edge';

export async function GET() {
  try {
    const sql = getSql();
    // Get test user info
    const result = await sql`
      SELECT 
        id, 
        email, 
        first_name,
        last_name,
        is_active,
        is_verified,
        CASE 
          WHEN password_hash LIKE '$2%' THEN 'bcrypt'
          ELSE 'other'
        END as hash_type,
        LENGTH(password_hash) as hash_length
      FROM users 
      WHERE email = 'test@example.com'
      LIMIT 1
    `;
    
    return new Response(JSON.stringify({
      status: 'ok',
      user: result[0] || null,
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