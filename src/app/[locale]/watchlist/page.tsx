import React from 'react';
import { WatchlistContent } from '@/components/watchlist/WatchlistContent';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations('watchlist');
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function WatchlistPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('watchlist');

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ED4F01]/10 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WatchlistContent />
      </div>
    </div>
  );
}