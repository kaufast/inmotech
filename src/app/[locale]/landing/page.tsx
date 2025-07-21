'use client';

import React from 'react';
import { 
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en-GB';
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-88 h-88 bg-green-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Logo Only */}
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold text-white">inmotech</span>
          </div>
        </div>

        {/* Language Switcher - Top Right */}
        <div className="fixed top-8 right-8 z-50">
          <LanguageSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative px-6 pt-32 pb-32 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center space-y-12">
              {/* Large Typography Main Heading */}
              <div className="space-y-8">
                <h1 className="text-7xl lg:text-9xl font-bold leading-[0.9] tracking-tight">
                  <span className="block text-white">{t('landing.hero.titleLine1')}</span>
                  <span className="block text-white">{t('landing.hero.titleLine2')} </span>
                  <span className="block">
                    <span className="text-white">{locale === 'es-MX' ? 'y ' : 'and '}</span>
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(108deg, rgb(8, 148, 255), rgb(201, 89, 221) 34%, rgb(255, 46, 84) 68%, rgb(255, 144, 4))'}}>{t('landing.hero.titleLine3')}</span>
                  </span>
                </h1>
                
                <div className="max-w-2xl mx-auto">
                  <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                    {t('landing.hero.newDescription')}
                  </p>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="pt-8">
                <style jsx>{`
                  @property --angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                  }
                  
                  .conic-border-button {
                    position: relative;
                    transition: transform 0.2s ease-in-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  
                  .conic-border-button:active {
                    transform: scale(0.95);
                  }
                  
                  .conic-border-button::before,
                  .conic-border-button::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
                    border-radius: inherit;
                    z-index: -1;
                    animation: 3s spin linear infinite;
                  }
                  
                  .conic-border-button::before {
                    filter: blur(3px);
                    opacity: 0.7;
                  }
                  
                  .conic-border-button::after {
                    inset: 0;
                    background: #000;
                    z-index: -1;
                  }
                  
                  @keyframes spin {
                    from {
                      --angle: 0deg;
                    }
                    to {
                      --angle: 360deg;
                    }
                  }
                `}</style>
                <div className="relative inline-block">
                  <button className="conic-border-button bg-black text-white px-12 py-5 rounded-3xl font-semibold text-xl shadow-2xl hover:bg-gray-900 flex items-center space-x-2 relative z-10">
                    <span>{t('landing.hero.ctaButton')}</span>
                    <span className="text-xl">⌖</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom curved gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-blue-900/20 to-transparent pointer-events-none"></div>
        </section>

        {/* Trust Section */}
        <section className="relative px-6 py-32">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            {/* Trust Header */}
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">{t('landing.trust.title')}</span>
              </h2>
              <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('landing.trust.description')}
              </p>
            </div>

            {/* Trust Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="flex items-start space-x-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-white text-lg">🔒</span>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    {t('landing.trust.features.immutable')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-white text-lg">✓</span>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    {t('landing.trust.features.verified')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-white text-lg">⚖️</span>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    {t('landing.trust.features.compliant')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-white text-lg">🛡️</span>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    {t('landing.trust.features.private')}
                  </p>
                </div>
              </div>
            </div>

            {/* Guarantee Text */}
            <div className="pt-8">
              <p className="text-xl lg:text-2xl text-white font-semibold">
                {t('landing.trust.guarantee')}
              </p>
            </div>

            {/* Final CTA */}
            <div className="pt-12 space-y-8">
              <h3 className="text-3xl lg:text-4xl font-bold text-white">
                {t('landing.trust.cta.title')}
              </h3>
              
              <div className="relative inline-block">
                <style jsx>{`
                  @property --angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                  }
                  
                  .conic-border-button {
                    position: relative;
                    transition: transform 0.2s ease-in-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  
                  .conic-border-button:active {
                    transform: scale(0.95);
                  }
                  
                  .conic-border-button::before,
                  .conic-border-button::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
                    border-radius: inherit;
                    z-index: -1;
                    animation: 3s spin linear infinite;
                  }
                  
                  .conic-border-button::before {
                    filter: blur(3px);
                    opacity: 0.7;
                  }
                  
                  .conic-border-button::after {
                    inset: 0;
                    background: #000;
                    z-index: -1;
                  }
                  
                  @keyframes spin {
                    from {
                      --angle: 0deg;
                    }
                    to {
                      --angle: 360deg;
                    }
                  }
                `}</style>
                <button className="conic-border-button bg-black text-white px-12 py-5 rounded-3xl font-semibold text-xl shadow-2xl hover:bg-gray-900 flex items-center space-x-2 relative z-10">
                  <span>{t('landing.trust.cta.button')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Property Showcase Section */}
        <section className="relative px-6 py-32 bg-gradient-to-b from-black via-gray-900/50 to-black">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center space-y-6 mb-20">
              <h2 className="text-4xl lg:text-6xl font-bold text-white">
                {t('landing.properties.title')}
              </h2>
              <p className="text-xl lg:text-2xl text-gray-300 max-w-2xl mx-auto">
                {t('landing.properties.subtitle')}
              </p>
            </div>

            {/* Property Cards Grid */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              
              {/* Madrid Property */}
              <div className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer">
                {/* Property Image */}
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop&crop=center&auto=format&q=80" 
                    alt="Luxury Penthouse Madrid"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-green-500/20 backdrop-blur-sm text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        {t('landing.properties.cards.madrid.funded')} funded
                      </span>
                      <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        {t('landing.properties.cards.madrid.investors')} investors
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('landing.properties.cards.madrid.title')}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t('landing.properties.cards.madrid.location')}
                    </p>
                  </div>
                  
                  <p className="text-gray-300 text-sm">
                    {t('landing.properties.cards.madrid.description')}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {t('landing.properties.cards.madrid.price')}
                      </p>
                      <p className="text-orange-400 text-sm">
                        Min: {t('landing.properties.cards.madrid.minInvestment')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {t('landing.properties.cards.madrid.expectedReturn')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('landing.properties.cards.madrid.timeframe')}
                      </p>
                    </div>
                  </div>
                  
                  <Link href={`/${locale}/property/madrid-luxury-penthouse`}>
                    <div className="relative">
                      <style jsx>{`
                        @property --angle {
                          syntax: "<angle>";
                          initial-value: 0deg;
                          inherits: false;
                        }
                        
                        .conic-border-button {
                          position: relative;
                          transition: transform 0.2s ease-in-out;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        
                        .conic-border-button:active {
                          transform: scale(0.95);
                        }
                        
                        .conic-border-button::before,
                        .conic-border-button::after {
                          content: '';
                          position: absolute;
                          inset: -2px;
                          background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
                          border-radius: inherit;
                          z-index: -1;
                          animation: 3s spin linear infinite;
                        }
                        
                        .conic-border-button::before {
                          filter: blur(3px);
                          opacity: 0.7;
                        }
                        
                        .conic-border-button::after {
                          inset: 0;
                          background: #000;
                          z-index: -1;
                        }
                        
                        @keyframes spin {
                          from {
                            --angle: 0deg;
                          }
                          to {
                            --angle: 360deg;
                          }
                        }
                      `}</style>
                      <button className="conic-border-button w-full bg-black text-white py-3 px-6 rounded-3xl font-semibold text-xl shadow-2xl hover:bg-gray-900 relative z-10">
                        View Property
                      </button>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Barcelona Property */}
              <div className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer">
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop&crop=center&auto=format&q=80" 
                    alt="Smart Apartment Barcelona"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-yellow-500/20 backdrop-blur-sm text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                        {t('landing.properties.cards.barcelona.funded')} funded
                      </span>
                      <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        {t('landing.properties.cards.barcelona.investors')} investors
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('landing.properties.cards.barcelona.title')}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t('landing.properties.cards.barcelona.location')}
                    </p>
                  </div>
                  
                  <p className="text-gray-300 text-sm">
                    {t('landing.properties.cards.barcelona.description')}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {t('landing.properties.cards.barcelona.price')}
                      </p>
                      <p className="text-orange-400 text-sm">
                        Min: {t('landing.properties.cards.barcelona.minInvestment')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {t('landing.properties.cards.barcelona.expectedReturn')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('landing.properties.cards.barcelona.timeframe')}
                      </p>
                    </div>
                  </div>
                  
                  <Link href={`/${locale}/property/barcelona-smart-apartment`}>
                    <div className="relative">
                      <style jsx>{`
                        @property --angle {
                          syntax: "<angle>";
                          initial-value: 0deg;
                          inherits: false;
                        }
                        
                        .conic-border-button {
                          position: relative;
                          transition: transform 0.2s ease-in-out;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        
                        .conic-border-button:active {
                          transform: scale(0.95);
                        }
                        
                        .conic-border-button::before,
                        .conic-border-button::after {
                          content: '';
                          position: absolute;
                          inset: -2px;
                          background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
                          border-radius: inherit;
                          z-index: -1;
                          animation: 3s spin linear infinite;
                        }
                        
                        .conic-border-button::before {
                          filter: blur(3px);
                          opacity: 0.7;
                        }
                        
                        .conic-border-button::after {
                          inset: 0;
                          background: #000;
                          z-index: -1;
                        }
                        
                        @keyframes spin {
                          from {
                            --angle: 0deg;
                          }
                          to {
                            --angle: 360deg;
                          }
                        }
                      `}</style>
                      <button className="conic-border-button w-full bg-black text-white py-3 px-6 rounded-3xl font-semibold text-xl shadow-2xl hover:bg-gray-900 relative z-10">
                        View Property
                      </button>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Valencia Property */}
              <div className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer">
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=300&fit=crop&crop=center&auto=format&q=80" 
                    alt="Beachfront Condo Valencia"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-500/20 backdrop-blur-sm text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                        {t('landing.properties.cards.valencia.funded')} funded
                      </span>
                      <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        {t('landing.properties.cards.valencia.investors')} investors
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('landing.properties.cards.valencia.title')}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t('landing.properties.cards.valencia.location')}
                    </p>
                  </div>
                  
                  <p className="text-gray-300 text-sm">
                    {t('landing.properties.cards.valencia.description')}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {t('landing.properties.cards.valencia.price')}
                      </p>
                      <p className="text-orange-400 text-sm">
                        Min: {t('landing.properties.cards.valencia.minInvestment')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {t('landing.properties.cards.valencia.expectedReturn')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('landing.properties.cards.valencia.timeframe')}
                      </p>
                    </div>
                  </div>
                  
                  <Link href={`/${locale}/property/valencia-beachfront-condo`}>
                    <div className="relative">
                      <style jsx>{`
                        @property --angle {
                          syntax: "<angle>";
                          initial-value: 0deg;
                          inherits: false;
                        }
                        
                        .conic-border-button {
                          position: relative;
                          transition: transform 0.2s ease-in-out;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        
                        .conic-border-button:active {
                          transform: scale(0.95);
                        }
                        
                        .conic-border-button::before,
                        .conic-border-button::after {
                          content: '';
                          position: absolute;
                          inset: -2px;
                          background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
                          border-radius: inherit;
                          z-index: -1;
                          animation: 3s spin linear infinite;
                        }
                        
                        .conic-border-button::before {
                          filter: blur(3px);
                          opacity: 0.7;
                        }
                        
                        .conic-border-button::after {
                          inset: 0;
                          background: #000;
                          z-index: -1;
                        }
                        
                        @keyframes spin {
                          from {
                            --angle: 0deg;
                          }
                          to {
                            --angle: 360deg;
                          }
                        }
                      `}</style>
                      <button className="conic-border-button w-full bg-black text-white py-3 px-6 rounded-3xl font-semibold text-xl shadow-2xl hover:bg-gray-900 relative z-10">
                        View Property
                      </button>
                    </div>
                  </Link>
                </div>
              </div>
              
            </div>

            {/* View All Properties CTA */}
            <div className="text-center">
              <button className="bg-white/5 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                {t('landing.properties.viewAll')} →
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Navigation with AI Siri Colors */}
        <section className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center px-8 py-4">
              <div className="flex items-center space-x-3 mr-8">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{backgroundImage: 'linear-gradient(108deg, rgb(8, 148, 255), rgb(201, 89, 221) 34%, rgb(255, 46, 84) 68%, rgb(255, 144, 4))'}}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium text-sm">{t('landing.share')}</span>
              </div>
              
              <div className="flex items-center space-x-8 mr-8">
                <a href="#about" className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-sm">{t('navigation.about')}</a>
                <a href="#whitepaper" className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-sm">{t('navigation.whitepaper')}</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Link href={`/${locale}/register`}>
                    <button className="conic-border-button bg-black text-white px-6 py-2.5 rounded-2xl font-semibold text-sm hover:bg-gray-900 relative z-10">
                      {t('navigation.register')}
                    </button>
                  </Link>
                </div>
                <Link href={`/${locale}/login`}>
                  <button className="bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 hover:bg-gray-100">
                    {t('navigation.login')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}