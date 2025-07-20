import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generatePasswordResetToken, hashResetToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/sesClient';
import { rateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registrations per hour per IP
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 5,
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
    const { email, password, firstName, lastName, phone, acceptTerms } = registerSchema.parse(body);

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isEmailVerified: true }
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please login instead.' },
          { status: 409 }
        );
      } else {
        // User exists but email not verified - we'll update their info and resend verification
        const hashedPassword = await hashPassword(password);
        const verificationToken = generatePasswordResetToken();
        const hashedVerificationToken = hashResetToken(verificationToken);
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            passwordResetToken: hashedVerificationToken,
            passwordResetExpires: verificationExpires,
          }
        });

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
        
        try {
          await sendWelcomeEmail(normalizedEmail, firstName, verificationLink);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }

        return NextResponse.json({
          message: 'Registration updated! Please check your email to verify your account.',
          emailSent: true
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate email verification token
    const verificationToken = generatePasswordResetToken();
    const hashedVerificationToken = hashResetToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'USER',
        kycStatus: 'NOT_STARTED',
        isEmailVerified: false,
        investmentLimit: 0, // Will be set after KYC approval
        passwordResetToken: hashedVerificationToken,
        passwordResetExpires: verificationExpires,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        isEmailVerified: true,
        createdAt: true,
      }
    });

    // Send welcome email with verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
    
    let emailSent = false;
    try {
      await sendWelcomeEmail(normalizedEmail, firstName, verificationLink);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
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
      user: newUser,
      message: 'Registration successful! Please check your email to verify your account.',
      emailSent
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
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