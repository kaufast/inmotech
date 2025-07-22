'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Filter, Search, X, Home, Euro, Maximize2 } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  listingType: string;
  salePrice?: number;
  rentPrice?: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  images: string[];
  status: string;
}

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  onLocationChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  selectedPropertyId?: string;
  height?: string;
  showControls?: boolean;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  property: Property;
}

export default function PropertyMap({
  properties,
  onPropertySelect,
  onLocationChange,
  selectedPropertyId,
  height = '400px',
  showControls = true,
  defaultCenter = { lat: 40.4168, lng: -3.7038 }, // Madrid center
  defaultZoom = 10
}: PropertyMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    bedrooms: '',
    listingType: ''
  });

  // Load Google Maps API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setIsLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !document.getElementById('map')) return;

    const mapOptions: google.maps.MapOptions = {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy'
    };

    const newMap = new google.maps.Map(
      document.getElementById('map') as HTMLElement,
      mapOptions
    );

    setMap(newMap);

    // Create info window
    const newInfoWindow = new google.maps.InfoWindow();
    setInfoWindow(newInfoWindow);

    // Add map event listeners
    newMap.addListener('center_changed', () => {
      const center = newMap.getCenter();
      if (center) {
        const newCenter = { lat: center.lat(), lng: center.lng() };
        setMapCenter(newCenter);
      }
    });

    newMap.addListener('zoom_changed', () => {
      const zoom = newMap.getZoom() || defaultZoom;
      setMapZoom(zoom);
    });

    newMap.addListener('idle', () => {
      const center = newMap.getCenter();
      const zoom = newMap.getZoom();
      if (center && zoom && onLocationChange) {
        onLocationChange({ lat: center.lat(), lng: center.lng() }, zoom);
      }
    });

    // Initialize search box
    const input = document.getElementById('map-search') as HTMLInputElement;
    if (input) {
      const newSearchBox = new google.maps.places.SearchBox(input);
      setSearchBox(newSearchBox);

      newMap.addListener('bounds_changed', () => {
        newSearchBox.setBounds(newMap.getBounds() as google.maps.LatLngBounds);
      });

      newSearchBox.addListener('places_changed', () => {
        const places = newSearchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            newMap.setCenter(place.geometry.location);
            newMap.setZoom(15);
          }
        }
      });
    }

    return () => {
      // Cleanup
      markers.forEach(marker => marker.setMap(null));
      newInfoWindow.close();
    };
  }, [isLoaded]);

  // Create property markers
  const createMarkers = useCallback(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];
    
    properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const position = { lat: property.latitude, lng: property.longitude };
        
        // Custom marker icon based on property type and price
        const getMarkerIcon = (prop: Property) => {
          const baseUrl = '/api/maps/marker';
          const price = prop.salePrice || prop.rentPrice || 0;
          let color = '#3B82F6'; // blue
          
          if (price > 500000) color = '#EF4444'; // red for expensive
          else if (price > 200000) color = '#F59E0B'; // amber for medium
          else color = '#10B981'; // green for affordable
          
          return {
            url: `data:image/svg+xml;base64,${btoa(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">€</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          };
        };

        const marker = new google.maps.Marker({
          position,
          map,
          title: property.title,
          icon: getMarkerIcon(property),
          animation: selectedPropertyId === property.id ? google.maps.Animation.BOUNCE : undefined
        });

        // Create info window content
        const infoContent = `
          <div class="p-3 max-w-sm">
            <div class="flex gap-3">
              ${property.images.length > 0 ? `
                <img src="${property.images[0]}" alt="${property.title}" 
                     class="w-20 h-16 object-cover rounded-lg flex-shrink-0"/>
              ` : `
                <div class="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
              `}
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 text-sm mb-1 truncate">${property.title}</h3>
                <p class="text-xs text-gray-600 mb-2">${property.address}, ${property.city}</p>
                
                <div class="flex items-center justify-between">
                  <div class="text-lg font-bold text-blue-600">
                    ${property.salePrice ? `€${property.salePrice.toLocaleString()}` : 
                      property.rentPrice ? `€${property.rentPrice.toLocaleString()}/mo` : 'Price on request'}
                  </div>
                </div>
                
                ${property.bedrooms || property.bathrooms || property.totalArea ? `
                  <div class="flex gap-3 text-xs text-gray-600 mt-2">
                    ${property.bedrooms ? `<span>${property.bedrooms} beds</span>` : ''}
                    ${property.bathrooms ? `<span>${property.bathrooms} baths</span>` : ''}
                    ${property.totalArea ? `<span>${property.totalArea}m²</span>` : ''}
                  </div>
                ` : ''}
                
                <button onclick="window.selectProperty('${property.id}')" 
                        class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">
                  View Details
                </button>
              </div>
            </div>
          </div>
        `;

        marker.addListener('click', () => {
          if (infoWindow) {
            infoWindow.setContent(infoContent);
            infoWindow.open(map, marker);
          }
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  }, [map, properties, selectedPropertyId, isLoaded]);

  // Update markers when properties change
  useEffect(() => {
    createMarkers();
  }, [createMarkers]);

  // Center map on selected property
  useEffect(() => {
    if (selectedPropertyId && map) {
      const property = properties.find(p => p.id === selectedPropertyId);
      if (property && property.latitude && property.longitude) {
        map.setCenter({ lat: property.latitude, lng: property.longitude });
        map.setZoom(16);
      }
    }
  }, [selectedPropertyId, properties, map]);

  // Global function for info window button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectProperty = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        if (property && onPropertySelect) {
          onPropertySelect(property);
        }
      };
    }
  }, [properties, onPropertySelect]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
          map.setZoom(15);
        },
        () => {
          alert('Error: The Geolocation service failed.');
        }
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredProperties = properties.filter(property => {
    const price = property.salePrice || property.rentPrice || 0;
    
    if (filters.minPrice && price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && price > parseInt(filters.maxPrice)) return false;
    if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
    if (filters.bedrooms && property.bedrooms !== parseInt(filters.bedrooms)) return false;
    if (filters.listingType && property.listingType !== filters.listingType) return false;
    
    return true;
  });

  if (!isLoaded) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height }}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="map-search"
              type="text"
              placeholder="Search location..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Control Buttons */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleCurrentLocation}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
            title="Current Location"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Map Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <label className="block text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="€"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="€"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Listing Type</label>
              <select
                value={filters.listingType}
                onChange={(e) => setFilters({...filters, listingType: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Property Counter */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm z-10">
        <p className="text-sm font-medium text-gray-900">
          {filteredProperties.length} properties shown
        </p>
      </div>

      {/* Map Container */}
      <div id="map" className="w-full h-full"></div>
    </div>
  );
}