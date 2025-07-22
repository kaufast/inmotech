import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifySecureJWT } from '@/lib/edge-crypto';

export const runtime = 'edge';

const prisma = new PrismaClient();

// Revoke specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

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

    // Find the session to revoke (ensure it belongs to the current user)
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: payload.userId
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Revoke the session
    await prisma.userSession.update({
      where: {
        id: sessionId
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('Revoke specific session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}