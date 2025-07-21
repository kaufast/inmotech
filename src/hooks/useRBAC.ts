import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PermissionCheck {
  resource: string;
  action: string;
}

interface UserPermissions {
  roles: string[];
  permissions: string[];
}

interface UseRBACReturn {
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: PermissionCheck) => boolean;
  hasAnyPermission: (permissions: PermissionCheck[]) => boolean;
  hasAllPermissions: (permissions: PermissionCheck[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const useRBAC = (): UseRBACReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/permissions', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions({
          roles: data.roles || [],
          permissions: data.permissions || []
        });
      } else if (response.status === 401) {
        // User not authenticated
        setPermissions(null);
      } else {
        throw new Error('Failed to fetch permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: PermissionCheck): boolean => {
    if (!permissions) return false;
    const permissionName = `${permission.resource}:${permission.action}`;
    return permissions.permissions.includes(permissionName);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionChecks: PermissionCheck[]): boolean => {
    if (!permissions) return false;
    return permissionChecks.some(permission => hasPermission(permission));
  }, [permissions, hasPermission]);

  const hasAllPermissions = useCallback((permissionChecks: PermissionCheck[]): boolean => {
    if (!permissions) return false;
    return permissionChecks.every(permission => hasPermission(permission));
  }, [permissions, hasPermission]);

  const hasRole = useCallback((role: string): boolean => {
    if (!permissions) return false;
    return permissions.roles.includes(role);
  }, [permissions]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!permissions) return false;
    return roles.some(role => permissions.roles.includes(role));
  }, [permissions]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refreshPermissions
  };
};

// Predefined permission checks for common operations
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