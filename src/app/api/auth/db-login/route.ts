import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { generateSecureToken, verifyPassword, createSecureJWT } from '@/lib/edge-crypto';
import { createId } from '@paralleldrive/cuid2';

export const runtime = 'edge';

// Helper functions for device detection
const extractPlatform = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
};

const extractBrowser = (userAgent: string): string => {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

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

    // Get user from database with roles and permissions
    const result = await sql`
      SELECT 
        u.id, 
        u.email, 
        u.password_hash,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.is_active as "isActive",
        u.is_verified as "isVerified",
        u.is_admin as "isAdmin",
        u.kyc_status as "kycStatus",
        u.login_attempts as "loginAttempts",
        u.locked_until as "lockedUntil",
        u.two_factor_enabled,
        u.two_factor_secret
      FROM users u
      WHERE u.email = ${email.toLowerCase()}
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

    // Get user roles and permissions
    const rolesResult = await sql`
      SELECT 
        r.name as "roleName",
        r.description as "roleDescription",
        p.name as "permissionName",
        p.resource,
        p.action,
        p.description as "permissionDescription"
      FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      INNER JOIN role_permissions rp ON r.id = rp.role_id
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${user.id} 
        AND ur.is_active = true
        AND r.is_active = true
      ORDER BY r.name, p.name
    `;

    // Process roles and permissions
    const roleMap = new Map();
    rolesResult.forEach(row => {
      if (!roleMap.has(row.roleName)) {
        roleMap.set(row.roleName, {
          name: row.roleName,
          description: row.roleDescription,
          permissions: []
        });
      }
      
      const role = roleMap.get(row.roleName);
      role.permissions.push({
        name: row.permissionName,
        resource: row.resource,
        action: row.action,
        description: row.permissionDescription
      });
    });

    const userRoles = Array.from(roleMap.values());
    const allPermissions = rolesResult.map(row => row.permissionName);

    // Check if account is active
    if (!user.isActive) {
      return new Response(JSON.stringify({
        error: 'Account is deactivated'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if account is temporarily locked
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const lockDuration = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      return new Response(JSON.stringify({
        error: `Account temporarily locked. Try again in ${lockDuration} minutes.`
      }), {
        status: 423, // HTTP 423 Locked
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password using proper bcrypt checking
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const maxAttempts = 5;
      const lockoutDuration = 15; // minutes
      
      const newAttempts = (user.loginAttempts || 0) + 1;
      const lockUntil = newAttempts >= maxAttempts 
        ? new Date(now.getTime() + lockoutDuration * 60 * 1000)
        : null;

      await sql`
        UPDATE users 
        SET 
          login_attempts = ${newAttempts},
          locked_until = ${lockUntil}
        WHERE id = ${user.id}
      `;

      const remainingAttempts = maxAttempts - newAttempts;
      let errorMessage = 'Invalid email or password';
      
      if (lockUntil) {
        errorMessage = `Account locked after ${maxAttempts} failed attempts. Try again in ${lockoutDuration} minutes.`;
      } else if (remainingAttempts <= 2 && remainingAttempts > 0) {
        errorMessage = `Invalid email or password. ${remainingAttempts} attempts remaining before account lock.`;
      }

      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has 2FA enabled
    if (user.two_factor_enabled) {
      return new Response(JSON.stringify({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required',
        email: user.email
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockedUntil) {
      await sql`
        UPDATE users 
        SET 
          login_attempts = 0,
          locked_until = NULL
        WHERE id = ${user.id}
      `;
    }

    // Generate secure tokens with HMAC-SHA256 signatures including roles
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles.map(r => r.name),
      permissions: allPermissions
    };
    const accessToken = await createSecureJWT(jwtPayload, '15m'); // Short-lived access token
    const refreshToken = generateSecureToken();

    // Store refresh token in database (30 days expiry)
    const refreshTokenId = createId();
    await sql`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (
        ${refreshTokenId},
        ${user.id}, 
        ${refreshToken}, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      )
    `;

    // Create a tracked session for this login
    const sessionToken = generateSecureToken();
    const sessionId = createId();
    
    // Extract request info for session tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'Unknown';
    
    // Create device fingerprint
    const deviceInfo = {
      userAgent,
      platform: extractPlatform(userAgent),
      browser: extractBrowser(userAgent),
      timestamp: new Date().toISOString()
    };

    // Store the session
    await sql`
      INSERT INTO user_sessions (
        id, user_id, session_token, device_info, ip_address, 
        user_agent, last_activity, is_active, expires_at, created_at
      ) VALUES (
        ${sessionId}, ${user.id}, ${sessionToken}, ${JSON.stringify(deviceInfo)}, 
        ${ipAddress}, ${userAgent}, ${new Date()}, true, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}, ${new Date()}
      )
    `;

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
        kycStatus: user.kycStatus,
        roles: userRoles,
        permissions: allPermissions
      },
      tokens: {
        accessToken,
        refreshToken,
        sessionToken,
        expiresIn: 15 * 60 // 15 minutes for access token
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