'use client';

import React from 'react';
import { PieChart, TrendingUp, Shield, MoreHorizontal } from 'lucide-react';

export const PortfolioOverview: React.FC = () => {
  const portfolioScore = 8.5;
  const scorePercentage = (portfolioScore / 10) * 100;

  const riskLevels = [
    { level: 1, active: true },
    { level: 2, active: true },
    { level: 3, active: true },
    { level: 4, active: false },
    { level: 5, active: false }
  ];

  const diversificationScore = 80;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <PieChart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Score</h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Circular Progress */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="rgb(229, 231, 235)" 
              strokeWidth="8" 
              fill="none"
              className="dark:stroke-gray-700"
            />
            {/* Progress circle */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="rgb(249, 115, 22)" 
              strokeWidth="8" 
              fill="none"
              strokeDasharray={`${scorePercentage * 2.51} ${100 * 2.51}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{portfolioScore}</div>
              <div className="text-sm text-orange-500 font-medium">/ 10</div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-orange-500 font-semibold text-lg mb-1">Excellent</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">85th percentile</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-6">
        {/* Risk Level */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Risk Level</span>
            <span className="text-gray-900 dark:text-white text-sm font-semibold">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {riskLevels.map((risk, index) => (
                <div 
                  key={index} 
                  className={`w-3 h-3 rounded-full transition-colors ${
                    risk.active ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">3/5</span>
          </div>
        </div>

        {/* Diversification */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Diversification</span>
            <span className="text-gray-900 dark:text-white text-sm font-semibold">Good</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-max">{diversificationScore}%</span>
          </div>
        </div>

        {/* Performance */}
        <div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Performance</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 text-sm font-semibold">+12.5%</span>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Portfolio Allocation</h4>
          <div className="space-y-3">
            {[
              { name: 'Residential', percentage: 68.6, amount: '€32,450', color: 'bg-orange-500' },
              { name: 'Commercial', percentage: 21.4, amount: '€10,120', color: 'bg-blue-500' },
              { name: 'Mixed Use', percentage: 10.0, amount: '€4,680', color: 'bg-green-500' }
            ].map((allocation, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 ${allocation.color} rounded-full`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{allocation.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{allocation.amount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{allocation.percentage}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`${allocation.color} h-1.5 rounded-full transition-all duration-1000`}
                    style={{ width: `${allocation.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Consider increasing your commercial property allocation to improve diversification.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your portfolio is performing well. Maintain current strategy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};