'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MapPin,
  Home,
  Building,
  Building2,
  Warehouse,
  Euro,
  Sliders,
  X
} from 'lucide-react';
import PropertyGrid from '@/components/properties/PropertyGrid';

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

interface SearchFilters {
  search: string;
  propertyType: string;
  listingType: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
}

const PROPERTY_TYPES = [
  { value: '', label: 'All Properties', icon: Home },
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
  { value: 'office', label: 'Office', icon: Building2 },
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse }
];

const LISTING_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'both', label: 'Sale & Rent' }
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Latest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'area', label: 'Area' },
  { value: 'views', label: 'Most Viewed' }
];

export default function PropertiesPage({ params }: { params: { locale: string } }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    propertyType: '',
    listingType: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    loadProperties();
  }, [appliedFilters, sortBy, sortOrder, currentPage]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) {
          if (key === 'search') {
            params.set('title', value);
          } else if (key === 'minPrice') {
            params.set('minPrice', value);
          } else if (key === 'maxPrice') {
            params.set('maxPrice', value);
          } else if (key === 'minArea') {
            params.set('minArea', value);
          } else if (key === 'maxArea') {
            params.set('maxArea', value);
          } else {
            params.set(key, value);
          }
        }
      });
      
      // Add sorting
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      
      // Add pagination
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      propertyType: '',
      listingType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: ''
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    if (value.includes('price')) {
      setSortBy('price');
      setSortOrder(value === 'price-low' ? 'asc' : 'desc');
    } else {
      setSortBy(value);
      setSortOrder(value === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / 12);

  const getActiveFiltersCount = () => {
    return Object.values(appliedFilters).filter(value => value !== '').length;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Find Your Perfect Property
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing properties in your preferred location
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, location, or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap lg:flex-nowrap gap-3">
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.listingType}
                onChange={(e) => handleFilterChange('listingType', e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[130px]"
              >
                {LISTING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors relative"
              >
                <Sliders className="w-4 h-4 mr-2" />
                More Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range (€)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bedrooms & Bathrooms
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={filters.bedrooms}
                      onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Beds</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                    <select
                      value={filters.bathrooms}
                      onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Baths</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area Range (m²)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minArea}
                      onChange={(e) => handleFilterChange('minArea', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxArea}
                      onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear all filters
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loading ? 'Searching...' : `${totalCount.toLocaleString()} Properties Found`}
            </h2>
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
                </span>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy === 'price' ? `price-${sortOrder === 'asc' ? 'low' : 'high'}` : sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Properties Grid */}
        <PropertyGrid
          initialProperties={properties}
          showFilters={false}
          showSorting={false}
          showViewToggle={true}
          locale={params.locale}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}