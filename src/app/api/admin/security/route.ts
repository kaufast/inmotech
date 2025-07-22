import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';

const prisma = new PrismaClient();

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const severity = searchParams.get('severity') || '';
    const timeRange = searchParams.get('timeRange') || '24h';

    const offset = (page - 1) * limit;

    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': new Date(now.getTime() - 1 * 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    const fromDate = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h'];

    // Failed login attempts
    const failedLogins = await prisma.user.findMany({
      where: {
        loginAttempts: { gt: 0 },
        updatedAt: { gte: fromDate }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loginAttempts: true,
        lockedUntil: true,
        lastLogin: true,
        updatedAt: true
      },
      orderBy: { loginAttempts: 'desc' },
      take: limit
    });

    // Recently terminated sessions (mock data until schema deployed)
    const terminatedSessions = [] as any[];

    // Suspicious activity - users with multiple IPs in short time
    const suspiciousLogins = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        COUNT(DISTINCT us.ip_address) as unique_ips,
        COUNT(*) as session_count,
        MIN(us.created_at) as first_session,
        MAX(us.created_at) as last_session,
        array_agg(DISTINCT us.ip_address) as ip_addresses
      FROM users u
      INNER JOIN user_sessions us ON u.id = us.user_id
      WHERE us.created_at >= ${fromDate}
      GROUP BY u.id, u.email, u.first_name, u.last_name
      HAVING COUNT(DISTINCT us.ip_address) >= 2
      ORDER BY unique_ips DESC, session_count DESC
      LIMIT ${limit}
    ` as any[];

    // Account lockouts
    const lockedAccounts = await prisma.user.findMany({
      where: {
        lockedUntil: { gte: now }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loginAttempts: true,
        lockedUntil: true,
        updatedAt: true
      },
      orderBy: { lockedUntil: 'desc' }
    });

    // Recently created admin accounts (potential privilege escalation)
    const newAdminAccounts = await prisma.user.findMany({
      where: {
        isAdmin: true,
        updatedAt: { gte: fromDate }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Security statistics
    const securityStats = {
      failedLoginAttempts: failedLogins.reduce((sum, user) => sum + user.loginAttempts, 0),
      lockedAccounts: lockedAccounts.length,
      suspiciousActivity: suspiciousLogins.length,
      terminatedSessions: terminatedSessions.length,
      newAdminAccounts: newAdminAccounts.length
    };

    // Mock additional security events (in a real system, these would come from audit logs)
    const mockSecurityEvents = [
      {
        id: 'evt_1',
        type: 'password_reset_requested',
        severity: 'medium',
        description: 'Password reset requested from unusual location',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.100'
      },
      {
        id: 'evt_2',
        type: 'multiple_failed_2fa',
        severity: 'high',
        description: 'Multiple failed 2FA attempts detected',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        userEmail: 'suspicious@example.com',
        ipAddress: '10.0.0.50'
      },
      {
        id: 'evt_3',
        type: 'admin_action',
        severity: 'low',
        description: 'User permissions modified',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        userEmail: 'admin@inmote.ch',
        ipAddress: '203.0.113.1'
      }
    ];

    return NextResponse.json({
      stats: securityStats,
      events: {
        failedLogins: failedLogins.map(user => ({
          id: user.id,
          type: 'failed_login',
          severity: user.loginAttempts >= 5 ? 'high' : 'medium',
          description: `${user.loginAttempts} failed login attempts`,
          timestamp: user.updatedAt.toISOString(),
          userEmail: user.email,
          userName: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
          details: {
            attempts: user.loginAttempts,
            lockedUntil: user.lockedUntil?.toISOString(),
            lastLogin: user.lastLogin?.toISOString()
          }
        })),
        terminatedSessions: [],
        suspiciousActivity: suspiciousLogins.map(activity => ({
          id: `suspicious_${activity.id}`,
          type: 'suspicious_login',
          severity: activity.unique_ips >= 3 ? 'high' : 'medium',
          description: `Login from ${activity.unique_ips} different IP addresses`,
          timestamp: activity.last_session,
          userEmail: activity.email,
          userName: activity.firstName || activity.lastName ? `${activity.firstName || ''} ${activity.lastName || ''}`.trim() : null,
          details: {
            uniqueIps: activity.unique_ips,
            sessionCount: activity.session_count,
            ipAddresses: activity.ip_addresses,
            timespan: `${Math.round((new Date(activity.last_session).getTime() - new Date(activity.first_session).getTime()) / (1000 * 60))} minutes`
          }
        })),
        lockedAccounts: lockedAccounts.map(user => ({
          id: `locked_${user.id}`,
          type: 'account_locked',
          severity: 'high',
          description: 'Account locked due to failed login attempts',
          timestamp: user.updatedAt.toISOString(),
          userEmail: user.email,
          userName: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
          details: {
            attempts: user.loginAttempts,
            lockedUntil: user.lockedUntil?.toISOString()
          }
        })),
        newAdminAccounts: newAdminAccounts.map(user => ({
          id: `admin_${user.id}`,
          type: 'privilege_escalation',
          severity: 'high',
          description: 'New admin account created or privileges granted',
          timestamp: user.updatedAt.toISOString(),
          userEmail: user.email,
          userName: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
          details: {
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
          }
        })),
        mockEvents: mockSecurityEvents
      },
      timeRange,
      totalEvents: failedLogins.length + terminatedSessions.length + suspiciousLogins.length + lockedAccounts.length + newAdminAccounts.length + mockSecurityEvents.length
    });

  } catch (error) {
    console.error('Admin security events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});