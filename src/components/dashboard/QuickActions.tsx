'use client';

import React from 'react';
import { 
  Plus, 
  BarChart3, 
  Euro, 
  Download, 
  Settings, 
  ChevronRight,
  Target,
  CreditCard,
  FileText
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void;
}

export const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: 'invest',
      title: 'New Investment',
      description: 'Browse available projects',
      icon: Plus,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      action: () => console.log('Navigate to new investment')
    },
    {
      id: 'reports',
      title: 'View Reports',
      description: 'Download investment reports',
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      action: () => console.log('Navigate to reports')
    },
    {
      id: 'withdraw',
      title: 'Withdraw Funds',
      description: 'Transfer to bank account',
      icon: Euro,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      action: () => console.log('Navigate to withdrawal')
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'View contracts & statements',
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      action: () => console.log('Navigate to documents')
    },
    {
      id: 'goals',
      title: 'Set Goals',
      description: 'Define investment targets',
      icon: Target,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      action: () => console.log('Navigate to goals')
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      description: 'Manage payment options',
      icon: CreditCard,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
      action: () => console.log('Navigate to payment methods')
    }
  ];

  const quickLinks = [
    { label: 'Investment Calculator', href: '/calculator' },
    { label: 'Risk Assessment', href: '/risk-assessment' },
    { label: 'Tax Documents', href: '/tax-docs' },
    { label: 'Support Center', href: '/support' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
        <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
          View All
        </button>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </div>
            <div className="space-y-1">
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {action.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Links</h4>
        <div className="space-y-2">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Featured Action */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">Portfolio Rebalancing</div>
            <div className="text-sm opacity-90">Optimize your investments</div>
          </div>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Rebalance
          </button>
        </div>
      </div>
    </div>
  );
};