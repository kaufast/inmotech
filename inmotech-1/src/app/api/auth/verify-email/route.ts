import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashResetToken } from '@/lib/auth';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = verifyEmailSchema.parse(body);

    const normalizedEmail = email.toLowerCase();
    const hashedToken = hashResetToken(token);

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        },
        isEmailVerified: false // Only verify if not already verified
      },
      select: { 
        id: true, 
        email: true,
        firstName: true,
        isEmailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified. You can now log in.' }
      );
    }

    // Update user to verified status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
        // Set basic investment limit for verified users
        investmentLimit: 10000, // €10,000 default limit, can be increased with KYC
      }
    });

    // Log email verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        resource: 'USER',
        details: JSON.stringify({ email: user.email }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      message: 'Email verified successfully! You can now log in and start investing.',
      verified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}