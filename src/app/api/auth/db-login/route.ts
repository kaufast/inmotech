import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { generateSecureToken, verifyPassword, createSecureJWT } from '@/lib/edge-crypto';

export const runtime = 'edge';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || "";

// This insecure function has been replaced with createSecureJWT from edge-crypto.ts

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

    // Check if DATABASE_URL is available
    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment');
      return new Response(JSON.stringify({
        error: 'Database configuration error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create database connection
    const sql = neon(DATABASE_URL);

    // Get user from database
    const result = await sql`
      SELECT 
        id, 
        email, 
        password_hash,
        first_name as "firstName",
        last_name as "lastName",
        is_active as "isActive",
        is_verified as "isVerified",
        is_admin as "isAdmin",
        kyc_status as "kycStatus"
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;
    
    const user = result[0];
    
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

    // Verify password using proper bcrypt checking
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate secure tokens with HMAC-SHA256 signatures
    const accessToken = await createSecureJWT({ userId: user.id, email: user.email }, '7d');
    const refreshToken = generateSecureToken();

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = ${new Date()}
      WHERE id = ${user.id}
    `;

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
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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