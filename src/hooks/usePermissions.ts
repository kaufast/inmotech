'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { PermissionCheck } from '@/lib/rbac';

export function usePermissions() {
  const { user, token } = useSecureAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !token) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      if (user.isAdmin) {
        setPermissions(['*']);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/permissions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const { permissions: userPermissions } = await response.json();
          setPermissions(userPermissions);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, token]);

  const hasPermission = useCallback((permission: PermissionCheck): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;
    
    const permissionName = `${permission.resource}:${permission.action}`;
    return permissions.includes(permissionName);
  }, [user, permissions]);

  const hasAnyPermission = useCallback((permissionsList: PermissionCheck[]): boolean => {
    return permissionsList.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionsList: PermissionCheck[]): boolean => {
    return permissionsList.every(permission => hasPermission(permission));
  }, [hasPermission]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.isAdmin || false
  };
}