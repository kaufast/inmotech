import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cleanup endpoint for expired tokens and inactive accounts
// Should be called by cron job or background task
export async function POST(request: NextRequest) {
  try {
    // Security: Only allow this endpoint to be called from internal sources
    const authHeader = request.headers.get('Authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET || 'fallback-secret';
    
    if (authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    let totalCleaned = 0;

    // 1. Clean up expired email verification tokens (older than 48 hours)
    const expiredVerificationTokens = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const expiredEmailTokensCleanup = await prisma.user.updateMany({
      where: {
        emailVerificationExpiry: { lt: expiredVerificationTokens },
        isVerified: false
      },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });
    totalCleaned += expiredEmailTokensCleanup.count;
    console.log(`🧹 Cleaned up ${expiredEmailTokensCleanup.count} expired email verification tokens`);

    // 2. Clean up expired password reset tokens (older than 2 hours)
    const expiredPasswordTokens = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const expiredPasswordResetCleanup = await prisma.user.updateMany({
      where: {
        passwordResetExpiry: { lt: expiredPasswordTokens }
      },
      data: {
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });
    totalCleaned += expiredPasswordResetCleanup.count;
    console.log(`🧹 Cleaned up ${expiredPasswordResetCleanup.count} expired password reset tokens`);

    // 3. Clean up expired refresh tokens
    const expiredRefreshTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isRevoked: true }
        ]
      }
    });
    totalCleaned += expiredRefreshTokens.count;
    console.log(`🧹 Cleaned up ${expiredRefreshTokens.count} expired/revoked refresh tokens`);

    // 4. Mark inactive user sessions as expired (inactive for more than 30 days)
    const inactiveSessionCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inactiveSessionsCleanup = await prisma.userSession.updateMany({
      where: {
        lastActivity: { lt: inactiveSessionCutoff },
        isActive: true
      },
      data: {
        isActive: false,
        terminatedAt: now,
        terminatedBy: 'system_cleanup'
      }
    });
    totalCleaned += inactiveSessionsCleanup.count;
    console.log(`🧹 Marked ${inactiveSessionsCleanup.count} inactive sessions as expired`);

    // 5. Delete old sessions that have been inactive for more than 90 days
    const veryOldSessionCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oldSessionsDeleted = await prisma.userSession.deleteMany({
      where: {
        lastActivity: { lt: veryOldSessionCutoff },
        isActive: false
      }
    });
    console.log(`🗑️  Deleted ${oldSessionsDeleted.count} very old inactive sessions`);

    // 6. Reset login attempts for users locked for more than 24 hours
    const lockoutResetCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lockoutReset = await prisma.user.updateMany({
      where: {
        lockedUntil: { lt: lockoutResetCutoff },
        loginAttempts: { gt: 0 }
      },
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    });
    console.log(`🔓 Reset login attempts for ${lockoutReset.count} previously locked accounts`);

    // 7. Optional: Delete unverified accounts older than 30 days (commented out by default)
    /*
    const oldUnverifiedCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oldUnverifiedAccounts = await prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: { lt: oldUnverifiedCutoff },
        emailVerificationReminders: { gte: 3 } // Only delete accounts that have been reminded
      }
    });
    console.log(`🗑️  Deleted ${oldUnverifiedAccounts.count} old unverified accounts`);
    */

    return NextResponse.json({
      message: 'Cleanup completed successfully',
      totalCleaned,
      details: {
        expiredEmailTokens: expiredEmailTokensCleanup.count,
        expiredPasswordTokens: expiredPasswordResetCleanup.count,
        expiredRefreshTokens: expiredRefreshTokens.count,
        inactiveSessions: inactiveSessionsCleanup.count,
        deletedOldSessions: oldSessionsDeleted.count,
        resetLockouts: lockoutReset.count
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}