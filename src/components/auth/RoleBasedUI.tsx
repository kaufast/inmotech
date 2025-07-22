'use client';

import React from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RoleBasedProps extends ConditionalRenderProps {
  roles: string[];
  requireAll?: boolean;
}

interface PermissionBasedProps extends ConditionalRenderProps {
  permissions: string[];
  requireAll?: boolean;
}

// Role-based conditional rendering
export function ShowForRoles({ 
  children, 
  roles, 
  requireAll = false, 
  fallback 
}: RoleBasedProps) {
  const { hasAnyRole, hasAllRoles } = useSecureAuth();
  
  const hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Permission-based conditional rendering
export function ShowForPermissions({ 
  children, 
  permissions, 
  requireAll = false, 
  fallback 
}: PermissionBasedProps) {
  const { hasAnyPermission, hasAllPermissions } = useSecureAuth();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Specific role components
export function ShowForInvestors({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['investor']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

export function ShowForPropertyManagers({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['property_manager']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

export function ShowForAnalysts({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['analyst']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

export function ShowForAdmins({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['admin']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

// Investment access (Investor, Property Manager, or Admin)
export function ShowForInvestmentAccess({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['investor', 'property_manager', 'admin']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

// Analytics access (Analyst, Property Manager, or Admin)
export function ShowForAnalyticsAccess({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['analyst', 'property_manager', 'admin']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

// Project management access (Property Manager or Admin)
export function ShowForProjectManagement({ children, fallback }: ConditionalRenderProps) {
  return (
    <ShowForRoles roles={['property_manager', 'admin']} fallback={fallback}>
      {children}
    </ShowForRoles>
  );
}

// User Role Badge Component
export function UserRoleBadge() {
  const { user } = useSecureAuth();
  
  if (!user) {
    return <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">Guest</span>;
  }

  // For now, we use isAdmin flag to determine role
  // TODO: Implement full RBAC with roles table
  if (user.isAdmin) {
    return (
      <span className="px-2 py-1 text-xs rounded font-medium bg-orange-600 text-orange-100">
        Administrator
      </span>
    );
  }

  // Default user role
  return (
    <span className="px-2 py-1 text-xs rounded font-medium bg-blue-600 text-blue-100">
      User
    </span>
  );
}

// User Permissions Debug Component (for development)
export function UserPermissionsDebug() {
  const { user } = useSecureAuth();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-auto z-50">
      <h4 className="font-bold mb-2">Debug: User Info</h4>
      
      <div className="mb-2">
        <strong>User:</strong>
        <div className="ml-2">
          {user?.firstName} {user?.lastName} ({user?.email})
        </div>
      </div>
      
      <div className="mb-2">
        <strong>Admin Status:</strong>
        <div className="ml-2">
          {user?.isAdmin ? 'Administrator' : 'Regular User'}
        </div>
      </div>
      
      <div className="mb-2">
        <strong>Verified:</strong>
        <div className="ml-2">
          {user?.isVerified ? 'Yes' : 'No'}
        </div>
      </div>
      
      <div>
        <strong>2FA:</strong>
        <div className="ml-2">
          {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>
    </div>
  );
}

// Hook for role-based navigation items
export function useRoleBasedNavigation() {
  const { hasRole, hasPermission } = useSecureAuth();
  
  const navigationItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      visible: true, // Always visible for authenticated users
    },
    {
      id: 'investments',
      path: '/investments', 
      label: 'My Investments',
      visible: hasPermission('investments:read'),
    },
    {
      id: 'browse-projects',
      path: '/projects',
      label: 'Browse Projects', 
      visible: hasPermission('projects:read'),
    },
    {
      id: 'create-project',
      path: '/projects/create',
      label: 'Create Project',
      visible: hasPermission('projects:create'),
    },
    {
      id: 'analytics',
      path: '/analytics',
      label: 'Analytics',
      visible: hasPermission('analytics:read'),
    },
    {
      id: 'advanced-analytics', 
      path: '/analytics/advanced',
      label: 'Advanced Analytics',
      visible: hasPermission('analytics:advanced'),
    },
    {
      id: 'user-management',
      path: '/admin/users',
      label: 'User Management',
      visible: hasPermission('users:manage'),
    },
    {
      id: 'system-settings',
      path: '/admin/settings',
      label: 'System Settings',
      visible: hasPermission('system:admin'),
    },
  ];
  
  return navigationItems.filter(item => item.visible);
}