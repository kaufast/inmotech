'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PropertyMap from '@/components/properties/PropertyMap';
import { 
  Search,
  Filter,
  MapPin,
  Euro,
  Bed,
  Bath,
  Square,
  Eye,
  Heart,
  List,
  Map,
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Building2,
  Warehouse,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  listingType: string;
  status: string;
  salePrice?: number;
  rentPrice?: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  livingArea?: number;
  yearBuilt?: number;
  images: string[];
  isFeatured: boolean;
  views: number;
  inquiries: number;
  owner: {
    firstName: string;
    lastName: string;
  };
  agent?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface PropertySearchResponse {
  properties: Property[];
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
  { value: 'land', label: 'Land', icon: Square }
];

const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'both', label: 'Sale & Rent' }
];

export default function PropertiesMapPage() {
  const router = useRouter();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Map states
  const [mapCenter, setMapCenter] = useState({ lat: 40.4168, lng: -3.7038 }); // Madrid
  const [mapZoom, setMapZoom] = useState(10);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);

  useEffect(() => {
    fetchProperties();
  }, [searchQuery, propertyType, listingType, city, minPrice, maxPrice, bedrooms, bathrooms, sortBy, sortOrder, mapCenter, mapZoom]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '100', // Get more properties for map view
        sortBy,
        sortOrder
      });

      if (searchQuery) params.set('search', searchQuery);
      if (propertyType) params.set('propertyType', propertyType);
      if (listingType) params.set('listingType', listingType);
      if (city) params.set('city', city);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (bedrooms) params.set('bedrooms', bedrooms);
      if (bathrooms) params.set('bathrooms', bathrooms);
      
      // Add map bounds to get properties in visible area
      if (mapBounds) {
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        params.set('northEast', `${ne.lat()},${ne.lng()}`);
        params.set('southWest', `${sw.lat()},${sw.lng()}`);
      }

      const response = await fetch(`/api/properties/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data: PropertySearchResponse = await response.json();
      setProperties(data.properties);
      
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    // Optionally navigate to property details
    // router.push(`/properties/${property.id}`);
  };

  const handleLocationChange = (center: { lat: number; lng: number }, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPropertyType('');
    setListingType('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBathrooms('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyTypeIcon = (type: string) => {
    const typeConfig = PROPERTY_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Home;
  };

  // Filter properties with coordinates for map display
  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Map Search</h1>
              <p className="text-gray-600">Explore properties by location</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'split' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex gap-0.5">
                    <div className="w-2 h-4 bg-current rounded-l"></div>
                    <div className="w-2 h-4 bg-current rounded-r"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by location, title, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(propertyType || listingType || city || minPrice || maxPrice || bedrooms || bathrooms) && (
                  <Badge variant="secondary" className="ml-1">
                    Active
                  </Badge>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">All Types</option>
                        {PROPERTY_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                      <select
                        value={listingType}
                        onChange={(e) => setListingType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">All Listings</option>
                        {LISTING_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <Input
                        placeholder="Enter city..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min €"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Max €"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <select
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [sort, order] = e.target.value.split('-');
                          setSortBy(sort);
                          setSortOrder(order);
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="salePrice-desc">Highest Price</option>
                        <option value="salePrice-asc">Lowest Price</option>
                        <option value="totalArea-desc">Largest Area</option>
                        <option value="views-desc">Most Popular</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button variant="outline" onClick={clearFilters} className="w-full">
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{properties.length} properties found</span>
              <span>{propertiesWithCoords.length} shown on map</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {viewMode === 'map' ? (
          // Full Map View
          <div className="h-[calc(100vh-250px)]">
            <PropertyMap
              properties={propertiesWithCoords}
              onPropertySelect={handlePropertySelect}
              onLocationChange={handleLocationChange}
              selectedPropertyId={selectedProperty?.id}
              height="100%"
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
            />
          </div>
        ) : viewMode === 'list' ? (
          // Full List View
          <div className="container mx-auto px-4 py-6">
            <PropertyList
              properties={properties}
              loading={loading}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
            />
          </div>
        ) : (
          // Split View
          <div className="flex h-[calc(100vh-250px)]">
            <div className="w-1/2 overflow-y-auto border-r">
              <div className="p-4">
                <PropertyList
                  properties={properties}
                  loading={loading}
                  onPropertySelect={handlePropertySelect}
                  selectedProperty={selectedProperty}
                />
              </div>
            </div>
            <div className="w-1/2">
              <PropertyMap
                properties={propertiesWithCoords}
                onPropertySelect={handlePropertySelect}
                onLocationChange={handleLocationChange}
                selectedPropertyId={selectedProperty?.id}
                height="100%"
                defaultCenter={mapCenter}
                defaultZoom={mapZoom}
              />
            </div>
          </div>
        )}
      </div>

      {/* Selected Property Panel */}
      {selectedProperty && (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-30 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {selectedProperty.images.length > 0 ? (
                <Image
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Home className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{selectedProperty.title}</h3>
              <p className="text-sm text-gray-600 truncate">{selectedProperty.address}, {selectedProperty.city}</p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold text-blue-600">
                  {selectedProperty.salePrice ? formatCurrency(selectedProperty.salePrice) : 
                   selectedProperty.rentPrice ? `${formatCurrency(selectedProperty.rentPrice)}/mo` : 'Price on request'}
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/properties/${selectedProperty.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProperty(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Property List Component
function PropertyList({ 
  properties, 
  loading, 
  onPropertySelect, 
  selectedProperty 
}: { 
  properties: Property[]; 
  loading: boolean; 
  onPropertySelect: (property: Property) => void;
  selectedProperty: Property | null;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-24 h-20 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded mb-1 w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or browse all properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <Card 
          key={property.id}
          className={`hover:shadow-lg transition-shadow cursor-pointer ${
            selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onPropertySelect(property)}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Property Image */}
              <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {property.images.length > 0 ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    width={96}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Home className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                  {property.isFeatured && (
                    <Badge className="bg-orange-100 text-orange-800 ml-2">Featured</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2 truncate">{property.address}, {property.city}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms}
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms}
                    </div>
                  )}
                  {property.totalArea && (
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.totalArea}m²
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-blue-600">
                    {property.salePrice ? formatCurrency(property.salePrice) : 
                     property.rentPrice ? `${formatCurrency(property.rentPrice)}/mo` : 'Price on request'}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {property.views}
                    </div>
                    {property.latitude && property.longitude && (
                      <MapPin className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}