'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, Target, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InvestmentScenario {
  investment: number;
  duration: number;
  expectedReturn: number;
  compounding: 'none' | 'monthly' | 'quarterly' | 'annually';
}

interface CalculationResult {
  totalReturn: number;
  netProfit: number;
  annualizedReturn: number;
  monthlyIncome: number;
  roi: number;
}

export const InvestmentCalculator: React.FC = () => {
  const t = useTranslations('dashboard');
  const [scenario, setScenario] = useState<InvestmentScenario>({
    investment: 10000,
    duration: 24,
    expectedReturn: 10,
    compounding: 'annually'
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateInvestment = (scenario: InvestmentScenario): CalculationResult => {
    const { investment, duration, expectedReturn, compounding } = scenario;
    const monthsInvested = duration;
    const yearsInvested = monthsInvested / 12;
    const annualRate = expectedReturn / 100;

    let totalReturn = investment;
    
    switch (compounding) {
      case 'monthly':
        const monthlyRate = annualRate / 12;
        totalReturn = investment * Math.pow(1 + monthlyRate, monthsInvested);
        break;
      case 'quarterly':
        const quarterlyRate = annualRate / 4;
        const quarters = monthsInvested / 3;
        totalReturn = investment * Math.pow(1 + quarterlyRate, quarters);
        break;
      case 'annually':
        totalReturn = investment * Math.pow(1 + annualRate, yearsInvested);
        break;
      case 'none':
      default:
        totalReturn = investment * (1 + (annualRate * yearsInvested));
        break;
    }

    const netProfit = totalReturn - investment;
    const annualizedReturn = compounding === 'none' 
      ? expectedReturn 
      : (Math.pow(totalReturn / investment, 1 / yearsInvested) - 1) * 100;
    const monthlyIncome = netProfit / monthsInvested;
    const roi = (netProfit / investment) * 100;

    return {
      totalReturn: Math.round(totalReturn * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      roi: Math.round(roi * 100) / 100
    };
  };

  useEffect(() => {
    const calculatedResult = calculateInvestment(scenario);
    setResult(calculatedResult);
  }, [scenario]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#ED4F01]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Investment Calculator</h3>
          <p className="text-sm text-gray-400">Calculate your potential returns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={scenario.investment}
                onChange={(e) => setScenario({ ...scenario, investment: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#ED4F01]/50 focus:ring-1 focus:ring-[#ED4F01]/25"
                min="100"
                step="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Duration (months)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={scenario.duration}
                onChange={(e) => setScenario({ ...scenario, duration: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#ED4F01]/50 focus:ring-1 focus:ring-[#ED4F01]/25"
                min="1"
                max="120"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expected Annual Return (%)
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={scenario.expectedReturn}
                onChange={(e) => setScenario({ ...scenario, expectedReturn: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#ED4F01]/50 focus:ring-1 focus:ring-[#ED4F01]/25"
                min="0"
                max="50"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compounding Frequency
            </label>
            <select
              value={scenario.compounding}
              onChange={(e) => setScenario({ ...scenario, compounding: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-[#ED4F01]/50 focus:ring-1 focus:ring-[#ED4F01]/25"
            >
              <option value="none">No Compounding</option>
              <option value="annually">Annually</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Projected Results</h4>
          
          {result && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#ED4F01]/10 to-[#FF6B35]/10 border border-[#ED4F01]/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total Return</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(result.totalReturn)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Net Profit</span>
                  </div>
                  <div className="text-lg font-semibold text-green-400">
                    {formatCurrency(result.netProfit)}
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">ROI</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-400">
                    {formatPercentage(result.roi)}
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Annualized Return</span>
                  </div>
                  <div className="text-lg font-semibold text-purple-400">
                    {formatPercentage(result.annualizedReturn)}
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Monthly Income</span>
                  </div>
                  <div className="text-lg font-semibold text-orange-400">
                    {formatCurrency(result.monthlyIncome)}
                  </div>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h5 className="text-sm font-medium text-gray-300 mb-3">Investment Breakdown</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Initial Investment</span>
                    <span className="text-white">{formatCurrency(scenario.investment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">{scenario.duration} months ({(scenario.duration / 12).toFixed(1)} years)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expected Return</span>
                    <span className="text-white">{formatPercentage(scenario.expectedReturn)} annually</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Compounding</span>
                    <span className="text-white capitalize">{scenario.compounding === 'none' ? 'Simple Interest' : scenario.compounding}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Scenario Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <h5 className="text-sm font-medium text-gray-300 mb-3">Quick Scenarios</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Conservative', investment: 5000, duration: 36, return: 6, compounding: 'annually' as const },
            { label: 'Moderate', investment: 10000, duration: 24, return: 10, compounding: 'annually' as const },
            { label: 'Aggressive', investment: 25000, duration: 18, return: 15, compounding: 'quarterly' as const },
            { label: 'High Growth', investment: 50000, duration: 12, return: 20, compounding: 'monthly' as const },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setScenario({
                investment: preset.investment,
                duration: preset.duration,
                expectedReturn: preset.return,
                compounding: preset.compounding
              })}
              className="px-3 py-2 text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-[#ED4F01]/30 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};