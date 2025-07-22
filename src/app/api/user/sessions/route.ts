import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifySecureJWT } from '@/lib/edge-crypto';

export const runtime = 'edge';

const prisma = new PrismaClient();

// Get all user sessions
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    
    // Verify JWT token
    let payload;
    try {
      payload = await verifySecureJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get all active sessions for the user
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        sessionToken: true,
        deviceInfo: true,
        ipAddress: true,
        location: true,
        lastActivity: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    // Determine current session (if token matches any session)
    const currentSessionToken = request.headers.get('X-Session-Token');
    
    const sessionsWithStatus = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionToken === currentSessionToken
    }));

    return NextResponse.json({
      sessions: sessionsWithStatus,
      total: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Revoke all other sessions (except current)
export async function DELETE(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    
    // Verify JWT token
    let payload;
    try {
      payload = await verifySecureJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get current session token to preserve it
    const currentSessionToken = request.headers.get('X-Session-Token');
    
    // Revoke all other sessions
    const revokedSessions = await prisma.userSession.updateMany({
      where: {
        userId: payload.userId,
        sessionToken: {
          not: currentSessionToken || 'none'
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      message: 'All other sessions revoked successfully',
      revokedCount: revokedSessions.count
    });

  } catch (error) {
    console.error('Revoke sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}