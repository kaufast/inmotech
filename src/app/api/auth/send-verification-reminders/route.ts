import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// This endpoint should be called by a cron job or background task
// It sends reminder emails to unverified users at specific intervals
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
    
    // Find users who need verification reminders
    // Send first reminder after 24 hours, second after 72 hours, third after 1 week
    const reminderIntervals = [
      { hours: 24, reminderCount: 0 },  // First reminder after 1 day
      { hours: 72, reminderCount: 1 },  // Second reminder after 3 days  
      { hours: 168, reminderCount: 2 }  // Third reminder after 1 week
    ];

    let totalEmailsSent = 0;

    for (const interval of reminderIntervals) {
      const cutoffTime = new Date(now.getTime() - interval.hours * 60 * 60 * 1000);
      
      // Find users who registered/last received email before cutoff and need this reminder
      const usersNeedingReminder = await prisma.user.findMany({
        where: {
          isVerified: false,
          emailVerificationReminders: interval.reminderCount,
          OR: [
            { lastVerificationEmailSent: { lte: cutoffTime } },
            { 
              AND: [
                { lastVerificationEmailSent: null },
                { createdAt: { lte: cutoffTime } }
              ]
            }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          emailVerificationToken: true,
          emailVerificationExpiry: true,
          emailVerificationReminders: true
        },
        take: 100 // Process in batches
      });

      console.log(`Found ${usersNeedingReminder.length} users needing reminder ${interval.reminderCount + 1}`);

      for (const user of usersNeedingReminder) {
        try {
          // Check if verification token is still valid or generate new one
          let verificationToken = user.emailVerificationToken;
          let needsTokenUpdate = false;

          if (!verificationToken || (user.emailVerificationExpiry && user.emailVerificationExpiry < now)) {
            verificationToken = crypto.randomUUID();
            const newExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
            needsTokenUpdate = true;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpiry: newExpiry
              }
            });
          }

          // Send reminder email
          const { emailService } = await import('@/lib/email');
          await emailService.sendWelcomeEmail(
            user.email,
            user.firstName || 'User',
            verificationToken!,
            true // isReminder = true
          );

          // Update reminder count and timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerificationReminders: user.emailVerificationReminders + 1,
              lastVerificationEmailSent: now
            }
          });

          totalEmailsSent++;
          console.log(`✅ Sent reminder ${interval.reminderCount + 1} to ${user.email}`);

        } catch (emailError) {
          console.error(`❌ Failed to send reminder to ${user.email}:`, emailError);
          // Continue with other users even if one fails
        }
      }
    }

    // Clean up expired verification tokens (older than 48 hours)
    const expiredTokenCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const expiredTokenCleanup = await prisma.user.updateMany({
      where: {
        emailVerificationExpiry: { lt: expiredTokenCutoff },
        isVerified: false
      },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });

    console.log(`🧹 Cleaned up ${expiredTokenCleanup.count} expired verification tokens`);

    return NextResponse.json({
      message: 'Verification reminders processed successfully',
      emailsSent: totalEmailsSent,
      expiredTokensCleanedUp: expiredTokenCleanup.count
    });

  } catch (error) {
    console.error('Verification reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}