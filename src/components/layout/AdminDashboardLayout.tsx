'use client';

import React, { useState } from 'react';
import { 
  Crown,
  Users, 
  Activity, 
  BarChart3, 
  Shield,
  Settings,
  Monitor,
  FileText,
  Eye,
  Menu,
  X,
  UserCheck,
  LogOut,
  Home,
  AlertTriangle
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import RBACGuard from '@/components/auth/RBACGuard';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useSecureAuth();
  const { hasPermission } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split('/')[1] || 'en-GB';

  // Check admin access
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">Administrator privileges required to access this area.</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const adminNavItems = [
    {
      id: 'overview',
      icon: BarChart3,
      label: 'Overview',
      href: `/${locale}/admin`,
      description: 'Platform metrics and insights',
      permission: { resource: 'admin', action: 'read' }
    },
    {
      id: 'users',
      icon: Users,
      label: 'User Management',
      href: `/${locale}/admin/users`,
      description: 'Manage users, roles, and permissions',
      permission: { resource: 'user', action: 'manage' }
    },
    {
      id: 'sessions',
      icon: Monitor,
      label: 'Session Monitoring',
      href: `/${locale}/admin/sessions`,
      description: 'Monitor active sessions and security',
      permission: { resource: 'session', action: 'read' }
    },
    {
      id: 'analytics',
      icon: Activity,
      label: 'Analytics',
      href: `/${locale}/admin/analytics`,
      description: 'Detailed platform analytics',
      permission: { resource: 'analytics', action: 'read' }
    },
    {
      id: 'audit-logs',
      icon: Shield,
      label: 'Audit Logs',
      href: `/${locale}/admin/audit-logs`,
      description: 'Security and activity logs',
      permission: { resource: 'audit', action: 'read' }
    },
    {
      id: 'roles',
      icon: Crown,
      label: 'Role Management',
      href: `/${locale}/admin/roles`,
      description: 'Manage roles and permissions',
      permission: { resource: 'role', action: 'manage' }
    },
    {
      id: 'user-roles',
      icon: UserCheck,
      label: 'User Roles',
      href: `/${locale}/admin/user-roles`,
      description: 'Assign roles to users',
      permission: { resource: 'user', action: 'manage' }
    },
    {
      id: 'system',
      icon: Settings,
      label: 'System Settings',
      href: `/${locale}/admin/system`,
      description: 'Platform configuration',
      permission: { resource: 'system', action: 'manage' }
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-gray-900/95 backdrop-blur border-r border-white/10 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Admin Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">System Management</p>
            </div>
          </div>
          
          {/* Admin User Info */}
          <div className="flex items-center space-x-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-orange-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              if (!user?.isAdmin && !hasPermission(item.permission)) {
                return null;
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all group ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-orange-100' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-white/10">
          <div className="space-y-2">
            <button
              onClick={() => handleNavigation(`/${locale}/dashboard`)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}