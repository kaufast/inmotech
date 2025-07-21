import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, RBAC_CONFIGS } from '@/lib/rbac-middleware';
import { assignRole, removeRole, getUserPermissions } from '@/lib/rbac';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    userId: string;
  };
}

// GET /api/admin/users/[userId]/roles - Get user's roles and permissions
export const GET = withRBAC(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // Extract userId from path

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userPermissions = await getUserPermissions(userId);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      },
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt
      })),
      permissions: userPermissions.permissions
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.USER_MANAGE);

// POST /api/admin/users/[userId]/roles - Assign role to user
export const POST = withRBAC(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // Extract userId from path
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { roleId, expiresAt } = await request.json();

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    await assignRole(
      userId, 
      roleId, 
      context.userId, 
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" assigned to user`
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.USER_MANAGE);

// DELETE /api/admin/users/[userId]/roles - Remove role from user
export const DELETE = withRBAC(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // Extract userId from path
    const { searchParams } = url;
    const roleId = searchParams.get('roleId');

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      );
    }

    await removeRole(userId, roleId);

    return NextResponse.json({
      success: true,
      message: 'Role removed from user'
    });

  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
}, RBAC_CONFIGS.USER_MANAGE);