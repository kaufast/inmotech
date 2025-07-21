import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, RBAC_CONFIGS } from '@/lib/rbac-middleware';
import { getAllPermissions } from '@/lib/rbac';

// GET /api/admin/permissions - Get all permissions
export const GET = withRBAC(async (request: NextRequest) => {
  try {
    const permissions = await getAllPermissions();
    
    // Group permissions by resource for better organization
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({ 
      permissions,
      groupedPermissions 
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.ADMIN_ONLY);