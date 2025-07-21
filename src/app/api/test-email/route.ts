import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { verifyAuth } from '@/lib/auth-middleware';

// POST /api/test-email - Test email sending (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Check if user is admin (optional - remove for testing)
    const { searchParams } = new URL(request.url);
    const skipAdminCheck = searchParams.get('skipAdminCheck') === 'true';
    
    if (!skipAdminCheck) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: authResult.userId }
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const { to, type = 'simple', data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let result = { success: false, message: '' };

    switch (type) {
      case 'simple':
        await emailService.sendEmail(
          to,
          'Test Email from InmoTech',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ED4F01;">Test Email</h1>
              <p>This is a test email from your InmoTech platform.</p>
              <p>If you received this email, your AWS SES configuration is working correctly!</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Configuration:</strong></p>
                <p>Region: ${process.env.AWS_REGION || 'Not set'}</p>
                <p>From: ${process.env.SES_FROM_EMAIL || 'Not set'}</p>
                <p>Time: ${new Date().toISOString()}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                This is a test email. No action required.
              </p>
            </div>
          `
        );
        result = { success: true, message: 'Simple test email sent' };
        break;

      case 'welcome':
        await emailService.sendWelcomeEmail(
          to,
          data?.firstName || 'Test User',
          'test-verification-token-123'
        );
        result = { success: true, message: 'Welcome email sent' };
        break;

      case 'reset':
        await emailService.sendPasswordResetEmail(
          to,
          data?.firstName || 'Test User',
          'test-reset-token-123'
        );
        result = { success: true, message: 'Password reset email sent' };
        break;

      case 'investment':
        await emailService.sendInvestmentConfirmation(
          to,
          {
            firstName: data?.firstName || 'Test User',
            projectTitle: data?.projectTitle || 'Madrid Luxury Residences',
            amount: data?.amount || '10,000',
            currency: data?.currency || 'EUR',
            transactionId: data?.transactionId || 'TEST-TXN-123'
          }
        );
        result = { success: true, message: 'Investment confirmation email sent' };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: simple, welcome, reset, or investment' },
          { status: 400 }
        );
    }

    // Log email send for debugging
    console.log('Email sent:', {
      to,
      type,
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION,
      from: process.env.SES_FROM_EMAIL
    });

    return NextResponse.json({
      ...result,
      details: {
        to,
        type,
        from: process.env.SES_FROM_EMAIL,
        region: process.env.AWS_REGION,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email test error:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAwsError = errorMessage.includes('AWS') || errorMessage.includes('SES');
    
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: errorMessage,
        troubleshooting: isAwsError ? {
          checkCredentials: 'Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
          checkRegion: 'Ensure AWS_REGION matches your SES configuration',
          checkSender: 'Verify SES_FROM_EMAIL is verified in SES console',
          checkPermissions: 'Ensure IAM user has SES send permissions'
        } : null
      },
      { status: 500 }
    );
  }
}