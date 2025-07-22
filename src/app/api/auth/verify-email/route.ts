import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null // Clear the token
      }
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

    // Generate new verification token if needed
    let verificationToken = user.emailVerificationToken;
    if (!verificationToken) {
      verificationToken = crypto.randomUUID();
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verificationToken }
      });
    }

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