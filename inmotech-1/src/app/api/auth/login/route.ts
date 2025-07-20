import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { 
  verifyPassword, 
  generateAccessToken, 
  createSession,
  checkLoginAttempts,
  incrementLoginAttempts,
  resetLoginAttempts,
  setRefreshTokenCookie,
  type TokenPayload 
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    const normalizedEmail = email.toLowerCase();

    // Check rate limiting
    const canAttempt = await checkLoginAttempts(normalizedEmail);
    if (!canAttempt) {
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        isEmailVerified: true,
        investmentLimit: true,
        totalInvested: true,
        loginAttempts: true,
        lockUntil: true,
      }
    });

    if (!user) {
      await incrementLoginAttempts(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      await incrementLoginAttempts(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(normalizedEmail);

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.ip || undefined;
    const { sessionId, refreshToken } = await createSession(user.id, userAgent, ipAddress);

    // Generate access token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };
    const accessToken = generateAccessToken(tokenPayload);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(refreshToken);

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'USER',
        details: JSON.stringify({ 
          email: user.email,
          rememberMe,
          sessionId 
        }),
        ipAddress,
        userAgent,
      }
    });

    // Return user data and access token
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
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