'use client';

import React, { useState } from 'react';
import { Clock, Filter, ArrowUpRight, ArrowDownLeft, TrendingUp, FileText, CreditCard, User } from 'lucide-react';

interface Activity {
  id: string;
  type: 'dividend' | 'investment' | 'withdrawal' | 'project_update' | 'document' | 'payment' | 'referral';
  title: string;
  description: string;
  amount?: string;
  time: string;
  status: 'completed' | 'pending' | 'processing';
  icon: string;
}

export const RecentActivity: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'financial' | 'projects' | 'account'>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  const activities: Activity[] = [
    {
      id: '1',
      type: 'dividend',
      title: 'Dividend Payment',
      description: 'Valencia Beach Resort',
      amount: '+€125.50',
      time: '2 hours ago',
      status: 'completed',
      icon: '💰'
    },
    {
      id: '2',
      type: 'project_update',
      title: 'Project Milestone',
      description: 'Madrid Luxury Residences - 80% complete',
      time: '4 hours ago',
      status: 'completed',
      icon: '🏢'
    },
    {
      id: '3',
      type: 'investment',
      title: 'New Investment',
      description: 'Barcelona Tech Hub',
      amount: '-€1,000',
      time: '1 day ago',
      status: 'completed',
      icon: '📈'
    },
    {
      id: '4',
      type: 'document',
      title: 'Document Available',
      description: 'Q3 Portfolio Report ready',
      time: '2 days ago',
      status: 'pending',
      icon: '📄'
    },
    {
      id: '5',
      type: 'payment',
      title: 'Auto-Investment',
      description: 'Monthly recurring investment',
      amount: '-€500',
      time: '3 days ago',
      status: 'completed',
      icon: '🔄'
    },
    {
      id: '6',
      type: 'withdrawal',
      title: 'Withdrawal Processed',
      description: 'Transfer to bank account',
      amount: '-€2,500',
      time: '5 days ago',
      status: 'processing',
      icon: '🏦'
    },
    {
      id: '7',
      type: 'referral',
      title: 'Referral Bonus',
      description: 'Friend joined through your link',
      amount: '+€50',
      time: '1 week ago',
      status: 'completed',
      icon: '👥'
    }
  ];

  const getActivityIcon = (activity: Activity) => {
    const iconMap = {
      dividend: ArrowDownLeft,
      investment: TrendingUp,
      withdrawal: ArrowUpRight,
      project_update: FileText,
      document: FileText,
      payment: CreditCard,
      referral: User
    };
    
    return iconMap[activity.type] || FileText;
  };

  const getStatusColor = (status: Activity['status']) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    return colors[status];
  };

  const getAmountColor = (amount?: string) => {
    if (!amount) return '';
    return amount.startsWith('+') 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'financial') return ['dividend', 'investment', 'withdrawal', 'payment', 'referral'].includes(activity.type);
    if (filter === 'projects') return ['project_update', 'investment'].includes(activity.type);
    if (filter === 'account') return ['document', 'referral'].includes(activity.type);
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
          View All
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'financial', label: 'Financial' },
            { id: 'projects', label: 'Projects' },
            { id: 'account', label: 'Account' }
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === filterOption.id
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.slice(0, 6).map((activity) => {
          const IconComponent = getActivityIcon(activity);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-lg">
                  {activity.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                      {activity.status !== 'completed' && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  {activity.amount && (
                    <div className={`text-sm font-medium ${getAmountColor(activity.amount)}`}>
                      {activity.amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">12</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">This Week</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">+€450</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Earnings</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">3</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mt-4">
        <button className="w-full p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors">
          Export Activity Report
        </button>
      </div>
    </div>
  );
};