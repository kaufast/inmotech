'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save,
  Upload,
  X,
  MapPin,
  Euro,
  Home,
  Building,
  Building2,
  Warehouse,
  Camera,
  Move,
  Trash2,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  status: string;
  address: string;
  city: string;
  neighborhood: string;
  bedrooms: number | '';
  bathrooms: number | '';
  totalArea: number | '';
  livingArea: number | '';
  lotSize: number | '';
  salePrice: number | '';
  rentPrice: number | '';
  currency: string;
  yearBuilt: number | '';
  floors: number | '';
  parkingSpaces: number | '';
  amenities: string[];
  utilities: string[];
  latitude: number | '';
  longitude: number | '';
  isFeatured: boolean;
  images?: string[];
}

interface PropertyFormProps {
  propertyId?: string;
  initialData?: Partial<PropertyFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
  { value: 'office', label: 'Office', icon: Building2 },
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse }
];

const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'both', label: 'Sale & Rent' }
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'INACTIVE', label: 'Inactive' }
];

const AMENITIES_OPTIONS = [
  'pool', 'gym', 'garden', 'balcony', 'terrace', 'parking', 'elevator', 
  'security', 'concierge', 'storage', 'laundry', 'pet_friendly', 'furnished'
];

const UTILITIES_OPTIONS = [
  'electricity', 'water', 'gas', 'internet', 'cable_tv', 'heating', 
  'air_conditioning', 'solar_panels'
];

export default function PropertyForm({ 
  propertyId, 
  initialData, 
  onSuccess, 
  onCancel 
}: PropertyFormProps) {
  const { user } = useSecureAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    status: 'ACTIVE',
    address: '',
    city: '',
    neighborhood: '',
    bedrooms: '',
    bathrooms: '',
    totalArea: '',
    livingArea: '',
    lotSize: '',
    salePrice: '',
    rentPrice: '',
    currency: 'EUR',
    yearBuilt: '',
    floors: '',
    parkingSpaces: '',
    amenities: [],
    utilities: [],
    latitude: '',
    longitude: '',
    isFeatured: false,
    ...initialData
  });

  useEffect(() => {
    if (propertyId && initialData?.images) {
      setImages(initialData.images as string[]);
    }
  }, [propertyId, initialData]);

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'amenities' | 'utilities', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!propertyId) {
      alert('Please save the property first before uploading images');
      return;
    }

    setUploadingImages(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`file${i}`, files[i]);
      }

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, ...data.uploadedImages]);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    if (!propertyId) return;

    try {
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img !== imageUrl));
      } else {
        alert('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleImageReorder = async (newOrder: string[]) => {
    if (!propertyId) return;

    try {
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageOrder: newOrder })
      });

      if (response.ok) {
        setImages(newOrder);
      } else {
        alert('Failed to reorder images');
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Failed to reorder images');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        // Convert empty strings to null for numeric fields
        bedrooms: formData.bedrooms === '' ? null : formData.bedrooms,
        bathrooms: formData.bathrooms === '' ? null : formData.bathrooms,
        totalArea: formData.totalArea === '' ? null : formData.totalArea,
        livingArea: formData.livingArea === '' ? null : formData.livingArea,
        lotSize: formData.lotSize === '' ? null : formData.lotSize,
        salePrice: formData.salePrice === '' ? null : formData.salePrice,
        rentPrice: formData.rentPrice === '' ? null : formData.rentPrice,
        yearBuilt: formData.yearBuilt === '' ? null : formData.yearBuilt,
        floors: formData.floors === '' ? null : formData.floors,
        parkingSpaces: formData.parkingSpaces === '' ? null : formData.parkingSpaces,
        latitude: formData.latitude === '' ? null : formData.latitude,
        longitude: formData.longitude === '' ? null : formData.longitude,
      };

      const url = propertyId 
        ? `/api/properties/${propertyId}` 
        : '/api/properties';
      
      const method = propertyId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        const savedPropertyId = propertyId || data.property?.id;
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/properties/${savedPropertyId}`);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save property');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {propertyId ? 'Edit Property' : 'Create New Property'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Property Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Property Type *</label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Listing Type *</label>
              <select
                value={formData.listingType}
                onChange={(e) => handleInputChange('listingType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {LISTING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Featured Property</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Neighborhood</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parking Spaces</label>
              <input
                type="number"
                min="0"
                value={formData.parkingSpaces}
                onChange={(e) => handleInputChange('parkingSpaces', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Area (m²)</label>
              <input
                type="number"
                min="0"
                value={formData.totalArea}
                onChange={(e) => handleInputChange('totalArea', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Living Area (m²)</label>
              <input
                type="number"
                min="0"
                value={formData.livingArea}
                onChange={(e) => handleInputChange('livingArea', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Lot Size (m²)</label>
              <input
                type="number"
                min="0"
                value={formData.lotSize}
                onChange={(e) => handleInputChange('lotSize', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Year Built</label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.yearBuilt}
                onChange={(e) => handleInputChange('yearBuilt', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Floors</label>
              <input
                type="number"
                min="1"
                value={formData.floors}
                onChange={(e) => handleInputChange('floors', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {(formData.listingType === 'sale' || formData.listingType === 'both') && (
              <div>
                <label className="block text-sm font-medium mb-2">Sale Price</label>
                <input
                  type="number"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange('salePrice', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {(formData.listingType === 'rent' || formData.listingType === 'both') && (
              <div>
                <label className="block text-sm font-medium mb-2">Rent Price (per month)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.rentPrice}
                  onChange={(e) => handleInputChange('rentPrice', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AMENITIES_OPTIONS.map(amenity => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleArrayToggle('amenities', amenity)}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{amenity.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Utilities */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Utilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {UTILITIES_OPTIONS.map(utility => (
              <label key={utility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.utilities.includes(utility)}
                  onChange={() => handleArrayToggle('utilities', utility)}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{utility.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        {propertyId && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Images</h3>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    {uploadingImages ? 'Uploading...' : 'Click to upload images or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB each</p>
                </label>
              </div>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image} className="relative group">
                    <Image
                      src={image}
                      alt={`Property image ${index + 1}`}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleImageDelete(image)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : propertyId ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}