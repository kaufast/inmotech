import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';
import { removeRole } from '@/lib/rbac';
import { auditLog, AuditEventType, AuditEventAction } from '@/lib/audit-log';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/admin/users/[userId]/roles/[roleId] - Remove specific role from user
export const DELETE = requireAdmin(async (request: NextRequest, user, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 3]; // Extract userId from URL
    const roleId = pathSegments[pathSegments.length - 1]; // Extract roleId from URL
    
    const adminId = user.userId;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify role exists and user has it
    const userRole = await prisma.userRole.findFirst({
      where: { 
        userId: userId, 
        roleId: roleId,
        isActive: true
      },
      include: {
        role: {
          select: { name: true }
        }
      }
    });

    if (!userRole) {
      return NextResponse.json(
        { error: 'User does not have this role' },
        { status: 404 }
      );
    }

    // Remove the role
    await removeRole(userId, roleId);

    // Log audit event
    await auditLog.log({
      eventType: AuditEventType.USER_ROLE_CHANGED,
      eventAction: AuditEventAction.SUCCESS,
      adminId,
      userId: userId,
      entityType: 'user_role',
      entityId: `${userId}_${roleId}`,
      metadata: {
        action: 'remove',
        roleName: userRole.role.name,
        userEmail: targetUser.email,
        userName: `${targetUser.firstName} ${targetUser.lastName}`
      },
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    });

  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});