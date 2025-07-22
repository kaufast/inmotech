'use client';

import React from 'react';
import { Settings, Users, Shield, Crown, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGuard from './PermissionGuard';
import RoleGuard from './RoleGuard';
import RBACGuard from './RBACGuard';

export default function RBACExamples() {
  const { hasPermission, isAdmin } = usePermissions();

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold">RBAC Component Examples</h2>
      
      {/* Permission-based rendering */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Permission-Based Components</h3>
        
        <PermissionGuard 
          permission={{ resource: 'user', action: 'manage' }}
          fallback={<p className="text-red-400">You don't have permission to manage users</p>}
        >
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <Users className="w-6 h-6 mb-2 text-green-400" />
            <p>User Management Panel - Only visible if you can manage users</p>
          </div>
        </PermissionGuard>

        <PermissionGuard 
          permission={{ resource: 'system', action: 'manage' }}
          fallback={<p className="text-red-400">System settings require special permissions</p>}
        >
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <Settings className="w-6 h-6 mb-2 text-blue-400" />
            <p>System Settings - Only visible with system management permissions</p>
          </div>
        </PermissionGuard>
      </div>

      {/* Role-based rendering */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Role-Based Components</h3>
        
        <RoleGuard 
          role="admin"
          fallback={<p className="text-red-400">Admin role required</p>}
        >
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <Crown className="w-6 h-6 mb-2 text-purple-400" />
            <p>Admin Panel - Only visible to users with admin role</p>
          </div>
        </RoleGuard>

        <RoleGuard 
          roles={['moderator', 'admin']}
          fallback={<p className="text-red-400">Moderator or Admin role required</p>}
        >
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <Shield className="w-6 h-6 mb-2 text-yellow-400" />
            <p>Moderation Tools - Visible to moderators and admins</p>
          </div>
        </RoleGuard>
      </div>

      {/* Combined RBAC components */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Combined RBAC Components</h3>
        
        <RBACGuard 
          mode="both"
          role="admin"
          permission={{ resource: 'audit', action: 'read' }}
          fallback={<p className="text-red-400">Need admin role AND audit read permission</p>}
        >
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <Eye className="w-6 h-6 mb-2 text-red-400" />
            <p>Security Audit - Requires both admin role and audit permissions</p>
          </div>
        </RBACGuard>

        <RBACGuard 
          mode="either"
          role="superadmin"
          permission={{ resource: 'system', action: 'manage' }}
          fallback={<p className="text-red-400">Need superadmin role OR system management permission</p>}
        >
          <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <Settings className="w-6 h-6 mb-2 text-orange-400" />
            <p>Advanced Settings - Requires superadmin OR system management permission</p>
          </div>
        </RBACGuard>
      </div>

      {/* Hook-based conditional rendering */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Hook-Based Conditional Rendering</h3>
        
        {isAdmin && (
          <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <Crown className="w-6 h-6 mb-2 text-indigo-400" />
            <p>Admin Dashboard - Conditionally rendered using usePermissions hook</p>
          </div>
        )}

        {hasPermission({ resource: 'user', action: 'read' }) && (
          <div className="p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
            <Users className="w-6 h-6 mb-2 text-teal-400" />
            <p>User List - Shown if you can read user data</p>
          </div>
        )}
      </div>
    </div>
  );
}