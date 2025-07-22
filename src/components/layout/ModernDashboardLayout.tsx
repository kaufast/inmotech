'use client';

import React, { useState } from 'react';
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  User,
  Menu,
  X,
  Activity,
  Target,
  PieChart,
  CreditCard,
  LogOut,
  Calendar,
  MessageCircle,
  Heart
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { UserRoleBadge, useRoleBasedNavigation } from '@/components/auth/RoleBasedUI';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
}

export const ModernDashboardLayout: React.FC<ModernDashboardLayoutProps> = ({ children }) => {
  const t = useTranslations('navigation');
  const tDash = useTranslations('dashboard');
  const { user, logout, hasPermission, hasRole } = useSecureAuth();
  const [activeView, setActiveView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const roleBasedNav = useRoleBasedNavigation();

  const sidebarItems = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'activities', icon: Activity, label: t('activities') },
    { id: 'health', icon: BarChart3, label: t('healthStatus') },
    { id: 'planning', icon: Calendar, label: t('trainingPlanning') },
  ];

  const secondaryItems = [
    { id: 'investments', icon: TrendingUp, label: t('myInvestments'), show: hasPermission('investments:read') },
    { id: 'projects', icon: Target, label: t('browseProjects'), show: hasPermission('projects:read') },
    { id: 'create-project', icon: Target, label: 'Create Project', show: hasPermission('projects:create') },
    { id: 'watchlist', icon: Heart, label: t('watchlist'), show: hasPermission('portfolio:read') },
    { id: 'portfolio', icon: PieChart, label: t('portfolioAnalysis'), show: hasPermission('portfolio:read') },
    { id: 'analytics', icon: Activity, label: t('analytics'), show: hasPermission('analytics:read') },
    { id: 'advanced-analytics', icon: BarChart3, label: 'Advanced Analytics', show: hasPermission('analytics:advanced') },
    { id: 'payments', icon: CreditCard, label: t('payments'), show: hasPermission('investments:read') },
    { id: 'user-management', icon: User, label: 'User Management', show: hasPermission('users:manage') },
    { id: 'settings', icon: Settings, label: t('settings'), show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#ED4F01]/10 to-[#FF6B35]/10 rounded-full blur-3xl"></div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-20 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 z-50 transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-20'
      } lg:w-20 lg:hover:w-64 group`}>
        
        {/* Logo */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="w-8 h-8 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => {
                    setActiveView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                    activeView === item.id || item.id === 'home'
                      ? 'bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white shadow-lg shadow-[#ED4F01]/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="my-6 border-t border-gray-800/50"></div>

          {/* Secondary Navigation */}
          <div className="space-y-2">
            {secondaryItems.slice(0, 4).map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => {
                    setActiveView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300">
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-opacity ${
                isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
              }`}>{t('settings')}</span>
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-opacity ${
                isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
              }`}>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-20 relative z-10">
        {/* Top Navigation */}
        <header className="bg-gray-900/40 backdrop-blur-xl border-b border-gray-800/50">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Top Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-full p-1">
              {[
                { id: 'home', label: t('home'), icon: Home },
                { id: 'activities', label: t('activities'), icon: Activity },
                { id: 'health', label: t('healthStatus'), icon: BarChart3 },
                { id: 'planning', label: t('trainingPlanning'), icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-sm ${
                      activeView === tab.id || tab.id === 'home'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium hidden lg:block">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <Search className="w-5 h-5" />
                <span className="hidden sm:block text-sm">{tDash('search.searchLabel')}</span>
              </button>

              {/* Calendar */}
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:block text-sm">{tDash('search.calendar')}</span>
              </button>

              {/* ChatBot AI */}
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <div className="w-5 h-5 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] rounded-full flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <span className="hidden sm:block text-sm">{tDash('search.chatbot')}</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ED4F01] rounded-full animate-pulse"></div>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <UserRoleBadge />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};