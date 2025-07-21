'use client';

import React, { useState, useEffect } from 'react';
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

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  currentReturns: number;
  expectedAnnualReturn: number;
  activeProjects: number;
  portfolioGrowth: number;
  nextPayment: {
    amount: number;
    date: string;
    projectTitle: string;
  } | null;
}

export const ModernPortfolioStats: React.FC = () => {
  const t = useTranslations('dashboard');
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioStats = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setPortfolioStats(data.portfolioStats);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioStats();
  }, []);

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getDaysUntilPayment = (dateString: string | null) => {
    if (!dateString) return 0;
    const paymentDate = new Date(dateString);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!portfolioStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full text-center text-gray-400 py-8">
          {t('stats.noData', { default: 'No portfolio data available' })}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: t('portfolio.value'),
      value: formatCurrency(portfolioStats.totalValue),
      change: formatPercentage(portfolioStats.portfolioGrowth),
      trend: portfolioStats.portfolioGrowth >= 0 ? 'up' as const : 'down' as const,
      subtitle: t('stats.vsLastMonth'),
      icon: DollarSign
    },
    {
      title: t('stats.activeProjects'),
      value: portfolioStats.activeProjects.toString(),
      change: `€${formatCurrency(portfolioStats.totalInvested).replace('€', '')}`,
      trend: portfolioStats.activeProjects > 0 ? 'up' as const : 'neutral' as const,
      subtitle: t('stats.totalInvested', { default: 'total invested' }),
      icon: Target
    },
    {
      title: t('stats.annualReturn'),
      value: `${portfolioStats.expectedAnnualReturn.toFixed(1)}%`,
      change: formatCurrency(portfolioStats.currentReturns),
      trend: portfolioStats.currentReturns >= 0 ? 'up' as const : 'down' as const,
      subtitle: t('stats.currentReturns', { default: 'current returns' }),
      icon: TrendingUp
    },
    {
      title: t('stats.nextPayment'),
      value: portfolioStats.nextPayment ? formatCurrency(portfolioStats.nextPayment.amount) : '€0',
      change: portfolioStats.nextPayment 
        ? t('stats.inDays', { days: getDaysUntilPayment(portfolioStats.nextPayment.date) })
        : t('stats.noPayments', { default: 'No upcoming payments' }),
      trend: 'neutral' as const,
      subtitle: portfolioStats.nextPayment?.projectTitle || t('stats.noProject', { default: 'No active projects' }),
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