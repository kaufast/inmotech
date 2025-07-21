import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/jwt-middleware';

export const runtime = 'edge';

// Test endpoint for JWT verification
async function handler(request: NextRequest, user: AuthenticatedUser): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    message: 'JWT verification successful',
    user: {
      userId: user.userId,
      email: user.email,
      iat: user.iat,
      exp: user.exp,
      expiresAt: new Date(user.exp * 1000).toISOString()
    },
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Export the protected handler
export const POST = withAuth(handler);
export const GET = withAuth(handler);