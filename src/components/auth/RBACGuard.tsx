'use client';

import React from 'react';
import PermissionGuard from './PermissionGuard';
import RoleGuard from './RoleGuard';
import { PermissionCheck } from '@/lib/rbac';

interface RBACGuardProps {
  children: React.ReactNode;
  permission?: PermissionCheck;
  permissions?: PermissionCheck[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  mode?: 'permission' | 'role' | 'both' | 'either';
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export default function RBACGuard({ 
  children, 
  permission,
  permissions,
  role, 
  roles, 
  requireAll = false,
  mode = 'permission',
  fallback = null,
  showLoading = false 
}: RBACGuardProps) {
  
  if (mode === 'role') {
    return (
      <RoleGuard 
        role={role} 
        roles={roles} 
        requireAll={requireAll}
        fallback={fallback}
        showLoading={showLoading}
      >
        {children}
      </RoleGuard>
    );
  }

  if (mode === 'permission') {
    if (!permission && !permissions?.length) {
      console.warn('RBACGuard: No permission provided for permission mode');
      return <>{fallback}</>;
    }
    
    return (
      <PermissionGuard 
        permission={permission || permissions![0]} 
        fallback={fallback}
        showLoading={showLoading}
      >
        {children}
      </PermissionGuard>
    );
  }

  if (mode === 'both') {
    return (
      <RoleGuard 
        role={role} 
        roles={roles} 
        requireAll={requireAll}
        fallback={fallback}
        showLoading={showLoading}
      >
        <PermissionGuard 
          permission={permission || permissions![0]} 
          fallback={fallback}
          showLoading={showLoading}
        >
          {children}
        </PermissionGuard>
      </RoleGuard>
    );
  }

  if (mode === 'either') {
    return (
      <>
        <RoleGuard 
          role={role} 
          roles={roles} 
          requireAll={requireAll}
          fallback={
            <PermissionGuard 
              permission={permission || permissions![0]} 
              fallback={fallback}
              showLoading={showLoading}
            >
              {children}
            </PermissionGuard>
          }
          showLoading={showLoading}
        >
          {children}
        </RoleGuard>
      </>
    );
  }

  return <>{children}</>;
}