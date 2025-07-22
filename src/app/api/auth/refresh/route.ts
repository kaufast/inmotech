import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { createSecureJWT, generateSecureToken } from '@/lib/edge-crypto';

export const runtime = 'edge';

const DATABASE_URL = process.env.DATABASE_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return new Response(JSON.stringify({
        error: 'Refresh token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment');
      return new Response(JSON.stringify({
        error: 'Database configuration error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(DATABASE_URL);

    // Find and validate refresh token
    const tokenResult = await sql`
      SELECT 
        rt.id,
        rt.user_id as "userId",
        rt.expires_at as "expiresAt",
        rt.is_revoked as "isRevoked",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.is_active as "isActive",
        u.is_verified as "isVerified", 
        u.is_admin as "isAdmin",
        u.kyc_status as "kycStatus"
      FROM refresh_tokens rt
      INNER JOIN users u ON rt.user_id = u.id
      WHERE rt.token = ${refreshToken}
      LIMIT 1
    `;

    const tokenRecord = tokenResult[0];

    if (!tokenRecord) {
      return new Response(JSON.stringify({
        error: 'Invalid refresh token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if token is revoked
    if (tokenRecord.isRevoked) {
      return new Response(JSON.stringify({
        error: 'Refresh token has been revoked'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if token is expired
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      // Auto-revoke expired token
      await sql`
        UPDATE refresh_tokens 
        SET is_revoked = true
        WHERE id = ${tokenRecord.id}
      `;

      return new Response(JSON.stringify({
        error: 'Refresh token has expired'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user account is active
    if (!tokenRecord.isActive) {
      return new Response(JSON.stringify({
        error: 'User account is deactivated'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user roles and permissions (RBAC integration)
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
      WHERE ur.user_id = ${tokenRecord.userId} 
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

    // Generate new access token with current user data and roles
    const jwtPayload = {
      userId: tokenRecord.userId,
      email: tokenRecord.email,
      roles: userRoles.map(r => r.name),
      permissions: allPermissions
    };
    
    const newAccessToken = await createSecureJWT(jwtPayload, '15m'); // Short-lived access token
    const newRefreshToken = generateSecureToken();

    // Store new refresh token and revoke the old one
    // Revoke old refresh token
    await sql`
      UPDATE refresh_tokens 
      SET is_revoked = true
      WHERE id = ${tokenRecord.id}
    `;

    // Create new refresh token (30 days)
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (
        ${tokenRecord.userId}, 
        ${newRefreshToken}, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15 minutes
      },
      user: {
        id: tokenRecord.userId,
        email: tokenRecord.email,
        firstName: tokenRecord.firstName,
        lastName: tokenRecord.lastName,
        isVerified: tokenRecord.isVerified,
        isAdmin: tokenRecord.isAdmin,
        kycStatus: tokenRecord.kycStatus,
        roles: userRoles,
        permissions: allPermissions
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return new Response(JSON.stringify({
      error: 'Token refresh failed',
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