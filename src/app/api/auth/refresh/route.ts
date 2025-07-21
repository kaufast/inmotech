import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateToken, generateToken } from '@/lib/auth-server';
import { withMiddleware } from '@/lib/api-middleware';

// Force Node.js runtime
export const runtime = 'nodejs';

// Input validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Main refresh handler
async function refreshHandler(request: NextRequest) {
  try {
    // Check for refresh token in cookie first
    let refreshToken = request.cookies.get('refresh-token')?.value;
    
    // If not in cookie, check request body
    if (!refreshToken) {
      const body = await request.json();
      const validation = refreshSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Refresh token is required' },
          { status: 400 }
        );
      }
      
      refreshToken = validation.data.refreshToken;
    }

    // Find the refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Generate new access token
    const newAccessToken = generateToken(storedToken.user.id, storedToken.user.email);

    // Return new token
    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

// Export handlers with middleware
export const POST = withMiddleware(refreshHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 10 // 10 requests per minute
  },
  cors: {
    credentials: true
  }
});

export const OPTIONS = withMiddleware(
  () => new NextResponse(null, { status: 200 }),
  { cors: { credentials: true } }
);