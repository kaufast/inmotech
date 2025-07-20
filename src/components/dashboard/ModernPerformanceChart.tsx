'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChartData {
  label: string;
  value: number;
  change: number;
}

export const ModernPerformanceChart: React.FC = () => {
  const t = useTranslations('dashboard');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');

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
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/10 to-[#FF6B35]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#ED4F01]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('portfolio.performance')}</h3>
              <p className="text-sm text-gray-400">{t('portfolio.trackGrowth')}</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    timeframe === period
                      ? 'bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {t(`timeframes.${period}`)}
                </button>
              ))}
            </div>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Portfolio Value Display */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            €{latestValue.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-lg text-green-400 font-semibold">+12.5%</span>
            <span className="text-gray-400">{t(`timeframes.this${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`)}</span>
          </div>
        </div>

        {/* Performance Comparison Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white mb-4">Comparación de Rendimiento</h4>
          <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 500 180">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={20 + i * 25}
                  x2="450"
                  y2={20 + i * 25}
                  stroke="rgb(75, 85, 99)"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}
              
              {/* Portfolio Performance Line (Realistic with ups and downs) */}
              <path
                d="M 50 140 L 100 125 L 150 130 L 200 110 L 250 120 L 300 105 L 350 100 L 400 85 L 450 75"
                fill="none"
                stroke="url(#gradientOrange1)"
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              
              {/* Market Benchmark Line (More volatile with realistic fluctuations) */}
              <path
                d="M 50 150 L 100 140 L 150 145 L 200 130 L 250 140 L 300 125 L 350 130 L 400 115 L 450 105"
                fill="none"
                stroke="url(#gradientBlue1)"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.8"
              />
              
              {/* Data points for Portfolio with realistic values */}
              {[
                { x: 50, y: 140, value: '-1.2%' }, 
                { x: 100, y: 125, value: '+2.8%' }, 
                { x: 150, y: 130, value: '+1.5%' }, 
                { x: 200, y: 110, value: '+5.2%' }, 
                { x: 250, y: 120, value: '+3.1%' }, 
                { x: 300, y: 105, value: '+6.8%' }, 
                { x: 350, y: 100, value: '+7.5%' }, 
                { x: 400, y: 85, value: '+9.2%' }, 
                { x: 450, y: 75, value: '+12.5%' }
              ].map((point, i) => (
                <g key={`portfolio-${i}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#ED4F01"
                    className="drop-shadow-sm hover:r-5 transition-all cursor-pointer"
                  />
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="text-xs fill-white opacity-0 hover:opacity-100 transition-opacity"
                    style={{ fontSize: '9px' }}
                  >
                    {point.value}
                  </text>
                </g>
              ))}
              
              {/* Data points for Benchmark with realistic values */}
              {[
                { x: 50, y: 150, value: '-2.1%' }, 
                { x: 100, y: 140, value: '+1.2%' }, 
                { x: 150, y: 145, value: '-0.5%' }, 
                { x: 200, y: 130, value: '+3.1%' }, 
                { x: 250, y: 140, value: '+1.8%' }, 
                { x: 300, y: 125, value: '+4.2%' }, 
                { x: 350, y: 130, value: '+3.8%' }, 
                { x: 400, y: 115, value: '+6.5%' }, 
                { x: 450, y: 105, value: '+8.2%' }
              ].map((point, i) => (
                <g key={`benchmark-${i}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="2.5"
                    fill="#3B82F6"
                    opacity="0.8"
                    className="hover:r-4 transition-all cursor-pointer"
                  />
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    className="text-xs fill-blue-300 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ fontSize: '8px' }}
                  >
                    {point.value}
                  </text>
                </g>
              ))}
              
              {/* Gradients */}
              <defs>
                <linearGradient id="gradientOrange1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ED4F01" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </linearGradient>
                <linearGradient id="gradientBlue1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 text-xs text-gray-500">
              <span>Ene</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Ago</span>
              <span>Sep</span>
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-xs text-gray-500 pl-1">
              <span>+15%</span>
              <span>+10%</span>
              <span>+5%</span>
              <span>0%</span>
              <span>-5%</span>
              <span>-15%</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] rounded-full"></div>
              <span className="text-xs text-gray-400">Tu Portafolio (+12.5%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
              <span className="text-xs text-gray-400">Índice de Mercado (+8.2%)</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative mb-6">
          <div className="flex items-end justify-between space-x-2 h-64">
            {currentData.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              const isPositive = item.change >= 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group/bar">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 mb-2">
                    <div className="bg-gray-800/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-gray-700/50">
                      <div className="font-semibold">€{item.value.toLocaleString()}</div>
                      <div className={`text-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{item.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="relative w-full flex justify-center">
                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-all duration-500 ease-out group-hover/bar:scale-105 ${
                        isPositive 
                          ? 'bg-gradient-to-t from-[#ED4F01] to-[#FF6B35]' 
                          : 'bg-gradient-to-t from-red-500 to-red-400'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  
                  {/* Label */}
                  <div className="text-xs text-gray-500 mt-3 text-center">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Breakdown */}
        <div className="pt-6 border-t border-gray-800/50">
          <h4 className="text-sm font-medium text-white mb-4">{t('categories.investmentBreakdown')}</h4>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: t('categories.residential'), amount: '€32,450', percent: 68.6, color: 'from-[#ED4F01] to-[#FF6B35]' },
              { name: t('categories.commercial'), amount: '€10,120', percent: 21.4, color: 'from-blue-500 to-blue-400' },
              { name: t('categories.mixedUse'), amount: '€4,680', percent: 10.0, color: 'from-green-500 to-green-400' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-4 h-4 bg-gradient-to-r ${item.color} rounded-full mx-auto mb-3`}></div>
                <div className="text-sm font-medium text-white mb-1">{item.name}</div>
                <div className="text-sm text-gray-400 mb-1">{item.amount}</div>
                <div className="text-xs text-gray-500">{item.percent}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};