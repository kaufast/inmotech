'use client';

import React from 'react';
import { Plus, BarChart3, Euro, Target, CreditCard, FileText, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const ModernQuickActions: React.FC = () => {
  const t = useTranslations('dashboard');
  
  const actions = [
    { icon: Plus, title: t('newInvestment'), description: t('quickActions.browseProjects'), color: 'from-[#ED4F01] to-[#FF6B35]' },
    { icon: BarChart3, title: t('quickActions.viewReports'), description: t('quickActions.downloadReports'), color: 'from-blue-500 to-blue-400' },
    { icon: Euro, title: t('quickActions.withdrawFunds'), description: t('quickActions.transferMoney'), color: 'from-green-500 to-green-400' },
    { icon: Target, title: t('quickActions.setGoals'), description: t('quickActions.investmentTargets'), color: 'from-purple-500 to-purple-400' }
  ];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        <h3 className="text-lg font-semibold text-white mb-6">{t('quickActions.title')}</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              className="p-4 bg-gray-800/30 backdrop-blur-sm rounded-xl hover:bg-gray-700/30 transition-all duration-300 text-left group/action"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover/action:text-white transition-colors" />
              </div>
              <div className="space-y-1">
                <div className="font-medium text-white text-sm">{action.title}</div>
                <div className="text-xs text-gray-400">{action.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white mb-1">{t('portfolio.rebalancing')}</div>
              <div className="text-sm text-white/80">{t('portfolio.optimizeInvestments')}</div>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors">
              {t('quickActions.rebalance')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};