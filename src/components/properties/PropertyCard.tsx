'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  Eye, 
  MessageSquare,
  Calendar,
  Euro,
  Star,
  Camera
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface Property {
  id: string;
  title: string;
  description?: string;
  propertyType: string;
  listingType: string;
  status: string;
  address: string;
  city: string;
  neighborhood?: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  salePrice?: number;
  rentPrice?: number;
  currency: string;
  images: string[];
  isFeatured: boolean;
  views: number;
  inquiries: number;
  createdAt: string;
  owner: {
    firstName?: string;
    lastName?: string;
  };
  _count: {
    inquiries_list: number;
    viewings: number;
    watchlistedBy: number;
  };
}

interface PropertyCardProps {
  property: Property;
  showOwnerInfo?: boolean;
  onWatchlistToggle?: (propertyId: string, isInWatchlist: boolean) => void;
  isInWatchlist?: boolean;
  locale?: string;
}

export default function PropertyCard({ 
  property, 
  showOwnerInfo = false,
  onWatchlistToggle,
  isInWatchlist = false,
  locale = 'en-GB'
}: PropertyCardProps) {
  const { user } = useSecureAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(isInWatchlist);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  const price = property.listingType === 'rent' ? property.rentPrice : property.salePrice;
  const priceLabel = property.listingType === 'rent' ? '/month' : '';
  
  const handleWatchlistToggle = async () => {
    if (!user) return;
    
    setIsWatchlistLoading(true);
    try {
      const method = isWatchlisted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/properties/${property.id}/watchlist`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsWatchlisted(!isWatchlisted);
        onWatchlistToggle?.(property.id, !isWatchlisted);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Image Carousel */}
      <div className="relative h-64 overflow-hidden">
        {property.images.length > 0 ? (
          <>
            <Image
              src={property.images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Image Navigation */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  →
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {property.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Image Count */}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm flex items-center">
              <Camera className="w-3 h-3 mr-1" />
              {property.images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-500" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {property.isFeatured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
            property.listingType === 'sale' ? 'bg-green-500' : 
            property.listingType === 'rent' ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            For {property.listingType === 'sale' ? 'Sale' : property.listingType === 'rent' ? 'Rent' : 'Both'}
          </span>
        </div>
        
        {/* Watchlist Button */}
        {user && (
          <button
            onClick={handleWatchlistToggle}
            disabled={isWatchlistLoading}
            className={`absolute top-2 right-12 p-2 rounded-full transition-colors ${
              isWatchlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Euro className="w-5 h-5 text-green-600 mr-1" />
            <span className="text-2xl font-bold text-green-600">
              {price?.toLocaleString() || 'Price on request'}
            </span>
            {priceLabel && (
              <span className="text-sm text-gray-500 ml-1">{priceLabel}</span>
            )}
          </div>
          {property.totalArea && price && (
            <span className="text-sm text-gray-500">
              €{Math.round(price / property.totalArea)}/m²
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/${locale}/properties/${property.id}`}>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
          {property.bedrooms && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.totalArea && (
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              <span>{property.totalArea}m²</span>
            </div>
          )}
        </div>

        {/* Property Type */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
            {property.propertyType.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(property.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span>{property.views}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="w-3 h-3 mr-1" />
              <span>{property._count.inquiries_list}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{property._count.viewings}</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              <span>{property._count.watchlistedBy}</span>
            </div>
          </div>
          
          {showOwnerInfo && property.owner && (
            <span className="text-xs">
              By {property.owner.firstName} {property.owner.lastName}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex space-x-2">
          <Link 
            href={`/${locale}/properties/${property.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
          <Link 
            href={`/${locale}/properties/${property.id}#inquiry`}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Inquire
          </Link>
        </div>
      </div>
    </div>
  );
}