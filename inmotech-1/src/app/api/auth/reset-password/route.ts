import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashResetToken, hashPassword, invalidateAllUserSessions } from '@/lib/auth';
import { sendPlainEmail } from '@/lib/sesClient';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = resetPasswordSchema.parse(body);

    // Hash the provided token to compare with stored hash
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      },
      select: { 
        id: true, 
        email: true,
        firstName: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Reset login attempts on successful password reset
        loginAttempts: 0,
        lockUntil: null,
      }
    });

    // Invalidate all existing sessions for security
    await invalidateAllUserSessions(user.id);

    // Send confirmation email
    try {
      const confirmationBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Password Reset Successful</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your password has been successfully reset for your InmoTech account.</p>
          <p>If you did not request this change, please contact our support team immediately.</p>
          <p>For security reasons, all your existing sessions have been logged out.</p>
          <br>
          <p>Best regards,<br>The InmoTech Team</p>
        </div>
      `;
      
      await sendPlainEmail(
        user.email, 
        'Password Reset Successful - InmoTech', 
        confirmationBody
      );
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Don't fail the reset if email fails
    }

    // Log the password reset for security monitoring
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'USER',
        details: JSON.stringify({ email: user.email }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      message: 'Password has been reset successfully. Please log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
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