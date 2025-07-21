import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

// Cache for user permissions to avoid repeated database queries
const permissionCache = new Map<string, { permissions: UserPermissions; expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all permissions for a user based on their roles
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.permissions;
  }

  try {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
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

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    const roles = userWithRoles.userRoles.map(ur => ur.role.name);
    const permissions = new Set<string>();

    // Collect all permissions from all roles
    userWithRoles.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    });

    const userPermissions: UserPermissions = {
      userId,
      roles,
      permissions: Array.from(permissions)
    };

    // Cache the result
    permissionCache.set(userId, {
      permissions: userPermissions,
      expiry: Date.now() + CACHE_DURATION
    });

    return userPermissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return { userId, roles: [], permissions: [] };
  }
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permission: PermissionCheck): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  const permissionName = `${permission.resource}:${permission.action}`;
  return userPermissions.permissions.includes(permissionName);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissions: PermissionCheck[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(permission => {
    const permissionName = `${permission.resource}:${permission.action}`;
    return userPermissions.permissions.includes(permissionName);
  });
}

/**
 * Check if a user has all specified permissions
 */
export async function hasAllPermissions(userId: string, permissions: PermissionCheck[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(permission => {
    const permissionName = `${permission.resource}:${permission.action}`;
    return userPermissions.permissions.includes(permissionName);
  });
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.roles.includes(roleName);
}

/**
 * Check if a user has any of the specified roles
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return roleNames.some(role => userPermissions.roles.includes(role));
}

/**
 * Assign a role to a user
 */
export async function assignRole(userId: string, roleId: string, assignedBy?: string, expiresAt?: Date): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId }
    },
    update: {
      isActive: true,
      assignedBy,
      assignedAt: new Date(),
      expiresAt
    },
    create: {
      userId,
      roleId,
      assignedBy,
      expiresAt
    }
  });

  // Clear cache for this user
  permissionCache.delete(userId);
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string): Promise<void> {
  await prisma.userRole.updateMany({
    where: { userId, roleId },
    data: { isActive: false }
  });

  // Clear cache for this user
  permissionCache.delete(userId);
}

/**
 * Get all available roles
 */
export async function getAllRoles() {
  return await prisma.role.findMany({
    where: { isActive: true },
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
    },
    orderBy: { name: 'asc' }
  });
}

/**
 * Get all available permissions
 */
export async function getAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }]
  });
}

/**
 * Create a new role with permissions
 */
export async function createRole(name: string, description?: string, permissionIds?: string[]) {
  const role = await prisma.role.create({
    data: {
      name,
      description
    }
  });

  if (permissionIds && permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        roleId: role.id,
        permissionId
      }))
    });
  }

  return role;
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  // Remove existing permissions
  await prisma.rolePermission.deleteMany({
    where: { roleId }
  });

  // Add new permissions
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }))
    });
  }

  // Clear all user caches since role permissions changed
  permissionCache.clear();
}

/**
 * Clear permission cache for a specific user or all users
 */
export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

// Predefined permission sets for common operations
export const PERMISSIONS = {
  // Projects
  PROJECTS_READ: { resource: 'projects', action: 'read' },
  PROJECTS_CREATE: { resource: 'projects', action: 'create' },
  PROJECTS_UPDATE: { resource: 'projects', action: 'update' },
  PROJECTS_DELETE: { resource: 'projects', action: 'delete' },
  PROJECTS_MANAGE: { resource: 'projects', action: 'manage' },

  // Investments
  INVESTMENTS_READ: { resource: 'investments', action: 'read' },
  INVESTMENTS_CREATE: { resource: 'investments', action: 'create' },
  INVESTMENTS_UPDATE: { resource: 'investments', action: 'update' },
  INVESTMENTS_DELETE: { resource: 'investments', action: 'delete' },
  INVESTMENTS_MANAGE: { resource: 'investments', action: 'manage' },

  // Users
  USERS_READ: { resource: 'users', action: 'read' },
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  USERS_MANAGE: { resource: 'users', action: 'manage' },

  // Analytics
  ANALYTICS_READ: { resource: 'analytics', action: 'read' },
  ANALYTICS_CREATE: { resource: 'analytics', action: 'create' },
  ANALYTICS_MANAGE: { resource: 'analytics', action: 'manage' },

  // KYC
  KYC_READ: { resource: 'kyc', action: 'read' },
  KYC_APPROVE: { resource: 'kyc', action: 'approve' },
  KYC_REJECT: { resource: 'kyc', action: 'reject' },
  KYC_MANAGE: { resource: 'kyc', action: 'manage' },

  // Admin
  ADMIN_READ: { resource: 'admin', action: 'read' },
  ADMIN_MANAGE: { resource: 'admin', action: 'manage' },

  // Payments
  PAYMENTS_READ: { resource: 'payments', action: 'read' },
  PAYMENTS_PROCESS: { resource: 'payments', action: 'process' },
  PAYMENTS_MANAGE: { resource: 'payments', action: 'manage' }
} as const;