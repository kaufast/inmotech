'use client';

import React, { useState } from 'react';
import { MapPin, Clock, TrendingUp, Eye, Filter, ArrowUpRight, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Project {
  id: string;
  name: string;
  location: string;
  progress: number;
  invested: string;
  expectedReturn: string;
  actualReturn?: string;
  status: 'Active' | 'Completed' | 'Funding' | 'On Track' | 'Delayed';
  image: string;
  timeLeft?: string;
  totalFunding: string;
  minInvestment: string;
  projectType: 'Residential' | 'Commercial' | 'Mixed Use';
  riskLevel: 'Low' | 'Medium' | 'High';
}

export const ModernInvestmentProjects: React.FC = () => {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('navigation');
  const [activeTab, setActiveTab] = useState<'my-investments' | 'browse-projects'>('my-investments');
  
  // Helper function to translate status
  const getStatusTranslation = (status: string) => {
    // Convert "On Track" to "onTrack", "Active" to "active", etc.
    const statusKey = status.split(' ').map((word, index) => 
      index === 0 ? word.toLowerCase() : word
    ).join('');
    return t(`projects.${statusKey}`);
  };
  
  // Helper function to translate project type
  const getProjectTypeTranslation = (type: string) => {
    // Convert "Mixed Use" to "mixedUse", etc.
    const typeKey = type.split(' ').map((word, index) => 
      index === 0 ? word.toLowerCase() : word
    ).join('');
    return t(`categories.${typeKey}`);
  };

  const myInvestments: Project[] = [
    {
      id: '1',
      name: 'Madrid Luxury Residences',
      location: 'Salamanca, Madrid',
      progress: 78,
      invested: '€15,240',
      expectedReturn: '9.2%',
      actualReturn: '9.5%',
      status: 'On Track',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      totalFunding: '€2.4M',
      minInvestment: '€500',
      projectType: 'Residential',
      riskLevel: 'Medium'
    },
    {
      id: '2',
      name: 'Barcelona Tech Hub',
      location: '22@, Barcelona',
      progress: 45,
      invested: '€12,100',
      expectedReturn: '8.5%',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
      totalFunding: '€3.2M',
      minInvestment: '€1000',
      projectType: 'Commercial',
      riskLevel: 'Low'
    }
  ];

  const availableProjects: Project[] = [
    {
      id: '3',
      name: 'Lisbon Modern Apartments',
      location: 'Príncipe Real, Lisbon',
      progress: 15,
      invested: '€0',
      expectedReturn: '10.2%',
      status: 'Funding',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
      timeLeft: '23 days',
      totalFunding: '€2.8M',
      minInvestment: '€500',
      projectType: 'Residential',
      riskLevel: 'Medium'
    }
  ];

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      'Active': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Funding': 'bg-[#ED4F01]/20 text-[#ED4F01] border-[#ED4F01]/30',
      'On Track': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Delayed': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status];
  };

  const ProjectCard: React.FC<{ project: Project; showInvestButton?: boolean }> = ({ 
    project, 
    showInvestButton = false 
  }) => (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden hover:border-[#ED4F01]/30 transition-all duration-300">
        {/* Project Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={project.image} 
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(project.status)}`}>
              {getStatusTranslation(project.status)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs border border-white/10">
              {getProjectTypeTranslation(project.projectType)}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-semibold text-white text-lg mb-1">{project.name}</h3>
            <div className="flex items-center text-sm text-gray-300">
              <MapPin className="w-4 h-4 mr-1" />
              {project.location}
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">
                {activeTab === 'my-investments' ? t('projects.progress') : t('projects.funded')}
              </span>
              <span className="font-medium text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] h-2 rounded-full transition-all duration-1000"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            {project.timeLeft && (
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <Clock className="w-4 h-4 mr-1" />
                {project.timeLeft} left
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/30 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">
                {activeTab === 'my-investments' ? t('projects.invested') : t('projects.minInvestment')}
              </div>
              <div className="font-semibold text-white">
                {activeTab === 'my-investments' ? project.invested : project.minInvestment}
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">{t('projects.expectedReturn')}</div>
              <div className="font-semibold text-[#ED4F01]">
                {project.expectedReturn}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button className="flex-1 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors text-sm font-medium flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{t('projects.details')}</span>
            </button>
            {showInvestButton && (
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] hover:shadow-lg hover:shadow-[#ED4F01]/25 text-white rounded-lg transition-all duration-300 text-sm font-medium">
                {t('projects.investNow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ED4F01]/10 to-[#FF6B35]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 hover:border-[#ED4F01]/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {t('projects.investmentProjects')}
          </h3>
          
          {/* Tab Selector */}
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveTab('my-investments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'my-investments'
                  ? 'bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tNav('myInvestments')}
            </button>
            <button
              onClick={() => setActiveTab('browse-projects')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'browse-projects'
                  ? 'bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tNav('browseProjects')}
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(activeTab === 'my-investments' ? myInvestments : availableProjects).map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              showInvestButton={activeTab === 'browse-projects'}
            />
          ))}
        </div>

        {/* Show More Button */}
        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-colors font-medium flex items-center space-x-2 mx-auto">
            <span>{activeTab === 'my-investments' ? t('projects.viewAllInvestments') : t('projects.viewAllProjects')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};