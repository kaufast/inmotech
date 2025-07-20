import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { extractTokenFromRequest, verifyAccessToken, clearRefreshTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user info from token
    const token = extractTokenFromRequest(request);
    const payload = token ? verifyAccessToken(token) : null;

    // Get refresh token from cookie
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (payload && payload.sessionId) {
      // Invalidate the session in database
      await prisma.session.updateMany({
        where: { 
          id: payload.sessionId,
          userId: payload.userId 
        },
        data: { isActive: false }
      });

      // Log logout
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: 'USER_LOGOUT',
          resource: 'USER',
          details: JSON.stringify({ 
            sessionId: payload.sessionId,
            logoutType: 'manual' 
          }),
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent'),
        }
      });
    }

    // Clear refresh token cookie
    clearRefreshTokenCookie();

    return NextResponse.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookie even if there's an error
    clearRefreshTokenCookie();
    
    return NextResponse.json(
      { message: 'Logged out successfully' }, // Always return success for logout
      { status: 200 }
    );
  }
}