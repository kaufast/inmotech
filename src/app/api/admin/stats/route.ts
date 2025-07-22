import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';

const prisma = new PrismaClient();

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get verified users
    const verifiedUsers = await prisma.user.count({
      where: { isVerified: true }
    });
    
    // Get users with 2FA enabled
    const twoFactorEnabled = await prisma.user.count({
      where: { twoFactorEnabled: true }
    });
    
    // Get active sessions (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeSessions = await prisma.userSession.count({
      where: {
        isActive: true,
        lastActivity: {
          gte: thirtyMinutesAgo
        }
      }
    });
    
    // Get total sessions
    const totalSessions = await prisma.userSession.count({
      where: { isActive: true }
    });
    
    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Mock data for failed logins and suspicious activity
    // TODO: Implement proper audit logging system
    const failedLogins = Math.floor(Math.random() * 50);
    const suspiciousActivity = Math.floor(Math.random() * 10);

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      activeSessions,
      totalSessions,
      twoFactorEnabled,
      recentSignups,
      failedLogins,
      suspiciousActivity
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});