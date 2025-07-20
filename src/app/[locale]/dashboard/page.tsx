'use client';

import React from 'react';
import { ModernDashboardLayout } from '@/components/layout/ModernDashboardLayout';
import { useTranslations } from 'next-intl';
import { ModernPortfolioStats } from '@/components/dashboard/ModernPortfolioStats';
import { ModernPerformanceChart } from '@/components/dashboard/ModernPerformanceChart';
import { ModernInvestmentProjects } from '@/components/dashboard/ModernInvestmentProjects';
import { ModernPortfolioOverview } from '@/components/dashboard/ModernPortfolioOverview';
import { ModernQuickActions } from '@/components/dashboard/ModernQuickActions';
import { ModernRecentActivity } from '@/components/dashboard/ModernRecentActivity';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <ModernDashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t('dashboard.greeting', { name: user?.firstName || 'User' })}
              </h1>
              <p className="text-gray-400 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button className="bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] hover:shadow-lg hover:shadow-[#ED4F01]/25 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300">
                {t('dashboard.newInvestment')}
              </button>
            </div>
          </div>

          {/* Portfolio Stats Grid */}
          <ModernPortfolioStats />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <ModernPerformanceChart />
              <ModernInvestmentProjects />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <ModernPortfolioOverview />
              <ModernQuickActions />
              <ModernRecentActivity />
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </ProtectedRoute>
  );
}