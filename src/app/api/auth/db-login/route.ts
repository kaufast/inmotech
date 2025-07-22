import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { generateSecureToken, verifyPassword, createSecureJWT } from '@/lib/edge-crypto';
import { createId } from '@paralleldrive/cuid2';

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
        u.kyc_status as "kycStatus"
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