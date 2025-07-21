import { NextRequest } from 'next/server';
import { getUserByEmail, createRefreshToken, updateLastLogin } from '@/lib/neon-edge';
import { verifyPassword, generateSecureToken } from '@/lib/edge-crypto';

export const runtime = 'edge';

// Simple JWT creation for Edge Runtime
function createJWT(payload: any, expiresIn: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn === '7d' ? now + (7 * 24 * 60 * 60) : now + (30 * 24 * 60 * 60);
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp
  };
  
  // Simple base64 encoding for demo - in production use proper JWT signing
  const token = btoa(JSON.stringify(header)) + '.' + 
                btoa(JSON.stringify(fullPayload)) + '.' +
                generateSecureToken().substring(0, 43);
  
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database
    const user = await getUserByEmail(email);
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return new Response(JSON.stringify({
        error: 'Account is deactivated'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate tokens
    const accessToken = createJWT({ userId: user.id, email: user.email }, '7d');
    const refreshToken = generateSecureToken();

    // Store refresh token
    await createRefreshToken(
      user.id, 
      refreshToken, 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    // Update last login
    await updateLastLogin(user.id);

    return new Response(JSON.stringify({
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
        expiresIn: 7 * 24 * 60 * 60
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({
      error: 'An error occurred during login'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}