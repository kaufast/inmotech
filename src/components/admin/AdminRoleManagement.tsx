'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Lock,
  Unlock,
  Crown,
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  rolePermissions: {
    permission: Permission;
  }[];
  _count: {
    userRoles: number;
  };
}

interface RoleFormData {
  name: string;
  description: string;
  permissionIds: string[];
}

export default function AdminRoleManagement() {
  const { token } = useSecureAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissionIds: []
  });

  const [filters, setFilters] = useState({
    search: '',
    resource: '',
    showInactive: false
  });

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error loading roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      } else {
        toast.error('Failed to fetch permissions');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Error loading permissions');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions()]);
      setLoading(false);
    };

    loadData();
  }, [token]);

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', description: '', permissionIds: [] });
        await fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Error creating role');
    }
  };

  const handleUpdateRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role updated successfully');
        setEditingRole(null);
        setFormData({ name: '', description: '', permissionIds: [] });
        await fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error updating role');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        await fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error deleting role');
    }
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.rolePermissions.map(rp => rp.permission.id)
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setShowCreateForm(false);
    setFormData({ name: '', description: '', permissionIds: [] });
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
  };

  const filteredRoles = roles.filter(role => {
    if (!filters.showInactive && !role.isActive) return false;
    if (filters.search && !role.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !role.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getResourceIcon = (resource: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      users: Users,
      admin: Crown,
      analytics: Settings,
      projects: Settings,
      investments: Settings,
      kyc: Shield,
      payments: Settings
    };
    const Icon = icons[resource] || Settings;
    return Icon;
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
          <h1 className="text-3xl font-bold text-white mb-2">Role Management</h1>
          <p className="text-gray-400">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingRole(null);
            setFormData({ name: '', description: '', permissionIds: [] });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={filters.showInactive}
              onChange={(e) => setFilters(prev => ({ ...prev, showInactive: e.target.checked }))}
              className="w-4 h-4 text-orange-500 bg-white/5 border-white/10 rounded focus:ring-orange-500"
            />
            <span>Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Role Creation/Edit Form */}
      {(showCreateForm || editingRole) && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  placeholder="Enter role name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  placeholder="Enter role description"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Permissions
              </label>
              <div className="space-y-4">
                {Object.entries(permissionsByResource).map(([resource, resourcePermissions]) => {
                  const Icon = getResourceIcon(resource);
                  const selectedCount = resourcePermissions.filter(p => formData.permissionIds.includes(p.id)).length;
                  
                  return (
                    <div key={resource} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className="w-5 h-5 text-orange-400" />
                        <span className="text-white font-medium capitalize">{resource}</span>
                        <span className="text-sm text-gray-400">
                          ({selectedCount}/{resourcePermissions.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {resourcePermissions.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="w-4 h-4 text-orange-500 bg-white/5 border-white/10 rounded focus:ring-orange-500"
                            />
                            <span className="text-gray-300">{permission.action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
              <button
                onClick={cancelEdit}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => editingRole ? handleUpdateRole(editingRole.id) : handleCreateRole()}
                disabled={!formData.name.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingRole ? 'Update Role' : 'Create Role'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No roles found</p>
          </div>
        ) : (
          filteredRoles.map(role => (
            <div key={role.id} className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${role.isActive ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      {role.isActive ? (
                        <Shield className="w-6 h-6 text-green-400" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          role.isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {role.description && (
                        <p className="text-gray-400 mt-1">{role.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <span>{role.rolePermissions.length} permissions</span>
                        <span>{role._count.userRoles} users</span>
                        <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedRole === role.id ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEditRole(role)}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      disabled={role._count.userRoles > 0}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded permissions view */}
                {expandedRole === role.id && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-medium mb-4">Permissions ({role.rolePermissions.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(
                        role.rolePermissions.reduce((acc, rp) => {
                          const resource = rp.permission.resource;
                          if (!acc[resource]) acc[resource] = [];
                          acc[resource].push(rp.permission);
                          return acc;
                        }, {} as Record<string, Permission[]>)
                      ).map(([resource, perms]) => {
                        const Icon = getResourceIcon(resource);
                        return (
                          <div key={resource} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="w-4 h-4 text-orange-400" />
                              <span className="text-white text-sm font-medium capitalize">{resource}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {perms.map(perm => (
                                <span
                                  key={perm.id}
                                  className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded"
                                >
                                  {perm.action}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}