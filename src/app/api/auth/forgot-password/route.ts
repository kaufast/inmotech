import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();

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

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('❌ Password reset requested for non-existent email:', email);
      return NextResponse.json({
        message: 'If an account exists, a reset email has been sent'
      });
    }

    console.log('✅ Password reset requested for existing user:', user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.firstName || 'User',
        resetToken
      );
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't expose email errors to user
    }

    // Development: Log reset URL to console for testing
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/en-GB/reset-password?token=${resetToken}`;
    console.log('🔑 PASSWORD RESET URL (For Testing):');
    console.log('📧 Email:', user.email);
    console.log('🔗 Reset URL:', resetUrl);
    console.log('⏰ Expires in 1 hour');
    console.log('=' .repeat(80));

    return NextResponse.json({
      message: 'If an account exists, a reset email has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}