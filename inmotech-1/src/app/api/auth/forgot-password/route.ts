import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generatePasswordResetToken, hashResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/sesClient';
import { rateLimit } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per 15 minutes per IP
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000,
      keyGenerator: (req) => req.ip || 'unknown'
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        passwordResetToken: true,
        passwordResetExpires: true 
      }
    });

    if (!user) {
      // Still return success to prevent email enumeration
      return successResponse;
    }

    // Check if there's already a recent reset request (prevent spam)
    if (user.passwordResetExpires && user.passwordResetExpires > new Date()) {
      return successResponse;
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const hashedToken = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store hashed token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      }
    });

    // Send email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    
    let emailSent = false;
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetLink);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      emailSent = false;
    }

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
      // Still return success to prevent information leakage
    }

    // Log the attempt for security monitoring
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'USER',
        details: JSON.stringify({ email: user.email }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return successResponse;

  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}