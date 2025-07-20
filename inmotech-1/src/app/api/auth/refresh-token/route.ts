import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { 
  validateRefreshToken, 
  generateAccessToken,
  type TokenPayload 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Validate refresh token
    const validationResult = await validateRefreshToken(refreshToken);
    if (!validationResult) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const { userId, sessionId } = validationResult;

    // Get user data for new access token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        kycStatus: true,
        isEmailVerified: true,
        firstName: true,
        lastName: true,
        investmentLimit: true,
        totalInvested: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Generate new access token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };
    const accessToken = generateAccessToken(tokenPayload);

    // Log token refresh
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TOKEN_REFRESHED',
        resource: 'USER',
        details: JSON.stringify({ sessionId }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      accessToken,
      user,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}