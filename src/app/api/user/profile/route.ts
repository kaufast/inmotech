import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/api-middleware';

// Force Node.js runtime
export const runtime = 'nodejs';

// Get user profile handler
async function getProfileHandler(request: NextRequest) {
  try {
    // User is already authenticated by middleware
    const user = (request as any).user;
    
    // Fetch full user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isAdmin: true,
        kycStatus: true,
        createdAt: true,
        lastLogin: true,
        preferences: true,
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
                description: true
              }
            }
          }
        },
        investments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                title: true,
                expectedReturn: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Export handlers with middleware
export const GET = withMiddleware(getProfileHandler, {
  requireAuth: true,
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
  }
});

export const OPTIONS = withMiddleware(
  () => new NextResponse(null, { status: 200 }),
  { cors: { credentials: true } }
);