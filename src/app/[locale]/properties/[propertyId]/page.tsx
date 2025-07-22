'use client';

import React, { useState, useEffect } from 'react';
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
  Camera,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Share2,
  MapIcon,
  Clock,
  CheckCircle,
  Building,
  Home,
  Warehouse,
  Building2,
  Car,
  Wifi,
  Dumbbell,
  ShoppingCart,
  TreePine,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import PropertyValuationComponent from '@/components/properties/PropertyValuation';

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
  livingArea?: number;
  lotSize?: number;
  salePrice?: number;
  rentPrice?: number;
  currency: string;
  images: string[];
  isFeatured: boolean;
  views: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
  yearBuilt?: number;
  floors?: number;
  parkingSpaces?: number;
  amenities?: string[];
  utilities?: string[];
  latitude?: number;
  longitude?: number;
  owner: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  _count: {
    inquiries_list: number;
    viewings: number;
    watchlistedBy: number;
  };
}

interface PropertyPageProps {
  params: {
    locale: string;
    propertyId: string;
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { user } = useSecureAuth();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [viewingData, setViewingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    loadProperty();
  }, [params.propertyId]);

  const loadProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params.propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
        
        // Check if user has this in watchlist
        if (user) {
          const watchlistResponse = await fetch('/api/user/watchlist', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (watchlistResponse.ok) {
            const watchlistData = await watchlistResponse.json();
            setIsWatchlisted(watchlistData.properties?.some((p: any) => p.id === params.propertyId) || false);
          }
        }
      } else if (response.status === 404) {
        setError('Property not found');
      } else {
        setError('Failed to load property');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) return;
    
    try {
      const method = isWatchlisted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/properties/${params.propertyId}/watchlist`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsWatchlisted(!isWatchlisted);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/properties/${params.propertyId}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inquiryData)
      });
      
      if (response.ok) {
        setShowInquiryForm(false);
        setInquiryData({ name: '', email: '', phone: '', message: '' });
        alert('Inquiry sent successfully!');
      } else {
        alert('Failed to send inquiry');
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry');
    }
  };

  const handleViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledDate = new Date(`${viewingData.date}T${viewingData.time}`);
    
    try {
      const response = await fetch(`/api/properties/${params.propertyId}/viewings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          viewerName: viewingData.name,
          viewerEmail: viewingData.email,
          viewerPhone: viewingData.phone,
          scheduledDate: scheduledDate.toISOString(),
          duration: 60,
          notes: viewingData.notes
        })
      });
      
      if (response.ok) {
        setShowViewingForm(false);
        setViewingData({ name: '', email: '', phone: '', date: '', time: '', notes: '' });
        alert('Viewing scheduled successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to schedule viewing');
      }
    } catch (error) {
      console.error('Error scheduling viewing:', error);
      alert('Failed to schedule viewing');
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'house': return <Home className="w-5 h-5" />;
      case 'apartment': return <Building className="w-5 h-5" />;
      case 'commercial': return <Building2 className="w-5 h-5" />;
      case 'office': return <Building2 className="w-5 h-5" />;
      case 'warehouse': return <Warehouse className="w-5 h-5" />;
      default: return <Building className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-300 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Property not found'}
            </h1>
            <Link 
              href={`/${params.locale}/properties`}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const price = property.listingType === 'rent' ? property.rentPrice : property.salePrice;
  const priceLabel = property.listingType === 'rent' ? '/month' : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Image Gallery */}
        <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden mb-8">
          {property.images.length > 0 ? (
            <>
              <Image
                src={property.images[currentImageIndex]}
                alt={property.title}
                fill
                className="object-cover"
              />
              
              {/* Navigation */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? property.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === property.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    →
                  </button>
                  
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {property.images.slice(0, 5).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-white' : 'border-white/50'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          width={48}
                          height={32}
                          className="object-cover"
                        />
                      </button>
                    ))}
                    {property.images.length > 5 && (
                      <div className="w-12 h-8 bg-black/50 rounded flex items-center justify-center text-white text-xs">
                        +{property.images.length - 5}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Image count */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full flex items-center">
                <Camera className="w-4 h-4 mr-1" />
                {currentImageIndex + 1}/{property.images.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-500" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            {property.isFeatured && (
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Featured
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
              property.listingType === 'sale' ? 'bg-green-500' : 
              property.listingType === 'rent' ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              For {property.listingType === 'sale' ? 'Sale' : property.listingType === 'rent' ? 'Rent' : 'Both'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <button className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
            {user && (
              <button
                onClick={handleWatchlistToggle}
                className={`p-2 rounded-full transition-colors ${
                  isWatchlisted 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Price */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{property.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-3xl font-bold text-green-600 mb-1">
                    <Euro className="w-8 h-8 mr-1" />
                    {price?.toLocaleString() || 'Price on request'}
                    {priceLabel && <span className="text-lg text-gray-500 ml-1">{priceLabel}</span>}
                  </div>
                  {property.totalArea && price && (
                    <div className="text-sm text-gray-500">
                      €{Math.round(price / property.totalArea)}/m²
                    </div>
                  )}
                </div>
              </div>

              {/* Property Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-b border-gray-200 dark:border-gray-700">
                {property.bedrooms && (
                  <div className="flex items-center">
                    <Bed className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">{property.bedrooms}</div>
                      <div className="text-sm text-gray-500">Bedrooms</div>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center">
                    <Bath className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">{property.bathrooms}</div>
                      <div className="text-sm text-gray-500">Bathrooms</div>
                    </div>
                  </div>
                )}
                {property.totalArea && (
                  <div className="flex items-center">
                    <Square className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">{property.totalArea}m²</div>
                      <div className="text-sm text-gray-500">Total Area</div>
                    </div>
                  </div>
                )}
                {property.parkingSpaces && (
                  <div className="flex items-center">
                    <Car className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">{property.parkingSpaces}</div>
                      <div className="text-sm text-gray-500">Parking</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {property.views} views
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {property._count.inquiries_list} inquiries
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {property._count.viewings} viewings
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {property._count.watchlistedBy} saved
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Listed {new Date(property.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Property Valuation */}
            <PropertyValuationComponent
              property={{
                id: property.id,
                address: property.address,
                city: property.city,
                latitude: property.latitude,
                longitude: property.longitude,
                propertyType: property.propertyType,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                totalArea: property.totalArea || 0,
                yearBuilt: property.yearBuilt,
                listingPrice: property.salePrice,
                rentPrice: property.rentPrice
              }}
              showDetailed={true}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
            />

            {/* Property Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Property Type:</span>
                      <span className="flex items-center">
                        {getPropertyTypeIcon(property.propertyType)}
                        <span className="ml-2 capitalize">{property.propertyType.replace('_', ' ')}</span>
                      </span>
                    </div>
                    {property.yearBuilt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Year Built:</span>
                        <span>{property.yearBuilt}</span>
                      </div>
                    )}
                    {property.floors && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Floors:</span>
                        <span>{property.floors}</span>
                      </div>
                    )}
                    {property.livingArea && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Living Area:</span>
                        <span>{property.livingArea}m²</span>
                      </div>
                    )}
                    {property.lotSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lot Size:</span>
                        <span>{property.lotSize}m²</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Location</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">City:</span>
                      <span>{property.city}</span>
                    </div>
                    {property.neighborhood && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Neighborhood:</span>
                        <span>{property.neighborhood}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address:</span>
                      <span className="text-right">{property.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="capitalize">{amenity.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              
              {/* Owner/Agent Info */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {property.agent 
                        ? `${property.agent.firstName || ''} ${property.agent.lastName || ''}`.trim()
                        : `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim()
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.agent ? 'Agent' : 'Owner'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{property.agent?.email || property.owner.email}</span>
                  </div>
                  {(property.agent?.phone || property.owner.phone) && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{property.agent?.phone || property.owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Send Inquiry
                </button>
                <button
                  onClick={() => setShowViewingForm(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Schedule Viewing
                </button>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Location</h2>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Map integration coming soon</p>
                  <p className="text-sm">{property.city}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Send Inquiry</h3>
            <form onSubmit={handleInquiry}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={inquiryData.name}
                  onChange={(e) => setInquiryData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={inquiryData.email}
                  onChange={(e) => setInquiryData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={inquiryData.phone}
                  onChange={(e) => setInquiryData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  value={inquiryData.message}
                  onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Modal */}
      {showViewingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Schedule Viewing</h3>
            <form onSubmit={handleViewing}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={viewingData.name}
                  onChange={(e) => setViewingData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={viewingData.email}
                  onChange={(e) => setViewingData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={viewingData.phone}
                  onChange={(e) => setViewingData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={viewingData.date}
                    onChange={(e) => setViewingData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="time"
                    value={viewingData.time}
                    onChange={(e) => setViewingData(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <textarea
                  placeholder="Special requests (optional)"
                  rows={3}
                  value={viewingData.notes}
                  onChange={(e) => setViewingData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowViewingForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Schedule Viewing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}