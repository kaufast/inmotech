import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';

// Use Node.js runtime for TOTP verification

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    let isValidCode = false;
    let isBackupCode = false;

    // First, try to verify as TOTP code
    isValidCode = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret
    });

    // If TOTP failed, check if it's a backup code
    if (!isValidCode && user.twoFactorBackupCodes.includes(code.toUpperCase())) {
      isValidCode = true;
      isBackupCode = true;
    }

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code or backup code' },
        { status: 400 }
      );
    }

    // If a backup code was used, remove it from the list
    if (isBackupCode) {
      const updatedBackupCodes = user.twoFactorBackupCodes.filter(
        backupCode => backupCode !== code.toUpperCase()
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: updatedBackupCodes
        }
      });
    }

    // After successful 2FA verification during login, complete the authentication
    // This is similar to the login endpoint but assumes password was already verified
    
    // Get user roles and permissions for JWT token
    const rolesResult = await prisma.$queryRaw`
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
    ` as any[];

    // Transform roles data
    const userRoles = rolesResult.reduce((acc: any[], row: any) => {
      let role = acc.find(r => r.name === row.roleName);
      if (!role) {
        role = {
          name: row.roleName,
          description: row.roleDescription,
          permissions: []
        };
        acc.push(role);
      }
      
      if (row.permissionName) {
        role.permissions.push({
          name: row.permissionName,
          resource: row.resource,
          action: row.action,
          description: row.permissionDescription
        });
      }
      
      return acc;
    }, []);

    const allPermissions = userRoles.flatMap(r => r.permissions);

    // Import necessary functions
    const { createSecureJWT } = await import('@/lib/edge-crypto');
    const { createId } = await import('@paralleldrive/cuid2');

    // Generate secure tokens
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles.map(r => r.name),
      permissions: allPermissions
    };
    
    const accessToken = await createSecureJWT(jwtPayload, '15m');
    
    // Generate refresh token
    function generateSecureToken(length = 32): string {
      const crypto = require('crypto');
      return crypto.randomBytes(length).toString('hex');
    }
    const refreshToken = generateSecureToken();
    
    // Store refresh token in database
    const refreshTokenId = createId();
    await prisma.$executeRaw`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (
        ${refreshTokenId},
        ${user.id}, 
        ${refreshToken}, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      )
    `;

    // Create a tracked session for this 2FA login
    const sessionToken = generateSecureToken();
    const sessionId = createId();
    
    // Extract request info for session tracking (we'll need to get request object)
    const userAgent = 'Unknown'; // Will be enhanced
    const ipAddress = 'Unknown'; // Will be enhanced
    
    const deviceInfo = {
      userAgent,
      platform: 'Unknown',
      browser: 'Unknown', 
      timestamp: new Date().toISOString(),
      loginMethod: '2FA'
    };

    // Store the session
    await prisma.$executeRaw`
      INSERT INTO user_sessions (
        id, user_id, session_token, device_info, ip_address, 
        user_agent, last_activity, is_active, expires_at, created_at
      ) VALUES (
        ${sessionId}, ${user.id}, ${sessionToken}, ${JSON.stringify(deviceInfo)}, 
        ${ipAddress}, ${userAgent}, ${new Date()}, true, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}, ${new Date()}
      )
    `;

    return NextResponse.json({
      success: true,
      message: '2FA verification and login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isVerified: user.isVerified,
        roles: userRoles.map(r => r.name),
        permissions: allPermissions
      },
      accessToken,
      refreshToken,
      sessionToken,
      usedBackupCode: isBackupCode,
      remainingBackupCodes: isBackupCode 
        ? user.twoFactorBackupCodes.length - 1 
        : user.twoFactorBackupCodes.length
    });

  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}