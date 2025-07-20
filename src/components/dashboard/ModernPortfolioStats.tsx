'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Activity, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
  icon: React.ElementType;
}

const ModernStatCard: React.FC<StatCardProps> = ({ title, value, change, trend, subtitle, icon: Icon }) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#ED4F01]" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          </div>
          {trend !== 'neutral' && (
            <TrendIcon className={`w-4 h-4 ${trendColors[trend]}`} />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${trendColors[trend]}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500">{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModernPortfolioStats: React.FC = () => {
  const t = useTranslations('dashboard');
  
  const stats = [
    {
      title: t('portfolio.value'),
      value: '€47,250',
      change: '+12.5%',
      trend: 'up' as const,
      subtitle: t('stats.vsLastMonth'),
      icon: DollarSign
    },
    {
      title: t('stats.activeProjects'),
      value: '12',
      change: '+2',
      trend: 'up' as const,
      subtitle: t('stats.thisQuarter'),
      icon: Target
    },
    {
      title: t('stats.annualReturn'),
      value: '8.7%',
      change: '+0.3%',
      trend: 'up' as const,
      subtitle: t('stats.vsTarget'),
      icon: TrendingUp
    },
    {
      title: t('stats.nextPayment'),
      value: '€1,240',
      change: t('stats.inDays', { days: 5 }),
      trend: 'neutral' as const,
      subtitle: t('projects.valenciaProject'),
      icon: Calendar
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <ModernStatCard key={index} {...stat} />
      ))}
    </div>
  );
};