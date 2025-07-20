import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the current token (even if expired)
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      // Token might be expired, try to decode without verification
      payload = jwt.decode(token) as { userId: string };
      if (!payload?.userId) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    // Get user and valid refresh token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        refreshTokens: {
          where: {
            expiresAt: { gt: new Date() },
            isRevoked: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.refreshTokens.length === 0) {
      return NextResponse.json(
        { error: 'No valid refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { 
      expiresIn: '15m' 
    });

    // Optionally rotate refresh token (recommended for security)
    const shouldRotateRefresh = Math.random() < 0.1; // 10% chance
    if (shouldRotateRefresh) {
      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: user.refreshTokens[0].id },
        data: { isRevoked: true },
      });

      // Create new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: jwt.sign({ userId: user.id }, REFRESH_SECRET, { 
            expiresIn: '7d' 
          }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}