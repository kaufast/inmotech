'use client';

import React from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { WatchlistButton } from '@/components/ui/WatchlistButton';
import { Heart, MapPin, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

export const WatchlistContent: React.FC = () => {
  const { user } = useAuth();
  const { watchlist, loading, error } = useWatchlist();
  const t = useTranslations('watchlist');

  if (!user) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('loginRequired.title')}
        </h2>
        <p className="text-gray-400 mb-8">
          {t('loginRequired.description')}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ED4F01]/25 transition-all duration-300"
        >
          {t('loginRequired.button')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-900/40 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-700"></div>
            <div className="p-6">
              <div className="h-6 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 mb-4">
          {t('error.title')}
        </div>
        <p className="text-gray-400">
          {error}
        </p>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('empty.title')}
        </h2>
        <p className="text-gray-400 mb-8">
          {t('empty.description')}
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ED4F01]/25 transition-all duration-300"
        >
          {t('empty.button')}
        </Link>
      </div>
    );
  }

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('yourWatchlist')}
          </h2>
          <p className="text-gray-400">
            {t('itemCount', { count: watchlist.length })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {watchlist.map((item) => (
          <div
            key={item.id}
            className="group relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden hover:border-[#ED4F01]/30 transition-all duration-300"
          >
            {/* Project Image */}
            <div className="relative aspect-video overflow-hidden">
              {item.project.images.length > 0 ? (
                <Image
                  src={item.project.images[0]}
                  alt={item.project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <DollarSign className="w-12 h-12 text-gray-500" />
                </div>
              )}

              {/* Watchlist Button */}
              <div className="absolute top-4 right-4">
                <WatchlistButton
                  projectId={item.project.id}
                  variant="default"
                  size="md"
                />
              </div>

              {/* Risk Level Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(item.project.riskLevel)}`}>
                  {item.project.riskLevel} Risk
                </span>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#ED4F01] transition-colors duration-300">
                  {item.project.title}
                </h3>
              </div>

              <div className="flex items-center text-gray-400 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {item.project.location}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Expected Return
                  </div>
                  <div className="text-green-400 font-semibold">
                    {item.project.expectedReturn}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Duration
                  </div>
                  <div className="text-white font-semibold">
                    {item.project.duration} months
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="border-t border-gray-700/50 pt-4">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-400">Minimum Investment</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(item.project.minimumInvestment, item.project.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Added to watchlist</span>
                  <span className="text-gray-300">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Link
                  href={`/projects/${item.project.id}`}
                  className="w-full block text-center px-4 py-2 bg-gradient-to-r from-[#ED4F01] to-[#FF6B35] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ED4F01]/25 transition-all duration-300"
                >
                  {t('viewProject')}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};