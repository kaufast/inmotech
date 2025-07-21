'use client';

import React, { useState, useEffect } from 'react';
import { Target, MapPin, TrendingUp, DollarSign, Star, Eye, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WatchlistButton } from '@/components/ui/WatchlistButton';
import Image from 'next/image';
import Link from 'next/link';

interface RecommendedProject {
  id: string;
  title: string;
  location: string;
  expectedReturn: number;
  minimumInvestment: number;
  currency: string;
  propertyType: string;
  images: string[];
  riskLevel: string;
}

interface RecommendationsData {
  recommendations: RecommendedProject[];
}

export const PersonalizedRecommendations: React.FC = () => {
  const t = useTranslations('dashboard');
  const [recommendations, setRecommendations] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard/analytics', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data: RecommendationsData = await response.json();
          setRecommendations(data.recommendations || []);
        } else {
          throw new Error('Failed to fetch recommendations');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-400 bg-green-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'high':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getMatchReasonText = (project: RecommendedProject, index: number) => {
    const reasons = [
      'Matches your preferred property type',
      'Similar to your previous investments',
      'Within your typical investment range',
      'High potential returns',
      'Growing market location',
      'Recommended for your risk profile'
    ];
    return reasons[index % reasons.length];
  };

  if (loading) {
    return (
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#ED4F01]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
            <p className="text-sm text-gray-400">Personalized investment opportunities</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-800/30 rounded-xl p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#ED4F01]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
            <p className="text-sm text-gray-400">Personalized investment opportunities</p>
          </div>
        </div>
        <div className="text-center text-gray-400 py-8">
          {error}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#ED4F01]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
            <p className="text-sm text-gray-400">Personalized investment opportunities</p>
          </div>
        </div>
        <div className="text-center text-gray-400 py-8">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Make your first investment to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#ED4F01]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#ED4F01]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
            <p className="text-sm text-gray-400">Based on your investment history</p>
          </div>
        </div>
        
        <Link
          href="/projects"
          className="flex items-center space-x-1 text-[#ED4F01] hover:text-[#FF6B35] transition-colors text-sm font-medium"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {recommendations.slice(0, 3).map((project, index) => (
          <div
            key={project.id}
            className="group bg-gray-800/30 hover:bg-gray-800/50 rounded-xl p-4 transition-all duration-300 border border-transparent hover:border-[#ED4F01]/20"
          >
            <div className="flex space-x-4">
              {/* Project Image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {project.images.length > 0 ? (
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                {/* Match indicator */}
                <div className="absolute top-1 right-1">
                  <div className="w-6 h-6 bg-[#ED4F01] rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm truncate group-hover:text-[#ED4F01] transition-colors">
                      {project.title}
                    </h4>
                    <div className="flex items-center text-gray-400 text-xs mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {project.location}
                    </div>
                  </div>
                  
                  <WatchlistButton
                    projectId={project.id}
                    variant="minimal"
                    size="sm"
                    showTooltip={false}
                  />
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="flex items-center text-gray-400 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Return
                    </div>
                    <div className="text-green-400 font-semibold text-sm">
                      {project.expectedReturn}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-400 text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Min Investment
                    </div>
                    <div className="text-white font-semibold text-sm">
                      {formatCurrency(project.minimumInvestment, project.currency)}
                    </div>
                  </div>
                </div>

                {/* Tags and reason */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(project.riskLevel)}`}>
                      {project.riskLevel}
                    </span>
                    <span className="px-2 py-1 bg-blue-400/10 text-blue-400 rounded-full text-xs font-medium">
                      {project.propertyType}
                    </span>
                  </div>
                </div>

                {/* Match reason */}
                <div className="mt-2 text-xs text-gray-500">
                  <span className="text-[#ED4F01]">●</span> {getMatchReasonText(project, index)}
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 mt-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center space-x-1 text-xs bg-[#ED4F01]/10 hover:bg-[#ED4F01]/20 text-[#ED4F01] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </Link>
                  <button className="flex items-center space-x-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                    <DollarSign className="w-3 h-3" />
                    <span>Invest</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <Link
            href="/projects?recommended=true"
            className="w-full block text-center px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-[#ED4F01]/30 text-gray-300 hover:text-white rounded-xl transition-all duration-300"
          >
            View {recommendations.length - 3} More Recommendations
          </Link>
        </div>
      )}
    </div>
  );
};