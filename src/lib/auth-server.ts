import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface JWTPayload {
  userId: string;
  email?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
  };
}

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET || process.env.REFRESH_JWT_SECRET || 'dev-fallback-secret';
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not found, using fallback');
}

// JWT token validation
export async function validateToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.userId) {
      return decoded as JWTPayload;
    }
    return null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie (for SSR)
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// Verify user exists in database
export async function verifyUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isVerified: true,
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('User verification error:', error);
    return null;
  }
}

// Generate JWT token
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}