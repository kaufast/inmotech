'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Monitor,
  Globe,
  Shield,
  Clock,
  Activity,
  Eye,
  UserCheck,
  Smartphone,
  Laptop,
  Tablet,
  Crown,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface AnalyticsOverview {
  totalUsers: number;
  newUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  twoFactorUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  newSessions: number;
}

interface GrowthMetrics {
  userGrowthRate: number;
  activationRate: number;
  retentionRate: number;
  churnRate: number;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface DeviceData {
  type: string;
  count: number;
}

interface BrowserData {
  name: string;
  count: number;
}

interface GeographicData {
  country: string;
  users: number;
}

interface HourlyActivity {
  hour: number;
  logins: number;
}

interface EngagementMetrics {
  averageSessionDuration: string;
  averageLoginsPerUser: number;
  mostActiveHours: number[];
  peakUsageDay: string;
  bounceRate: number;
  returnUserRate: number;
}

interface SecurityMetrics {
  twoFactorAdoption: number;
  averagePasswordAge: string;
  accountLockouts: number;
  securityIncidents: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  growth: {
    userGrowth: UserGrowthData[];
    metrics: GrowthMetrics;
  };
  devices: {
    breakdown: DeviceData[];
    browsers: BrowserData[];
  };
  geography: GeographicData[];
  activity: {
    hourlyLogins: HourlyActivity[];
    engagement: EngagementMetrics;
  };
  security: SecurityMetrics;
  timeRange: string;
  generatedAt: string;
}

const COLORS = ['#ED4F01', '#FF6B35', '#FFA366', '#FFB84D', '#FFC933', '#FFD700'];

export default function AdminAnalyticsDashboard() {
  const { token } = useSecureAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token, timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number, isReverse = false) => {
    const isPositive = isReverse ? value < 0 : value > 0;
    return isPositive ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  const getTrendColor = (value: number, isReverse = false) => {
    const isPositive = isReverse ? value < 0 : value > 0;
    return isPositive ? 'text-green-400' : 'text-red-400';
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

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-400">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={() => fetchAnalytics()}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
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

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-white/5 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart },
          { id: 'growth', label: 'Growth', icon: TrendingUp },
          { id: 'devices', label: 'Devices', icon: Monitor },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'security', label: 'Security', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center space-x-1 text-green-400">
                  {getTrendIcon(data.growth.metrics.userGrowthRate)}
                  <span className="text-sm">{formatPercentage(data.growth.metrics.userGrowthRate)}</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.totalUsers)}</p>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-xs text-green-400 mt-1">+{data.overview.newUsers} new this period</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-sm text-gray-400">{formatPercentage(data.growth.metrics.activationRate)}</div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.verifiedUsers)}</p>
                <p className="text-sm text-gray-400">Verified Users</p>
                <p className="text-xs text-gray-400 mt-1">Activation rate</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Monitor className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-sm text-gray-400">{data.overview.newSessions} new</div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.activeSessions)}</p>
                <p className="text-sm text-gray-400">Active Sessions</p>
                <p className="text-xs text-purple-400 mt-1">of {formatNumber(data.overview.totalSessions)} total</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-sm text-gray-400">{formatPercentage(data.security.twoFactorAdoption)}</div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.twoFactorUsers)}</p>
                <p className="text-sm text-gray-400">2FA Enabled</p>
                <p className="text-xs text-orange-400 mt-1">Security adoption</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                User Growth
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.growth.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="newUsers" 
                    stackId="1"
                    stroke="#ED4F01" 
                    fill="#ED4F01" 
                    fillOpacity={0.3}
                    name="New Users"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalUsers" 
                    stackId="2"
                    stroke="#FF6B35" 
                    fill="#FF6B35" 
                    fillOpacity={0.2}
                    name="Total Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-purple-400" />
                Device Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.devices.breakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.devices.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Growth Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-8">
          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                {getTrendIcon(data.growth.metrics.userGrowthRate)}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.growth.metrics.userGrowthRate)}</p>
                <p className="text-sm text-gray-400">Growth Rate</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                {getTrendIcon(data.growth.metrics.activationRate)}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.growth.metrics.activationRate)}</p>
                <p className="text-sm text-gray-400">Activation Rate</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                {getTrendIcon(data.growth.metrics.retentionRate)}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.growth.metrics.retentionRate)}</p>
                <p className="text-sm text-gray-400">Retention Rate</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
                {getTrendIcon(data.growth.metrics.churnRate, true)}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.growth.metrics.churnRate)}</p>
                <p className="text-sm text-gray-400">Churn Rate</p>
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Growth Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.growth.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="newUsers" stroke="#ED4F01" strokeWidth={3} name="New Users" />
                <Line type="monotone" dataKey="totalUsers" stroke="#FF6B35" strokeWidth={3} name="Total Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Types */}
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Device Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.devices.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#ED4F01" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Browser Usage */}
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Browser Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.devices.browsers}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.devices.browsers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.devices.breakdown.map((device, index) => {
              const getDeviceIcon = (type: string) => {
                switch (type.toLowerCase()) {
                  case 'mobile':
                    return <Smartphone className="w-6 h-6" />;
                  case 'desktop':
                    return <Laptop className="w-6 h-6" />;
                  case 'tablet':
                    return <Tablet className="w-6 h-6" />;
                  default:
                    return <Monitor className="w-6 h-6" />;
                }
              };

              return (
                <div key={device.type} className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {((device.count / data.devices.breakdown.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">{formatNumber(device.count)}</p>
                    <p className="text-sm text-gray-400">{device.type} Devices</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-8">
          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.activity.engagement.averageSessionDuration}</p>
                <p className="text-sm text-gray-400">Avg Session Duration</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.activity.engagement.averageLoginsPerUser.toFixed(1)}</p>
                <p className="text-sm text-gray-400">Avg Logins/User</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.activity.engagement.returnUserRate * 100)}</p>
                <p className="text-sm text-gray-400">Return Rate</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.activity.engagement.peakUsageDay}</p>
                <p className="text-sm text-gray-400">Peak Usage Day</p>
              </div>
            </div>
          </div>

          {/* Hourly Activity Chart */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Login Activity by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.activity.hourlyLogins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9CA3AF"
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Bar dataKey="logins" fill="#ED4F01" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-400" />
              Geographic Distribution
            </h3>
            <div className="space-y-4">
              {data.geography.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-white font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(country.users / Math.max(...data.geography.map(c => c.users))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-12 text-right">{country.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-sm text-green-400">Good</div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{formatPercentage(data.security.twoFactorAdoption)}</p>
                <p className="text-sm text-gray-400">2FA Adoption</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm text-yellow-400">Average</div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.security.averagePasswordAge}</p>
                <p className="text-sm text-gray-400">Avg Password Age</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <div className={`text-sm ${data.security.accountLockouts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.security.accountLockouts > 0 ? 'Warning' : 'Good'}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.security.accountLockouts}</p>
                <p className="text-sm text-gray-400">Account Lockouts</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Crown className="w-6 h-6 text-orange-400" />
                </div>
                <div className={`text-sm ${data.security.securityIncidents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.security.securityIncidents > 0 ? 'Alert' : 'Clear'}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{data.security.securityIncidents}</p>
                <p className="text-sm text-gray-400">Security Incidents</p>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Security Status Overview</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">{formatPercentage(data.security.twoFactorAdoption)} of users have 2FA enabled</p>
                  </div>
                </div>
                <div className="text-green-400 font-semibold">Healthy</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Password Security</p>
                    <p className="text-sm text-gray-400">Average password age: {data.security.averagePasswordAge}</p>
                  </div>
                </div>
                <div className="text-yellow-400 font-semibold">Monitor</div>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${
                data.security.accountLockouts > 0 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <Users className={`w-5 h-5 ${data.security.accountLockouts > 0 ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <p className="text-white font-medium">Account Lockouts</p>
                    <p className="text-sm text-gray-400">{data.security.accountLockouts} accounts currently locked</p>
                  </div>
                </div>
                <div className={`font-semibold ${data.security.accountLockouts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.security.accountLockouts > 0 ? 'Action Required' : 'Good'}
                </div>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${
                data.security.securityIncidents > 0 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <Crown className={`w-5 h-5 ${data.security.securityIncidents > 0 ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <p className="text-white font-medium">Security Incidents</p>
                    <p className="text-sm text-gray-400">{data.security.securityIncidents} incidents in the last {timeRange}</p>
                  </div>
                </div>
                <div className={`font-semibold ${data.security.securityIncidents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.security.securityIncidents > 0 ? 'Review Required' : 'All Clear'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-400">
        Last updated: {new Date(data.generatedAt).toLocaleString()} • Data range: {timeRange}
      </div>
    </div>
  );
}