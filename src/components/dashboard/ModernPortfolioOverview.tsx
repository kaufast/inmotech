'use client';

import React from 'react';
import { PieChart, TrendingUp, Shield, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const ModernPortfolioOverview: React.FC = () => {
  const t = useTranslations('dashboard');
  const portfolioScore = 8.5;
  const scorePercentage = (portfolioScore / 10) * 100;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-[#ED4F01]" />
            </div>
            <h3 className="text-lg font-semibold text-white">{t('portfolio.score')}</h3>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Circular Progress */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#ED4F01'}} />
                  <stop offset="100%" style={{stopColor: '#FF6B35'}} />
                </linearGradient>
              </defs>
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="rgb(55, 65, 81)" 
                strokeWidth="8" 
                fill="none"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#progressGradient)" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray={`${scorePercentage * 2.51} ${100 * 2.51}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{portfolioScore}</div>
                <div className="text-sm text-[#ED4F01] font-medium">/ 10</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-[#ED4F01] font-semibold text-lg mb-1">{t('portfolio.excellent')}</div>
            <div className="text-sm text-gray-400">{t('portfolio.percentile')}</div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">{t('portfolio.allocation')}</h4>
          {[
            { name: t('categories.residential'), percentage: 68.6, amount: '€32,450', color: 'from-[#ED4F01] to-[#FF6B35]' },
            { name: t('categories.commercial'), percentage: 21.4, amount: '€10,120', color: 'from-blue-500 to-blue-400' },
            { name: t('categories.mixedUse'), percentage: 10.0, amount: '€4,680', color: 'from-green-500 to-green-400' }
          ].map((allocation, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 bg-gradient-to-r ${allocation.color} rounded-full`} />
                  <span className="text-sm text-gray-400">{allocation.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{allocation.amount}</div>
                  <div className="text-xs text-gray-500">{allocation.percentage}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${allocation.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${allocation.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};