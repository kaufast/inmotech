'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  change: number;
}

export const PerformanceChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const chartData: Record<string, ChartData[]> = {
    week: [
      { label: 'Mon', value: 45200, change: 2.1 },
      { label: 'Tue', value: 45850, change: 1.4 },
      { label: 'Wed', value: 46200, change: 0.8 },
      { label: 'Thu', value: 47100, change: 1.9 },
      { label: 'Fri', value: 47250, change: 0.3 },
      { label: 'Sat', value: 47180, change: -0.1 },
      { label: 'Sun', value: 47250, change: 0.1 },
    ],
    month: Array.from({ length: 30 }, (_, i) => ({
      label: (i + 1).toString(),
      value: 45000 + Math.random() * 3000,
      change: (Math.random() - 0.5) * 4,
    })),
    year: [
      { label: 'Jan', value: 40000, change: 5.2 },
      { label: 'Feb', value: 41000, change: 2.5 },
      { label: 'Mar', value: 42500, change: 3.7 },
      { label: 'Apr', value: 43200, change: 1.6 },
      { label: 'May', value: 44800, change: 3.7 },
      { label: 'Jun', value: 45600, change: 1.8 },
      { label: 'Jul', value: 46200, change: 1.3 },
      { label: 'Aug', value: 46800, change: 1.3 },
      { label: 'Sep', value: 47100, change: 0.6 },
      { label: 'Oct', value: 47250, change: 0.3 },
      { label: 'Nov', value: 47180, change: -0.1 },
      { label: 'Dec', value: 47250, change: 0.1 },
    ],
  };

  const currentData = chartData[timeframe];
  const maxValue = Math.max(...currentData.map(d => d.value));
  const latestValue = currentData[currentData.length - 1]?.value || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Performance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your investment growth over time</p>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                timeframe === period
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Value Display */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          €{latestValue.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">+12.5%</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">this {timeframe}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-1 h-64">
          {currentData.map((item, index) => {
            const height = (item.value / maxValue) * 100;
            const isPositive = item.change >= 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                {/* Bar */}
                <div className="relative w-full flex justify-center">
                  <div
                    className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80 ${
                      isPositive 
                        ? 'bg-gradient-to-t from-green-500 to-green-400' 
                        : 'bg-gradient-to-t from-red-500 to-red-400'
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                        €{item.value.toLocaleString()}
                        <div className="text-center">
                          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                            {isPositive ? '+' : ''}{item.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Label */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-12">
          <span>€{Math.round(maxValue / 1000)}k</span>
          <span>€{Math.round(maxValue * 0.75 / 1000)}k</span>
          <span>€{Math.round(maxValue * 0.5 / 1000)}k</span>
          <span>€{Math.round(maxValue * 0.25 / 1000)}k</span>
          <span>€0</span>
        </div>
      </div>

      {/* Investment Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Investment Breakdown</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Residential', amount: '€32,450', percent: 68.6, color: 'bg-orange-500' },
            { name: 'Commercial', amount: '€10,120', percent: 21.4, color: 'bg-blue-500' },
            { name: 'Mixed Use', amount: '€4,680', percent: 10.0, color: 'bg-green-500' }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`}></div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.amount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.percent}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};