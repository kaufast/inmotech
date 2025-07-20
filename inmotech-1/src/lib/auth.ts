import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

// JWT Token generation
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: ACCESS_TOKEN_EXPIRES,
    issuer: 'real-estate-platform',
    audience: 'platform-users'
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRES,
    issuer: 'real-estate-platform',
    audience: 'platform-users'
  });
}

// JWT Token verification
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

// Reset token generation
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Extract token from request
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Get user from token
export async function getUserFromToken(token: string) {
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        isEmailVerified: true,
        investmentLimit: true,
        totalInvested: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// Session management
export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
  const sessionId = randomBytes(32).toString('hex');
  const refreshTokenRaw = randomBytes(64).toString('hex');
  const refreshTokenHash = await hashPassword(refreshTokenRaw);
  
  const refreshTokenPayload: RefreshTokenPayload = {
    userId,
    sessionId
  };
  
  const refreshToken = generateRefreshToken(refreshTokenPayload);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshToken: refreshTokenRaw,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
    }
  });

  return { sessionId, refreshToken };
}

export async function invalidateSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false }
  });
}

export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId },
    data: { isActive: false }
  });
}

// Refresh token validation
export async function validateRefreshToken(refreshToken: string): Promise<{ userId: string; sessionId: string } | null> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { 
        id: payload.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) return null;

    // Verify the refresh token matches
    const isValid = await verifyPassword(session.refreshToken, session.refreshTokenHash);
    if (!isValid) return null;

    // Update last used time
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() }
    });

    return { userId: session.userId, sessionId: session.id };
  } catch (error) {
    return null;
  }
}

// Rate limiting for login attempts
export async function checkLoginAttempts(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { loginAttempts: true, lockUntil: true }
  });

  if (!user) return true; // Allow attempt if user doesn't exist

  if (user.lockUntil && user.lockUntil > new Date()) {
    return false; // User is locked
  }

  return user.loginAttempts < 5; // Max 5 attempts
}

export async function incrementLoginAttempts(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, loginAttempts: true }
  });

  if (!user) return;

  const attempts = user.loginAttempts + 1;
  const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: attempts,
      lockUntil,
    }
  });
}

export async function resetLoginAttempts(email: string) {
  await prisma.user.update({
    where: { email },
    data: {
      loginAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date()
    }
  });
}

// Cookie helpers
export function setRefreshTokenCookie(refreshToken: string) {
  const cookieStore = cookies();
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/'
  });
}

export function clearRefreshTokenCookie() {
  const cookieStore = cookies();
  cookieStore.delete('refresh_token');
}

export function getRefreshTokenFromCookie(): string | null {
  const cookieStore = cookies();
  return cookieStore.get('refresh_token')?.value || null;
}