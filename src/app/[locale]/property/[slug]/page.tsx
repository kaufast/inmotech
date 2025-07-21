'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Euro, 
  TrendingUp, 
  Calendar, 
  Users, 
  Shield, 
  Home,
  Wifi,
  Car,
  Building2,
  Camera,
  Share2
} from 'lucide-react';

// Property data mapping
const propertyData = {
  'madrid-luxury-penthouse': {
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    ],
    amenities: ['Rooftop Terrace', 'Smart Home', 'Garage', 'Concierge', 'Gym', 'Pool']
  },
  'barcelona-smart-apartment': {
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    ],
    amenities: ['Smart Automation', 'Balcony', 'Modernist Building', 'Metro Access', 'Tourist Area', 'Gaudí Sites']
  },
  'valencia-beachfront-condo': {
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    ],
    amenities: ['Beach Access', 'Sea Views', 'New Development', 'Tech Hub', 'Swimming Pool', 'Parking']
  }
};

interface PropertyPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en-GB';
  const { slug } = params;
  
  const [selectedImage, setSelectedImage] = React.useState(0);
  const property = propertyData[slug as keyof typeof propertyData];
  
  if (!property) {
    return <div>Property not found</div>;
  }

  // Get property details from translations
  const getPropertyKey = (slug: string) => {
    const keyMap = {
      'madrid-luxury-penthouse': 'madrid',
      'barcelona-smart-apartment': 'barcelona', 
      'valencia-beachfront-condo': 'valencia'
    };
    return keyMap[slug as keyof typeof keyMap] || 'madrid';
  };

  const propertyKey = getPropertyKey(slug);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href={`/${locale}/`} className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Properties</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Property Images Gallery */}
            <div className="grid lg:grid-cols-4 gap-4 mb-12">
              <div className="lg:col-span-3">
                <div className="aspect-video rounded-3xl overflow-hidden">
                  <img 
                    src={property.images[selectedImage]}
                    alt="Property main view"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-orange-500' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img 
                      src={image}
                      alt={`Property view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Property Details Grid */}
            <div className="grid lg:grid-cols-3 gap-12">
              
              {/* Left Column - Property Info */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Title & Location */}
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                    {t(`landing.properties.cards.${propertyKey}.title`)}
                  </h1>
                  <div className="flex items-center text-gray-300 text-lg">
                    <MapPin className="w-5 h-5 mr-2" />
                    {t(`landing.properties.cards.${propertyKey}.location`)}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">About This Property</h2>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {t(`landing.properties.cards.${propertyKey}.description`)}
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Key Features</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Home className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Details */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                  <h2 className="text-2xl font-semibold mb-6">Investment Overview</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Property Value</span>
                        <span className="font-semibold">{t(`landing.properties.cards.${propertyKey}.price`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Minimum Investment</span>
                        <span className="text-orange-400 font-semibold">{t(`landing.properties.cards.${propertyKey}.minInvestment`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Expected Return</span>
                        <span className="text-green-400 font-semibold">{t(`landing.properties.cards.${propertyKey}.expectedReturn`)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Investment Period</span>
                        <span className="font-semibold">{t(`landing.properties.cards.${propertyKey}.timeframe`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Current Funding</span>
                        <span className="text-blue-400 font-semibold">{t(`landing.properties.cards.${propertyKey}.funded`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Investors</span>
                        <span className="font-semibold">{t(`landing.properties.cards.${propertyKey}.investors`)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Investment Panel */}
              <div className="space-y-6">
                
                {/* Investment Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sticky top-8">
                  <div className="space-y-6">
                    
                    {/* Price Display */}
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{t(`landing.properties.cards.${propertyKey}.price`)}</div>
                      <div className="text-green-400 text-lg font-semibold">
                        {t(`landing.properties.cards.${propertyKey}.expectedReturn`)} Expected Return
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Funding Progress</span>
                        <span className="text-white">{t(`landing.properties.cards.${propertyKey}.funded`)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: t(`landing.properties.cards.${propertyKey}.funded`) }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-300">
                        {t(`landing.properties.cards.${propertyKey}.investors`)} investors joined
                      </div>
                    </div>

                    {/* Investment Amount Input */}
                    <div className="space-y-3">
                      <label className="text-sm text-gray-300">Investment Amount</label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="number" 
                          placeholder="10,000"
                          className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        Minimum: {t(`landing.properties.cards.${propertyKey}.minInvestment`)}
                      </div>
                    </div>

                    {/* Investment Button */}
                    <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg">
                      Invest Now
                    </button>

                    {/* Security Note */}
                    <div className="flex items-start space-x-3 text-sm text-gray-400">
                      <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Secured by certified notaries and blockchain technology</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">ROI</span>
                      </div>
                      <span className="text-green-400 font-semibold">{t(`landing.properties.cards.${propertyKey}.expectedReturn`)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Duration</span>
                      </div>
                      <span className="font-semibold">{t(`landing.properties.cards.${propertyKey}.timeframe`)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300">Investors</span>
                      </div>
                      <span className="font-semibold">{t(`landing.properties.cards.${propertyKey}.investors`)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}