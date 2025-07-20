'use client';

import React from 'react';
import { Clock, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const ModernRecentActivity: React.FC = () => {
  const t = useTranslations('dashboard');
  
  const activities = [
    { icon: '💰', title: t('activity.dividendPayment'), description: 'Valencia Beach Resort', amount: '+€125.50', time: t('activity.timeAgo.hoursAgo', { hours: 2 }), trend: 'positive' },
    { icon: '🏢', title: t('activity.projectMilestone'), description: 'Madrid Luxury - 80% complete', time: t('activity.timeAgo.hoursAgo', { hours: 4 }), trend: 'neutral' },
    { icon: '📈', title: t('activity.newInvestment'), description: 'Barcelona Tech Hub', amount: '-€1,000', time: t('activity.timeAgo.daysAgo', { days: 1 }), trend: 'negative' },
    { icon: '📄', title: t('activity.documentReady'), description: 'Q3 Portfolio Report', time: t('activity.timeAgo.daysAgo', { days: 2 }), trend: 'neutral' }
  ];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#ED4F01]" />
            </div>
            <h3 className="text-lg font-semibold text-white">{t('activity.recentActivity')}</h3>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-800/30 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {activity.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">{activity.title}</h4>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                    <span className="text-xs text-gray-500 mt-1">{activity.time}</span>
                  </div>
                  
                  {activity.amount && (
                    <div className={`text-sm font-medium ${
                      activity.trend === 'positive' ? 'text-green-400' : 
                      activity.trend === 'negative' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {activity.amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-800/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-white">12</div>
              <div className="text-xs text-gray-400">{t('activity.thisWeek')}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-400">+€450</div>
              <div className="text-xs text-gray-400">{t('activity.earnings')}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-400">3</div>
              <div className="text-xs text-gray-400">{t('activity.pending')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};