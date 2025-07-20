'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Activity } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, subtitle, icon: Icon }) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500 dark:text-gray-400'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        </div>
        {trend !== 'neutral' && (
          <TrendIcon className={`w-4 h-4 ${trendColors[trend]}`} />
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${trendColors[trend]}`}>
            {change}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

export const PortfolioStats: React.FC = () => {
  const stats = [
    {
      title: 'Portfolio Value',
      value: '€47,250',
      change: '+12.5%',
      trend: 'up' as const,
      subtitle: 'vs last month',
      icon: DollarSign
    },
    {
      title: 'Active Projects',
      value: '12',
      change: '+2',
      trend: 'up' as const,
      subtitle: 'this quarter',
      icon: Target
    },
    {
      title: 'Annual Return',
      value: '8.7%',
      change: '+0.3%',
      trend: 'up' as const,
      subtitle: 'vs target 8.0%',
      icon: TrendingUp
    },
    {
      title: 'Next Payment',
      value: '€1,240',
      change: 'in 5 days',
      trend: 'neutral' as const,
      subtitle: 'Valencia Project',
      icon: Calendar
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};