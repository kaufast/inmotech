import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken, generateRefreshToken } from '@/lib/auth-server';
import { withMiddleware } from '@/lib/api-middleware';
import { loginRateLimiter } from '@/lib/rate-limit';

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Main login handler
async function loginHandler(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user with related data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
        isAdmin: true,
        kycStatus: true,
        lastLogin: true,
        loginAttempts: true,
        lockedUntil: true
      }
    });

    // Check if user exists
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { 
          error: 'Account is temporarily locked. Please try again later.',
          lockedUntil: user.lockedUntil.toISOString()
        },
        { status: 423 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const updateData: any = { loginAttempts: attempts };
      
      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updateData.loginAttempts = 0;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: Math.max(0, 5 - attempts)
        },
        { status: 401 }
      );
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Generate tokens
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        kycStatus: user.kycStatus
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      }
    });

    // Set secure HTTP-only cookie for refresh token
    if (process.env.NODE_ENV === 'production') {
      response.cookies.set('refresh-token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    // Check for specific errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}

// Export handlers with middleware
export const POST = withMiddleware(loginHandler, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts per window
  },
  cors: {
    credentials: true
  }
});

export const OPTIONS = withMiddleware(
  () => new NextResponse(null, { status: 200 }),
  { cors: { credentials: true } }
);