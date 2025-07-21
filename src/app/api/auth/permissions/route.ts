import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getUserPermissions } from '@/lib/rbac';

// GET /api/auth/permissions - Get current user's permissions
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const userPermissions = await getUserPermissions(authResult.userId!);

    return NextResponse.json({
      userId: userPermissions.userId,
      roles: userPermissions.roles,
      permissions: userPermissions.permissions
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/auth/permissions - Check specific permission
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { permission, permissions, role, roles } = await request.json();
    const userPermissions = await getUserPermissions(authResult.userId!);

    let result = {
      hasPermission: false,
      hasRole: false,
      userRoles: userPermissions.roles,
      userPermissions: userPermissions.permissions
    };

    // Check single permission
    if (permission) {
      const permissionName = `${permission.resource}:${permission.action}`;
      result.hasPermission = userPermissions.permissions.includes(permissionName);
    }

    // Check multiple permissions (any)
    if (permissions && Array.isArray(permissions)) {
      result.hasPermission = permissions.some((p: any) => {
        const permissionName = `${p.resource}:${p.action}`;
        return userPermissions.permissions.includes(permissionName);
      });
    }

    // Check single role
    if (role) {
      result.hasRole = userPermissions.roles.includes(role);
    }

    // Check multiple roles (any)
    if (roles && Array.isArray(roles)) {
      result.hasRole = roles.some((r: string) => userPermissions.roles.includes(r));
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}