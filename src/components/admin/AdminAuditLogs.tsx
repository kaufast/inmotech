'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Monitor,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
  Lock,
  LogIn,
  LogOut,
  Key,
  Mail,
  UserCheck,
  UserX,
  ShieldOff,
  Activity
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  eventType: string;
  eventAction: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  adminId?: string;
  ipAddress: string;
  userAgent: string;
  location?: any;
  metadata?: any;
  errorMessage?: string;
  severity: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  admin?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Event type icons and colors
const eventTypeConfig: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  // Authentication events
  login_attempt: { icon: LogIn, color: 'text-blue-400', label: 'Login Attempt' },
  login_success: { icon: CheckCircle, color: 'text-green-400', label: 'Login Success' },
  login_failed: { icon: XCircle, color: 'text-red-400', label: 'Login Failed' },
  logout: { icon: LogOut, color: 'text-gray-400', label: 'Logout' },
  
  // Password events
  password_reset_request: { icon: Key, color: 'text-yellow-400', label: 'Password Reset Request' },
  password_reset_success: { icon: Key, color: 'text-green-400', label: 'Password Reset' },
  password_changed: { icon: Key, color: 'text-blue-400', label: 'Password Changed' },
  
  // 2FA events
  '2fa_enabled': { icon: Shield, color: 'text-green-400', label: '2FA Enabled' },
  '2fa_disabled': { icon: ShieldOff, color: 'text-yellow-400', label: '2FA Disabled' },
  '2fa_verify_success': { icon: Shield, color: 'text-green-400', label: '2FA Verified' },
  '2fa_verify_failed': { icon: Shield, color: 'text-red-400', label: '2FA Failed' },
  
  // Session events
  session_created: { icon: Monitor, color: 'text-blue-400', label: 'Session Created' },
  session_terminated: { icon: Monitor, color: 'text-red-400', label: 'Session Terminated' },
  session_expired: { icon: Monitor, color: 'text-gray-400', label: 'Session Expired' },
  
  // Email events
  email_verification_sent: { icon: Mail, color: 'text-blue-400', label: 'Email Sent' },
  email_verified: { icon: Mail, color: 'text-green-400', label: 'Email Verified' },
  email_verification_failed: { icon: Mail, color: 'text-red-400', label: 'Email Verification Failed' },
  
  // User management
  user_created: { icon: UserCheck, color: 'text-green-400', label: 'User Created' },
  user_updated: { icon: User, color: 'text-blue-400', label: 'User Updated' },
  user_deleted: { icon: UserX, color: 'text-red-400', label: 'User Deleted' },
  user_banned: { icon: UserX, color: 'text-red-400', label: 'User Banned' },
  user_unbanned: { icon: UserCheck, color: 'text-green-400', label: 'User Unbanned' },
  
  // Security events
  suspicious_activity: { icon: AlertTriangle, color: 'text-orange-400', label: 'Suspicious Activity' },
  account_locked: { icon: Lock, color: 'text-red-400', label: 'Account Locked' },
  account_unlocked: { icon: Lock, color: 'text-green-400', label: 'Account Unlocked' },
  
  // Default
  default: { icon: Info, color: 'text-gray-400', label: 'Event' }
};

// Severity colors
const severityColors: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  critical: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

export default function AdminAuditLogs() {
  const { token } = useSecureAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    userId: '',
    ipAddress: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 50
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [token, filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getEventConfig = (eventType: string) => {
    return eventTypeConfig[eventType] || eventTypeConfig.default;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatUserAgent = (userAgent: string) => {
    // Extract browser and OS info
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || '';
    const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || '';
    return `${browser} ${os}`.trim() || 'Unknown';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">Security and activity event logs</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fetchAuditLogs()}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Event Type Filter */}
          <select
            value={filters.eventType}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="">All Events</option>
            <optgroup label="Authentication">
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="logout">Logout</option>
            </optgroup>
            <optgroup label="Security">
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="account_locked">Account Locked</option>
              <option value="2fa_verify_failed">2FA Failed</option>
            </optgroup>
            <optgroup label="User Management">
              <option value="user_created">User Created</option>
              <option value="user_updated">User Updated</option>
              <option value="user_banned">User Banned</option>
            </optgroup>
          </select>

          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          {/* User ID Filter */}
          <input
            type="text"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />

          {/* IP Address Filter */}
          <input
            type="text"
            placeholder="IP Address"
            value={filters.ipAddress}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />

          {/* Date Range */}
          <input
            type="datetime-local"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          />
          
          <input
            type="datetime-local"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => {
                  const config = getEventConfig(log.eventType);
                  const Icon = config.icon;
                  
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <span className="text-sm text-white">{config.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.user ? (
                          <div>
                            <p className="text-white">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-gray-400 text-xs">{log.user.email}</p>
                          </div>
                        ) : log.metadata?.email ? (
                          <p className="text-gray-400">{log.metadata.email}</p>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatUserAgent(log.userAgent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full border ${severityColors[log.severity] || severityColors.info}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} logs
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Previous
              </button>
              <span className="text-white px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Event Type</p>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const config = getEventConfig(selectedLog.eventType);
                        const Icon = config.icon;
                        return (
                          <>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                            <span className="text-white">{config.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Severity</p>
                    <span className={`px-3 py-1 text-sm rounded-full border ${severityColors[selectedLog.severity] || severityColors.info}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Timestamp</p>
                    <p className="text-white">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Action</p>
                    <p className="text-white">{selectedLog.eventAction}</p>
                  </div>
                </div>

                {/* User Info */}
                {(selectedLog.user || selectedLog.admin) && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">User Information</h4>
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      {selectedLog.user && (
                        <div>
                          <p className="text-sm text-gray-400">User</p>
                          <p className="text-white">
                            {selectedLog.user.firstName} {selectedLog.user.lastName} ({selectedLog.user.email})
                          </p>
                        </div>
                      )}
                      {selectedLog.admin && (
                        <div>
                          <p className="text-sm text-gray-400">Admin</p>
                          <p className="text-white">
                            {selectedLog.admin.firstName} {selectedLog.admin.lastName} ({selectedLog.admin.email})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Technical Details</h4>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div>
                      <p className="text-sm text-gray-400">IP Address</p>
                      <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">User Agent</p>
                      <p className="text-white text-sm font-mono break-all">{selectedLog.userAgent}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Additional Information</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Error Details</h4>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400">{selectedLog.errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}