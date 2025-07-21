import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, RBAC_CONFIGS } from '@/lib/rbac-middleware';
import { getAllRoles, createRole, PERMISSIONS } from '@/lib/rbac';

// GET /api/admin/roles - Get all roles
export const GET = withRBAC(async (request: NextRequest) => {
  try {
    const roles = await getAllRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.ADMIN_ONLY);

// POST /api/admin/roles - Create a new role
export const POST = withRBAC(async (request: NextRequest) => {
  try {
    const { name, description, permissionIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    const role = await createRole(name, description, permissionIds);
    
    return NextResponse.json(
      { 
        success: true, 
        role: {
          id: role.id,
          name: role.name,
          description: role.description
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.ADMIN_ONLY);