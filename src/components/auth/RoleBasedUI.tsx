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
  
  if (!user?.roles || user.roles.length === 0) {
    return <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">No Role</span>;
  }

  const primaryRole = user.roles[0];
  
  const roleColors = {
    investor: 'bg-blue-600 text-blue-100',
    property_manager: 'bg-green-600 text-green-100', 
    analyst: 'bg-purple-600 text-purple-100',
    admin: 'bg-red-600 text-red-100'
  } as const;

  const roleLabels = {
    investor: 'Investor',
    property_manager: 'Property Manager',
    analyst: 'Analyst', 
    admin: 'Administrator'
  } as const;

  const colorClass = roleColors[primaryRole.name as keyof typeof roleColors] || 'bg-gray-600 text-gray-300';
  const label = roleLabels[primaryRole.name as keyof typeof roleLabels] || primaryRole.name;

  return (
    <span className={`px-2 py-1 text-xs rounded font-medium ${colorClass}`}>
      {label}
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
      <h4 className="font-bold mb-2">Debug: User Permissions</h4>
      
      <div className="mb-2">
        <strong>Roles:</strong>
        {user?.roles?.map(role => (
          <div key={role.name} className="ml-2">
            - {role.name}
          </div>
        )) || 'None'}
      </div>
      
      <div>
        <strong>Permissions:</strong>
        <div className="ml-2 max-h-32 overflow-y-auto">
          {user?.permissions?.map(permission => (
            <div key={permission}>- {permission}</div>
          )) || 'None'}
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