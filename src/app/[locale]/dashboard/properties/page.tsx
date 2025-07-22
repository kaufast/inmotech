'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Calendar,
  Heart,
  TrendingUp,
  Home,
  Euro,
  MapPin,
  MoreHorizontal,
  Star,
  BarChart3,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import PropertyForm from '@/components/properties/PropertyForm';

interface Property {
  id: string;
  title: string;
  description?: string;
  propertyType: string;
  listingType: string;
  status: string;
  address: string;
  city: string;
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
  updatedAt: string;
  _count: {
    inquiries_list: number;
    viewings: number;
    watchlistedBy: number;
  };
}

interface PropertyStats {
  totalProperties: number;
  statusBreakdown: { status: string; _count: { status: number } }[];
  totalInquiries: number;
  totalViewings: number;
}

export default function PropertiesDashboard({ params }: { params: { locale: string } }) {
  const { user } = useSecureAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProperties();
    loadStats();
  }, [user]);

  const loadProperties = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await fetch(`/api/user/properties?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/user/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: 'stats' })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        loadStats(); // Refresh stats
      } else {
        alert('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const handlePropertySaved = () => {
    setShowCreateForm(false);
    setEditingProperty(null);
    loadProperties();
    loadStats();
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SOLD': return 'bg-blue-100 text-blue-800';
      case 'RENTED': return 'bg-purple-100 text-purple-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div>Please log in to view your properties.</div>;
  }

  if (showCreateForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PropertyForm
          onSuccess={handlePropertySaved}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (editingProperty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PropertyForm
          propertyId={editingProperty.id}
          initialData={editingProperty}
          onSuccess={handlePropertySaved}
          onCancel={() => setEditingProperty(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Properties</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor your property listings
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Viewings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViewings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.statusBreakdown.find(s => s.status === 'ACTIVE')?._count.status || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <div className="text-sm text-gray-500">
            {filteredProperties.length} of {properties.length} properties
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center">
            <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {properties.length === 0 ? 'No properties yet' : 'No properties match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {properties.length === 0 
                ? 'Create your first property listing to get started'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {properties.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Property
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProperties.map((property) => (
              <div key={property.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Property Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-200">
                      {property.images.length > 0 ? (
                        <Image
                          src={property.images[0]}
                          alt={property.title}
                          width={96}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {property.title}
                          </h3>
                          {property.isFeatured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{property.city}</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{property.propertyType}</span>
                          <span className="mx-2">•</span>
                          <span>For {property.listingType}</span>
                        </div>

                        {/* Property Details */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          {property.bedrooms && (
                            <span>{property.bedrooms} beds</span>
                          )}
                          {property.bathrooms && (
                            <span>{property.bathrooms} baths</span>
                          )}
                          {property.totalArea && (
                            <span>{property.totalArea}m²</span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center text-lg font-semibold text-green-600 mb-2">
                          <Euro className="w-4 h-4 mr-1" />
                          {property.listingType === 'rent' ? property.rentPrice : property.salePrice}
                          {property.listingType === 'rent' && <span className="text-sm text-gray-500 ml-1">/month</span>}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {property.views}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {property._count.inquiries_list}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {property._count.viewings}
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {property._count.watchlistedBy}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/${params.locale}/properties/${property.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingProperty(property)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/${params.locale}/dashboard/properties/${property.id}/analytics`}
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/${params.locale}/dashboard/properties/${property.id}/inquiries`}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}