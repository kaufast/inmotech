import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { hasPermission, hasAnyPermission, hasRole, hasAnyRole, PermissionCheck } from '@/lib/rbac';

export interface RBACOptions {
  permissions?: PermissionCheck | PermissionCheck[];
  roles?: string | string[];
  requireAll?: boolean; // For multiple permissions/roles, require all instead of any
  allowOwner?: boolean; // Allow resource owner to access even without permission
  getOwnerId?: (request: NextRequest) => Promise<string | null>; // Function to get resource owner ID
}

/**
 * RBAC middleware for API routes
 */
export async function verifyRBAC(request: NextRequest, options: RBACOptions = {}) {
  try {
    // First verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 401
      };
    }

    const userId = authResult.userId!;
    const {
      permissions,
      roles,
      requireAll = false,
      allowOwner = false,
      getOwnerId
    } = options;

    // Check if user is the owner of the resource
    if (allowOwner && getOwnerId) {
      try {
        const ownerId = await getOwnerId(request);
        if (ownerId === userId) {
          return {
            success: true,
            userId,
            isOwner: true
          };
        }
      } catch (error) {
        console.error('Error checking resource ownership:', error);
      }
    }

    // Check roles if specified
    if (roles) {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      const hasRequiredRole = requireAll
        ? await Promise.all(roleArray.map(role => hasRole(userId, role))).then(results => results.every(Boolean))
        : await hasAnyRole(userId, roleArray);

      if (!hasRequiredRole) {
        return {
          success: false,
          error: 'Insufficient role permissions',
          status: 403
        };
      }
    }

    // Check permissions if specified
    if (permissions) {
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
      const hasRequiredPermission = requireAll
        ? await Promise.all(permissionArray.map(permission => hasPermission(userId, permission))).then(results => results.every(Boolean))
        : await hasAnyPermission(userId, permissionArray);

      if (!hasRequiredPermission) {
        return {
          success: false,
          error: 'Insufficient permissions',
          status: 403
        };
      }
    }

    return {
      success: true,
      userId,
      isOwner: false
    };

  } catch (error) {
    console.error('RBAC verification error:', error);
    return {
      success: false,
      error: 'Authorization check failed',
      status: 500
    };
  }
}

/**
 * Higher-order function to create RBAC-protected API handlers
 */
export function withRBAC(
  handler: (request: NextRequest, context: { userId: string; isOwner?: boolean }) => Promise<NextResponse>,
  options: RBACOptions = {}
) {
  return async (request: NextRequest) => {
    const rbacResult = await verifyRBAC(request, options);
    
    if (!rbacResult.success) {
      return NextResponse.json(
        { error: rbacResult.error },
        { status: rbacResult.status }
      );
    }

    return handler(request, {
      userId: rbacResult.userId!,
      isOwner: rbacResult.isOwner || false
    });
  };
}

/**
 * Predefined RBAC configurations for common scenarios
 */
export const RBAC_CONFIGS = {
  // Admin only access
  ADMIN_ONLY: {
    roles: 'admin'
  },

  // Admin or fund manager
  ADMIN_OR_FUND_MANAGER: {
    roles: ['admin', 'fund_manager'],
    requireAll: false
  },

  // Users who can read projects
  PROJECT_READ: {
    permissions: { resource: 'projects', action: 'read' }
  },

  // Users who can manage projects
  PROJECT_MANAGE: {
    permissions: [
      { resource: 'projects', action: 'create' },
      { resource: 'projects', action: 'update' },
      { resource: 'projects', action: 'delete' }
    ],
    requireAll: false
  },

  // Users who can create investments
  INVESTMENT_CREATE: {
    permissions: { resource: 'investments', action: 'create' }
  },

  // Users who can view their own investments
  INVESTMENT_READ_OWN: {
    permissions: { resource: 'investments', action: 'read' },
    allowOwner: true,
    getOwnerId: async (request: NextRequest) => {
      // This would be implemented based on the specific route
      // For example, extracting user ID from investment record
      return null;
    }
  },

  // KYC managers
  KYC_MANAGE: {
    permissions: { resource: 'kyc', action: 'manage' }
  },

  // Analytics viewers
  ANALYTICS_READ: {
    permissions: { resource: 'analytics', action: 'read' }
  },

  // User management
  USER_MANAGE: {
    permissions: { resource: 'users', action: 'manage' }
  }
} as const;

/**
 * Check permissions in React components (client-side)
 */
export function useRBAC() {
  // This would be implemented as a React hook
  // For now, return basic functionality
  return {
    hasPermission: async (permission: PermissionCheck) => {
      // This would call an API endpoint to check permissions
      try {
        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ permission })
        });
        const result = await response.json();
        return result.hasPermission || false;
      } catch {
        return false;
      }
    },
    hasRole: async (role: string) => {
      try {
        const response = await fetch('/api/auth/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role })
        });
        const result = await response.json();
        return result.hasRole || false;
      } catch {
        return false;
      }
    }
  };
}