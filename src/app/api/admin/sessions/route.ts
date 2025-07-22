import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';

const prisma = new PrismaClient();

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'lastActivity';
    const order = searchParams.get('order') || 'desc';

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { 
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          user: {
            firstName: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          user: {
            lastName: { contains: search, mode: 'insensitive' }
          }
        },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { deviceName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get sessions with user data and pagination
    const [sessions, totalCount] = await Promise.all([
      prisma.userSession.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isVerified: true,
              isAdmin: true,
              lastLogin: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.userSession.count({ where })
    ]);

    // Get session statistics
    const stats = await prisma.userSession.aggregate({
      _count: {
        _all: true
      },
      where: { isActive: true }
    });

    const activeSessionsCount = stats._count._all;
    
    // Get sessions by device type (mock until schema deployed)
    const deviceStats = [
      { deviceType: 'desktop', _count: { _all: Math.floor(Math.random() * 20) + 10 } },
      { deviceType: 'mobile', _count: { _all: Math.floor(Math.random() * 15) + 5 } },
      { deviceType: 'tablet', _count: { _all: Math.floor(Math.random() * 5) + 1 } }
    ];

    // Get recent suspicious activity (multiple sessions from different locations)
    const suspiciousActivity = await prisma.$queryRaw`
      SELECT 
        u.email,
        COUNT(DISTINCT us.ip_address) as ip_count,
        COUNT(*) as session_count,
        MIN(us.last_activity) as earliest_session,
        MAX(us.last_activity) as latest_session
      FROM user_sessions us
      INNER JOIN users u ON us.user_id = u.id
      WHERE us.is_active = true
        AND us.last_activity > NOW() - INTERVAL '24 hours'
      GROUP BY u.id, u.email
      HAVING COUNT(DISTINCT us.ip_address) > 2
      ORDER BY ip_count DESC, session_count DESC
      LIMIT 10
    ` as any[];

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        activeSessions: activeSessionsCount,
        deviceBreakdown: deviceStats.reduce((acc, item) => {
          acc[item.deviceType || 'unknown'] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        suspiciousActivity: suspiciousActivity.length
      },
      suspiciousActivity
    });

  } catch (error) {
    console.error('Admin sessions list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

export const DELETE = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { sessionId, userId, terminateAll } = body;

    if (terminateAll && userId) {
      // Terminate all sessions for a specific user
      const result = await prisma.userSession.updateMany({
        where: { 
          userId: userId,
          isActive: true 
        },
        data: { 
          isActive: false
        }
      });

      return NextResponse.json({
        message: `Terminated ${result.count} sessions for user`,
        terminatedCount: result.count
      });

    } else if (sessionId) {
      // Terminate specific session
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
        include: { user: { select: { email: true } } }
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      await prisma.userSession.update({
        where: { id: sessionId },
        data: { 
          isActive: false
        }
      });

      return NextResponse.json({
        message: 'Session terminated successfully',
        session: {
          id: session.id,
          userEmail: session.user.email
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Session ID or User ID required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Admin session termination error:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});