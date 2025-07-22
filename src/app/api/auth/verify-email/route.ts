import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auditLog, AuditEventType, AuditEventAction, AuditSeverity } from '@/lib/audit-log';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with matching verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        isVerified: false
      }
    });

    if (!user) {
      // Log failed verification attempt
      await auditLog.log({
        eventType: AuditEventType.EMAIL_VERIFICATION_FAILED,
        eventAction: AuditEventAction.FAILURE,
        severity: AuditSeverity.WARNING,
        metadata: { 
          reason: 'invalid_token',
          token: token.substring(0, 8) + '...' // Log partial token for debugging
        },
        request
      });
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired (24 hours default)
    const now = new Date();
    if (user.emailVerificationExpiry && user.emailVerificationExpiry < now) {
      // Clean up expired token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null
        }
      });

      // Log expired token attempt
      await auditLog.log({
        eventType: AuditEventType.EMAIL_VERIFICATION_FAILED,
        eventAction: AuditEventAction.FAILURE,
        severity: AuditSeverity.WARNING,
        userId: user.id,
        metadata: { 
          reason: 'expired_token',
          email: user.email,
          expiredAt: user.emailVerificationExpiry.toISOString()
        },
        request
      });
      
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        emailVerificationReminders: 0,
        lastVerificationEmailSent: null
      }
    });

    // Log successful email verification
    await auditLog.log({
      eventType: AuditEventType.EMAIL_VERIFIED,
      eventAction: AuditEventAction.SUCCESS,
      userId: user.id,
      metadata: { 
        email: user.email,
        verificationTime: new Date().toISOString()
      },
      request
    });

    return NextResponse.json({
      message: 'Email verified successfully',
      success: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Resend verification email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: 'If an account exists, a verification email has been sent'
      });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Account is already verified' },
        { status: 400 }
      );
    }

    // Rate limiting: Check if last email was sent recently (5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (user.lastVerificationEmailSent && user.lastVerificationEmailSent > fiveMinutesAgo) {
      return NextResponse.json(
        { error: 'Please wait 5 minutes before requesting another verification email' },
        { status: 429 }
      );
    }

    // Limit total reminders to 5 per account
    if (user.emailVerificationReminders >= 5) {
      return NextResponse.json(
        { error: 'Maximum verification attempts reached. Please contact support.' },
        { status: 429 }
      );
    }

    // Generate new verification token (always generate new for security)
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: expiresAt,
        emailVerificationReminders: user.emailVerificationReminders + 1,
        lastVerificationEmailSent: now
      }
    });

    // Send verification email (using existing email service)
    try {
      const { emailService } = await import('@/lib/email');
      await emailService.sendWelcomeEmail(
        user.email,
        user.firstName || 'User',
        verificationToken
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't expose email errors to user
    }

    // Development: Log verification URL to console for testing
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/en-GB/verify-email?token=${verificationToken}`;
    console.log('📧 EMAIL VERIFICATION RESEND (For Testing):');
    console.log('👤 User:', user.email);  
    console.log('🔗 Verification URL:', verificationUrl);
    console.log('=' .repeat(80));

    return NextResponse.json({
      message: 'If an account exists, a verification email has been sent'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}