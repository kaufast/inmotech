'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Plus,
  X,
  Calendar,
  Clock,
  Crown,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  Trash2
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import toast from 'react-hot-toast';

interface UserRole {
  id: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  assignedByUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  userRoles: UserRole[];
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface RoleAssignmentForm {
  userId: string;
  roleId: string;
  expiresAt?: string;
}

export default function AdminUserRoles() {
  const { token, user: currentUser } = useSecureAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<RoleAssignmentForm>({
    userId: '',
    roleId: '',
    expiresAt: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    roleFilter: '',
    showExpired: false
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?includeRoles=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles.filter((role: Role) => role.isActive));
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error loading roles');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
      setLoading(false);
    };

    loadData();
  }, [token]);

  const handleAssignRole = async () => {
    try {
      const requestBody: any = {
        roleId: assignmentForm.roleId
      };

      if (assignmentForm.expiresAt) {
        requestBody.expiresAt = new Date(assignmentForm.expiresAt).toISOString();
      }

      const response = await fetch(`/api/admin/users/${assignmentForm.userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast.success('Role assigned successfully');
        setShowAssignForm(false);
        setAssignmentForm({ userId: '', roleId: '', expiresAt: '' });
        await fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Error assigning role');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string, roleName: string) => {
    if (!confirm(`Remove the "${roleName}" role from this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Role removed successfully');
        await fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove role');
      }
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Error removing role');
    }
  };

  const startRoleAssignment = (userId: string) => {
    setAssignmentForm({ userId, roleId: '', expiresAt: '' });
    setShowAssignForm(true);
  };

  const filteredUsers = users.filter(user => {
    if (filters.search && !user.email.toLowerCase().includes(filters.search.toLowerCase()) &&
        !user.firstName?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !user.lastName?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    if (filters.roleFilter) {
      const hasRole = user.userRoles.some(ur => 
        ur.isActive && ur.role.id === filters.roleFilter &&
        (!ur.expiresAt || new Date(ur.expiresAt) > new Date())
      );
      if (!hasRole) return false;
    }

    return true;
  });

  const isRoleExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) <= new Date() : false;
  };

  const getActiveRoles = (userRoles: UserRole[]) => {
    return userRoles.filter(ur => {
      if (!ur.isActive) return false;
      if (isRoleExpired(ur.expiresAt) && !filters.showExpired) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Role Management</h1>
          <p className="text-gray-400">Assign and manage user roles and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Role</label>
            <select
              value={filters.roleFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={filters.showExpired}
                onChange={(e) => setFilters(prev => ({ ...prev, showExpired: e.target.checked }))}
                className="w-4 h-4 text-orange-500 bg-white/5 border-white/10 rounded focus:ring-orange-500"
              />
              <span className="text-sm">Show Expired</span>
            </label>
          </div>
        </div>
      </div>

      {/* Role Assignment Form */}
      {showAssignForm && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Assign Role</h3>
            <button
              onClick={() => setShowAssignForm(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={assignmentForm.roleId}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                value={assignmentForm.expiresAt}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAssignRole}
                disabled={!assignmentForm.roleId}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const activeRoles = getActiveRoles(user.userRoles);
            
            return (
              <div key={user.id} className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          {user.isAdmin && (
                            <div title="Administrator">
                              <Crown className="w-5 h-5 text-yellow-400" />
                            </div>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isVerified 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-1">{user.email}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <span>{activeRoles.length} active roles</span>
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startRoleAssignment(user.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Assign Role</span>
                      </button>
                      <button
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedUser === user.id ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded roles view */}
                  {expandedUser === user.id && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-medium">Assigned Roles ({activeRoles.length})</h4>
                      </div>
                      
                      {activeRoles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No active roles assigned</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeRoles.map(userRole => {
                            const isExpired = isRoleExpired(userRole.expiresAt);
                            
                            return (
                              <div key={userRole.id} className={`p-4 rounded-lg border ${
                                isExpired 
                                  ? 'bg-red-500/10 border-red-500/20' 
                                  : 'bg-white/5 border-white/10'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <Shield className={`w-5 h-5 ${isExpired ? 'text-red-400' : 'text-green-400'}`} />
                                      <span className="text-white font-medium">{userRole.role.name}</span>
                                      {isExpired && (
                                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                                          Expired
                                        </span>
                                      )}
                                    </div>
                                    {userRole.role.description && (
                                      <p className="text-gray-400 text-sm mt-1">{userRole.role.description}</p>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                      <span>Assigned {new Date(userRole.assignedAt).toLocaleDateString()}</span>
                                      {userRole.expiresAt && (
                                        <span className="flex items-center space-x-1">
                                          <Clock className="w-3 h-3" />
                                          <span>Expires {new Date(userRole.expiresAt).toLocaleDateString()}</span>
                                        </span>
                                      )}
                                      {userRole.assignedByUser && (
                                        <span>by {userRole.assignedByUser.email}</span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveRole(user.id, userRole.role.id, userRole.role.name)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}