'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Monitor, 
  Shield, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  Lock
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  activeSessions: number;
  totalSessions: number;
  twoFactorEnabled: number;
  recentSignups: number;
  failedLogins: number;
  suspiciousActivity: number;
}

export default function AdminOverview() {
  const { token } = useSecureAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    activeSessions: 0,
    totalSessions: 0,
    twoFactorEnabled: 0,
    recentSignups: 0,
    failedLogins: 0,
    suspiciousActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [token]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      change: `+${stats.recentSignups} this week`,
      changeType: 'positive' as const
    },
    {
      title: 'Verified Users',
      value: stats.verifiedUsers,
      icon: UserCheck,
      color: 'green',
      change: `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% verified`,
      changeType: 'neutral' as const
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: Monitor,
      color: 'purple',
      change: `${stats.totalSessions} total sessions`,
      changeType: 'neutral' as const
    },
    {
      title: '2FA Enabled',
      value: stats.twoFactorEnabled,
      icon: Shield,
      color: 'orange',
      change: `${Math.round((stats.twoFactorEnabled / stats.totalUsers) * 100)}% adoption`,
      changeType: 'positive' as const
    },
    {
      title: 'Failed Logins',
      value: stats.failedLogins,
      icon: AlertTriangle,
      color: 'red',
      change: 'Last 24 hours',
      changeType: 'negative' as const
    },
    {
      title: 'Security Events',
      value: stats.suspiciousActivity,
      icon: Lock,
      color: 'yellow',
      change: 'Requires attention',
      changeType: 'warning' as const
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getChangeColor = (changeType: string) => {
    const changeColorMap = {
      positive: 'text-green-400',
      negative: 'text-red-400', 
      warning: 'text-yellow-400',
      neutral: 'text-gray-400'
    };
    return changeColorMap[changeType as keyof typeof changeColorMap] || changeColorMap.neutral;
  };

  if (isLoading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Overview</h1>
        <p className="text-gray-400">Platform metrics and system health monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg border ${getColorClasses(card.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{card.title}</h3>
                <p className={`text-sm ${getChangeColor(card.changeType)}`}>
                  {card.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            System Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-gray-300">Platform Health</span>
              <span className="text-green-400 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <span className="text-gray-300">Database</span>
              <span className="text-blue-400 font-medium">Connected</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <span className="text-gray-300">Email Service</span>
              <span className="text-orange-400 font-medium">AWS SES Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            Recent Activity
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-white">New user registration</p>
                <p className="text-xs text-gray-400">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-white">2FA setup completed</p>
                <p className="text-xs text-gray-400">15 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Password reset requested</p>
                <p className="text-xs text-gray-400">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors text-left">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <p className="font-medium text-white">Manage Users</p>
            <p className="text-xs text-gray-400">User accounts & permissions</p>
          </button>
          
          <button className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-colors text-left">
            <Monitor className="w-8 h-8 text-purple-400 mb-2" />
            <p className="font-medium text-white">Session Monitor</p>
            <p className="text-xs text-gray-400">Active sessions & security</p>
          </button>
          
          <button className="p-4 bg-green-500/10 hover:bg-green-500/20 rounded-lg border border-green-500/30 transition-colors text-left">
            <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
            <p className="font-medium text-white">Analytics</p>
            <p className="text-xs text-gray-400">Platform insights & reports</p>
          </button>
          
          <button className="p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg border border-orange-500/30 transition-colors text-left">
            <Shield className="w-8 h-8 text-orange-400 mb-2" />
            <p className="font-medium text-white">Security</p>
            <p className="text-xs text-gray-400">Security logs & audit</p>
          </button>
        </div>
      </div>
    </div>
  );
}