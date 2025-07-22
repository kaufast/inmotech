'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Search,
  Filter,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Ban,
  Eye,
  Trash2,
  RefreshCw,
  Globe,
  Wifi,
  Chrome,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  X
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface UserSession {
  id: string;
  userId: string;
  deviceName: string | null;
  deviceType: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  ipAddress: string | null;
  location: string | null;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  terminatedAt: string | null;
  terminatedBy: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isVerified: boolean;
    isAdmin: boolean;
    lastLogin: string | null;
    createdAt: string;
  };
}

interface SessionStats {
  activeSessions: number;
  deviceBreakdown: Record<string, number>;
  suspiciousActivity: number;
}

interface SuspiciousActivity {
  email: string;
  ip_count: number;
  session_count: number;
  earliest_session: string;
  latest_session: string;
}

interface SessionsResponse {
  sessions: UserSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: SessionStats;
  suspiciousActivity: SuspiciousActivity[];
}

export default function AdminSessionMonitoring() {
  const { token } = useSecureAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<SessionStats>({
    activeSessions: 0,
    deviceBreakdown: {},
    suspiciousActivity: 0
  });
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
        sort: sortBy,
        order: sortOrder
      });

      const response = await fetch(`/api/admin/sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: SessionsResponse = await response.json();
        setSessions(data.sessions);
        setPagination(data.pagination);
        setStats(data.stats);
        setSuspiciousActivity(data.suspiciousActivity);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string, userId?: string, terminateAll: boolean = false) => {
    try {
      setActionLoading(sessionId);
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: terminateAll ? undefined : sessionId,
          userId: terminateAll ? userId : undefined,
          terminateAll
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        if (terminateAll) {
          setSessions(prev => prev.map(session => 
            session.userId === userId ? { ...session, isActive: false, terminatedAt: new Date().toISOString(), terminatedBy: 'admin' } : session
          ));
        } else {
          setSessions(prev => prev.map(session => 
            session.id === sessionId ? { ...session, isActive: false, terminatedAt: new Date().toISOString(), terminatedBy: 'admin' } : session
          ));
        }
        
        // Update selected session if it's open
        if (selectedSession?.id === sessionId || (terminateAll && selectedSession?.userId === userId)) {
          setSelectedSession(prev => prev ? { ...prev, isActive: false, terminatedAt: new Date().toISOString(), terminatedBy: 'admin' } : null);
        }
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token, pagination.page, search, statusFilter, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Laptop className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getBrowserIcon = (browserName: string | null) => {
    switch (browserName?.toLowerCase()) {
      case 'chrome':
        return <Chrome className="w-4 h-4" />;
      case 'firefox':
        return <Globe className="w-4 h-4 text-orange-500" />;
      case 'safari':
        return <Globe className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getSessionStatusBadge = (session: UserSession) => {
    if (session.isActive) {
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      const diffMins = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
      
      if (diffMins < 5) {
        return <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">Active</span>;
      } else if (diffMins < 30) {
        return <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">Idle</span>;
      } else {
        return <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">Away</span>;
      }
    }
    return <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">Inactive</span>;
  };

  const getUserDisplayName = (user: UserSession['user']) => {
    return user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.email;
  };

  if (loading && sessions.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Session Monitoring</h1>
          <p className="text-gray-400">Monitor active user sessions and security events</p>
        </div>
        <button
          onClick={() => fetchSessions()}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.activeSessions}</p>
            </div>
            <Monitor className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Mobile Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.deviceBreakdown.mobile || 0}</p>
            </div>
            <Smartphone className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Desktop Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.deviceBreakdown.desktop || 0}</p>
            </div>
            <Laptop className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Suspicious Activity</p>
              <p className="text-2xl font-bold text-white">{stats.suspiciousActivity}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Suspicious Activity Alert */}
      {suspiciousActivity.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-2">Suspicious Activity Detected</h3>
              <div className="space-y-2">
                {suspiciousActivity.slice(0, 3).map((activity, index) => (
                  <div key={index} className="text-sm text-red-300">
                    <span className="font-medium">{activity.email}</span> has {activity.session_count} sessions from {activity.ip_count} different IP addresses
                  </div>
                ))}
                {suspiciousActivity.length > 3 && (
                  <div className="text-sm text-red-400">+{suspiciousActivity.length - 3} more suspicious accounts</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, devices, IPs..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setSortBy(sort);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="lastActivity-desc">Last Activity (Recent)</option>
            <option value="lastActivity-asc">Last Activity (Oldest)</option>
            <option value="createdAt-desc">Created (Newest)</option>
            <option value="createdAt-asc">Created (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-300">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Device</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Location</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Last Activity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(session.user.firstName?.[0] || session.user.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{getUserDisplayName(session.user)}</p>
                        <p className="text-sm text-gray-400">{session.user.email}</p>
                        {session.user.isAdmin && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Admin</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(session.deviceType)}
                      <div>
                        <p className="text-sm text-white">
                          {session.deviceName || `${session.deviceType || 'Unknown'} Device`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {getBrowserIcon(session.browserName)}
                          <span>{session.browserName} {session.browserVersion}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center space-x-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{session.location || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Wifi className="w-3 h-3" />
                        <span>{session.ipAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getSessionStatusBadge(session)}
                  </td>
                  <td className="p-4 text-sm text-gray-300">
                    <div>{formatTimeAgo(session.lastActivity)}</div>
                    <div className="text-xs text-gray-400">{formatDate(session.lastActivity)}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowSessionModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {session.isActive && (
                        <>
                          <button
                            onClick={() => terminateSession(session.id)}
                            disabled={actionLoading === session.id}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title="Terminate Session"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => terminateSession(session.id, session.userId, true)}
                            disabled={actionLoading === session.id}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title="Terminate All User Sessions"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sessions
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 text-sm text-white">
                {pagination.page} / {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Session Details</h2>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400">Name</label>
                    <p className="text-white">{getUserDisplayName(selectedSession.user)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Email</label>
                    <p className="text-white">{selectedSession.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Account Status</label>
                    <div className="flex items-center space-x-2">
                      {selectedSession.user.isVerified ? (
                        <span className="text-green-400">Verified</span>
                      ) : (
                        <span className="text-yellow-400">Unverified</span>
                      )}
                      {selectedSession.user.isAdmin && (
                        <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs">Admin</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Last Login</label>
                    <p className="text-white">{selectedSession.user.lastLogin ? formatDate(selectedSession.user.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Session Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400">Session Status</label>
                    {getSessionStatusBadge(selectedSession)}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Session ID</label>
                    <p className="text-white font-mono text-sm">{selectedSession.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Created</label>
                    <p className="text-white">{formatDate(selectedSession.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Last Activity</label>
                    <p className="text-white">{formatDate(selectedSession.lastActivity)}</p>
                  </div>
                  {selectedSession.terminatedAt && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400">Terminated</label>
                        <p className="text-white">{formatDate(selectedSession.terminatedAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400">Terminated By</label>
                        <p className="text-white">{selectedSession.terminatedBy || 'System'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Device Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Device & Browser</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400">Device</label>
                    <div className="flex items-center space-x-2 text-white">
                      {getDeviceIcon(selectedSession.deviceType)}
                      <span>{selectedSession.deviceName || `${selectedSession.deviceType || 'Unknown'} Device`}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Operating System</label>
                    <p className="text-white">{selectedSession.osName} {selectedSession.osVersion}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Browser</label>
                    <div className="flex items-center space-x-2 text-white">
                      {getBrowserIcon(selectedSession.browserName)}
                      <span>{selectedSession.browserName} {selectedSession.browserVersion}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">IP Address</label>
                    <p className="text-white">{selectedSession.ipAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                <div className="flex items-center space-x-2 text-white">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedSession.location || 'Unknown location'}</span>
                </div>
              </div>

              {/* Actions */}
              {selectedSession.isActive && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Session Actions</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        terminateSession(selectedSession.id);
                        setShowSessionModal(false);
                      }}
                      disabled={actionLoading === selectedSession.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Terminate This Session
                    </button>
                    
                    <button
                      onClick={() => {
                        terminateSession(selectedSession.id, selectedSession.userId, true);
                        setShowSessionModal(false);
                      }}
                      disabled={actionLoading === selectedSession.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Terminate All User Sessions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}