'use client';

import React, { useState } from 'react';
import { MapPin, Clock, TrendingUp, Eye, Filter, ArrowUpRight } from 'lucide-react';

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

export const InvestmentProjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-investments' | 'browse-projects'>('my-investments');
  const [filterType, setFilterType] = useState<'all' | 'Residential' | 'Commercial' | 'Mixed Use'>('all');
  const [sortBy, setSortBy] = useState<'return' | 'progress' | 'time'>('return');

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
    },
    {
      id: '3',
      name: 'Valencia Beach Resort',
      location: 'Malvarosa, Valencia',
      progress: 92,
      invested: '€8,750',
      expectedReturn: '11.1%',
      actualReturn: '11.8%',
      status: 'Completed',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=250&fit=crop',
      totalFunding: '€1.8M',
      minInvestment: '€250',
      projectType: 'Mixed Use',
      riskLevel: 'High'
    }
  ];

  const availableProjects: Project[] = [
    {
      id: '4',
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
    },
    {
      id: '5',
      name: 'Berlin Office Complex',
      location: 'Mitte, Berlin',
      progress: 8,
      invested: '€0',
      expectedReturn: '7.8%',
      status: 'Funding',
      image: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400&h=250&fit=crop',
      timeLeft: '15 days',
      totalFunding: '€5.1M',
      minInvestment: '€1000',
      projectType: 'Commercial',
      riskLevel: 'Low'
    }
  ];

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      'Active': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Funding': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'On Track': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Delayed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status];
  };

  const getRiskColor = (risk: Project['riskLevel']) => {
    const colors = {
      'Low': 'text-green-600 dark:text-green-400',
      'Medium': 'text-yellow-600 dark:text-yellow-400',
      'High': 'text-red-600 dark:text-red-400',
    };
    return colors[risk];
  };

  const ProjectCard: React.FC<{ project: Project; showInvestButton?: boolean }> = ({ 
    project, 
    showInvestButton = false 
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Project Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={project.image} 
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-xs">
            {project.projectType}
          </span>
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-1" />
            {project.location}
          </div>
        </div>

        {/* Progress Bar (for my investments) */}
        {activeTab === 'my-investments' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Funding Progress (for browse projects) */}
        {activeTab === 'browse-projects' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Funded</span>
              <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            {project.timeLeft && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Clock className="w-4 h-4 mr-1" />
                {project.timeLeft} left
              </div>
            )}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'my-investments' ? 'Invested' : 'Min Investment'}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {activeTab === 'my-investments' ? project.invested : project.minInvestment}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Expected Return</div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {project.expectedReturn}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-400">
              Risk: <span className={getRiskColor(project.riskLevel)}>{project.riskLevel}</span>
            </span>
          </div>
          {project.actualReturn && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              {project.actualReturn}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
            <Eye className="w-4 h-4 inline mr-2" />
            View Details
          </button>
          {showInvestButton && (
            <button className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium">
              Invest Now
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const filteredProjects = (activeTab === 'my-investments' ? myInvestments : availableProjects)
    .filter(project => filterType === 'all' || project.projectType === filterType);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Investment Projects
        </h3>
        
        {/* Tab Selector */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('my-investments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-investments'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            My Investments
          </button>
          <button
            onClick={() => setActiveTab('browse-projects')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'browse-projects'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Browse Projects
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Mixed Use">Mixed Use</option>
          </select>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white"
        >
          <option value="return">Sort by Return</option>
          <option value="progress">Sort by Progress</option>
          <option value="time">Sort by Time</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            showInvestButton={activeTab === 'browse-projects'}
          />
        ))}
      </div>

      {/* Show More Button */}
      <div className="mt-6 text-center">
        <button className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
          {activeTab === 'my-investments' ? 'View All Investments' : 'View All Projects'}
          <ArrowUpRight className="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  );
};