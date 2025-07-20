import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generatePasswordResetToken, hashResetToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/sesClient';
import { rateLimit } from '@/lib/rate-limit';

const preRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 pre-registrations per hour per IP
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyGenerator: (req) => req.ip || 'unknown'
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName } = preRegisterSchema.parse(body);

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { 
        id: true, 
        isEmailVerified: true,
        passwordResetExpires: true 
      }
    });

    if (existingUser?.isEmailVerified) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    // Check if there's already a recent verification request (prevent spam)
    if (existingUser?.passwordResetExpires && existingUser.passwordResetExpires > new Date()) {
      return NextResponse.json({
        message: 'Verification email already sent. Please check your inbox and spam folder.',
        emailSent: true
      });
    }

    // Generate verification token
    const verificationToken = generatePasswordResetToken();
    const hashedVerificationToken = hashResetToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create temporary user record or update existing one
    if (existingUser) {
      // Update existing unverified user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName,
          lastName,
          passwordResetToken: hashedVerificationToken,
          passwordResetExpires: verificationExpires,
        }
      });
    } else {
      // Create new temporary user record
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: '', // Will be set during actual registration
          firstName,
          lastName,
          role: 'USER',
          kycStatus: 'NOT_STARTED',
          isEmailVerified: false,
          investmentLimit: 0,
          passwordResetToken: hashedVerificationToken,
          passwordResetExpires: verificationExpires,
        }
      });
    }

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/complete-registration?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
    
    let emailSent = false;
    try {
      await sendWelcomeEmail(normalizedEmail, firstName, verificationLink);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    // Log pre-registration attempt
    await prisma.auditLog.create({
      data: {
        action: 'PRE_REGISTRATION_INITIATED',
        resource: 'USER',
        details: JSON.stringify({ 
          email: normalizedEmail,
          firstName,
          lastName,
          emailSent 
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      message: 'Please check your email to complete registration. The verification link expires in 24 hours.',
      emailSent,
      expiresIn: '24 hours'
    });

  } catch (error) {
    console.error('Pre-registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}