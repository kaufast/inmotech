'use client';

import React from 'react';
import SecureProtectedRoute from './SecureProtectedRoute';

interface RoleGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

// Investor Route Guard
export function RequireInvestor({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['investor']}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Property Manager Route Guard
export function RequirePropertyManager({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['property_manager']}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Analyst Route Guard
export function RequireAnalyst({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['analyst']}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Admin Route Guard (enhanced version)
export function RequireAdmin({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['admin']}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Investor or Property Manager (for investment-related features)
export function RequireInvestmentAccess({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['investor', 'property_manager', 'admin']}
      requireAllRoles={false}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Analytics Access (Analyst, Property Manager, or Admin)
export function RequireAnalyticsAccess({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['analyst', 'property_manager', 'admin']}
      requireAllRoles={false}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Project Management Access (Property Manager or Admin)
export function RequireProjectManagement({ children, fallbackPath }: RoleGuardProps) {
  return (
    <SecureProtectedRoute
      requiredRoles={['property_manager', 'admin']}
      requireAllRoles={false}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Permission-based guards
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function RequirePermissions({ 
  children, 
  permissions, 
  requireAll = false,
  fallbackPath 
}: PermissionGuardProps) {
  return (
    <SecureProtectedRoute
      requiredPermissions={permissions}
      requireAllPermissions={requireAll}
      fallbackPath={fallbackPath}
    >
      {children}
    </SecureProtectedRoute>
  );
}

// Specific permission shortcuts
export function RequireProjectRead({ children, fallbackPath }: RoleGuardProps) {
  return (
    <RequirePermissions 
      permissions={['projects:read']} 
      fallbackPath={fallbackPath}
    >
      {children}
    </RequirePermissions>
  );
}

export function RequireProjectCreate({ children, fallbackPath }: RoleGuardProps) {
  return (
    <RequirePermissions 
      permissions={['projects:create']} 
      fallbackPath={fallbackPath}
    >
      {children}
    </RequirePermissions>
  );
}

export function RequireInvestmentCreate({ children, fallbackPath }: RoleGuardProps) {
  return (
    <RequirePermissions 
      permissions={['investments:create']} 
      fallbackPath={fallbackPath}
    >
      {children}
    </RequirePermissions>
  );
}

export function RequireAdvancedAnalytics({ children, fallbackPath }: RoleGuardProps) {
  return (
    <RequirePermissions 
      permissions={['analytics:advanced']} 
      fallbackPath={fallbackPath}
    >
      {children}
    </RequirePermissions>
  );
}