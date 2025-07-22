'use client';

import React, { useState, useEffect } from 'react';
import { Grid, List, Filter, SortAsc, SortDesc, MapPin } from 'lucide-react';
import PropertyCard from './PropertyCard';

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

interface PropertyGridProps {
  initialProperties?: Property[];
  showFilters?: boolean;
  showSorting?: boolean;
  showViewToggle?: boolean;
  locale?: string;
  searchParams?: URLSearchParams;
}

export default function PropertyGrid({ 
  initialProperties = [],
  showFilters = true,
  showSorting = true,
  showViewToggle = true,
  locale = 'en-GB',
  searchParams
}: PropertyGridProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    propertyType: '',
    listingType: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: ''
  });
  const [watchlistedProperties, setWatchlistedProperties] = useState<Set<string>>(new Set());

  // Load properties on component mount or when filters change
  useEffect(() => {
    loadProperties();
  }, [filters, sortBy, sortOrder]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      
      // Add sorting
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      
      // Add search params if provided
      if (searchParams) {
        searchParams.forEach((value, key) => {
          if (!params.has(key)) params.set(key, value);
        });
      }
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleWatchlistToggle = (propertyId: string, isInWatchlist: boolean) => {
    setWatchlistedProperties(prev => {
      const newSet = new Set(prev);
      if (isInWatchlist) {
        newSet.add(propertyId);
      } else {
        newSet.delete(propertyId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      listingType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.listingType}
              onChange={(e) => handleFilterChange('listingType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
              <option value="both">Both</option>
            </select>

            <select
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Properties</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
            </select>

            <input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            />

            <div className="flex items-center space-x-1">
              <input
                type="number"
                placeholder="Min €"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max €"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
              />
            </div>

            <select
              value={filters.bedrooms}
              onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Beds</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Sorting */}
          {showSorting && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="price">Price</option>
                <option value="area">Area</option>
                <option value="views">Views</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {loading ? 'Loading...' : `${properties.length} properties found`}
      </div>

      {/* Property Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-64 bg-gray-300"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or clear the filters.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              locale={locale}
              onWatchlistToggle={handleWatchlistToggle}
              isInWatchlist={watchlistedProperties.has(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}