import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';
import { auditLog, AuditEventType, AuditEventAction } from '@/lib/audit-log';

const prisma = new PrismaClient();

// GET /api/admin/roles/[roleId] - Get specific role
export const GET = requireAdmin(async (request: NextRequest, user, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/').slice(-1)[0]; // Extract roleId from URL
    
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// PUT /api/admin/roles/[roleId] - Update role
export const PUT = requireAdmin(async (request: NextRequest, user, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/').slice(-1)[0]; // Extract roleId from URL
    
    const { name, description, permissionIds } = await request.json();
    const adminId = user.userId;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Update role basic info
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description,
        updatedAt: new Date()
      }
    });

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleId }
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: roleId,
            permissionId
          }))
        });
      }
    }

    // Get updated role with permissions
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Log audit event
    await auditLog.log({
      eventType: AuditEventType.USER_ROLE_CHANGED,
      eventAction: AuditEventAction.SUCCESS,
      adminId,
      entityType: 'role',
      entityId: roleId,
      metadata: {
        roleName: name,
        previousName: existingRole.name,
        permissionsCount: permissionIds?.length || 0,
        previousPermissionsCount: existingRole.rolePermissions.length
      },
      request
    });

    return NextResponse.json({
      success: true,
      role: roleWithPermissions
    });
  } catch (error) {
    console.error('Error updating role:', error);
    
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE /api/admin/roles/[roleId] - Delete role
export const DELETE = requireAdmin(async (request: NextRequest, user, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/').slice(-1)[0]; // Extract roleId from URL
    
    const adminId = user.userId;

    // Check if role exists and get user count
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is assigned to any users
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: roleId }
    });

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId }
    });

    // Log audit event
    await auditLog.log({
      eventType: AuditEventType.USER_ROLE_CHANGED,
      eventAction: AuditEventAction.SUCCESS,
      adminId,
      entityType: 'role',
      entityId: roleId,
      metadata: {
        action: 'delete',
        roleName: role.name,
        description: role.description
      },
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});