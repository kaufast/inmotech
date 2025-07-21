'use client';

import React from 'react';
import { useRBAC, PermissionCheck } from '@/hooks/useRBAC';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: PermissionCheck;
  permissions?: PermissionCheck[];
  role?: string;
  roles?: string[];
  requireAll?: boolean; // For multiple permissions/roles, require all instead of any
  fallback?: React.ReactNode; // What to show when access is denied
  loading?: React.ReactNode; // What to show while loading permissions
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  loading = null
}) => {
  const { 
    permissions: userPermissions, 
    loading: permissionsLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole, 
    hasAnyRole 
  } = useRBAC();

  // Show loading state
  if (permissionsLoading) {
    return <>{loading}</>;
  }

  // No permissions loaded (user not authenticated)
  if (!userPermissions) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && hasAllPermissions(permissions);
    } else {
      hasAccess = hasAccess && hasAnyPermission(permissions);
    }
  }

  // Check single role
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && roles.every(r => hasRole(r));
    } else {
      hasAccess = hasAccess && hasAnyRole(roles);
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common permission checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent role="admin" fallback={fallback}>
    {children}
  </ProtectedComponent>
);

export const InvestorPlus: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent roles={['investor', 'premium_investor', 'fund_manager', 'admin']} fallback={fallback}>
    {children}
  </ProtectedComponent>
);

export const FundManagerPlus: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent roles={['fund_manager', 'admin']} fallback={fallback}>
    {children}
  </ProtectedComponent>
);

export const CanCreateProjects: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent permission={{ resource: 'projects', action: 'create' }} fallback={fallback}>
    {children}
  </ProtectedComponent>
);

export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent permission={{ resource: 'users', action: 'manage' }} fallback={fallback}>
    {children}
  </ProtectedComponent>
);

export const CanViewAnalytics: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedComponent permission={{ resource: 'analytics', action: 'read' }} fallback={fallback}>
    {children}
  </ProtectedComponent>
);