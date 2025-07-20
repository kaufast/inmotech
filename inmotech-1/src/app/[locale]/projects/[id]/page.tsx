'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Share, Camera, MapPin, Calendar, DollarSign, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Heart } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
  imageUrls: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  totalValue: number;
  targetFunding: number;
  currentFunding: number;
  minInvestment: number;
  maxInvestment?: number;
  expectedReturn: number;
  investmentTerm: number;
  distributionType: string;
  projectType: string;
  status: string;
  fundingDeadline: string;
  expectedCompletion?: string;
  fundingProgress: number;
  totalInvestors: number;
  daysRemaining: number;
  isFundingActive: boolean;
  isFullyFunded: boolean;
  owner: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Mock project data for development (replace with API call)
  const mockProject: Project = {
    id: params.id as string,
    title: "Madrid Luxury Residences",
    description: "A premium residential development featuring modern apartments with stunning city views. This exclusive project offers high-end finishes, state-of-the-art amenities, and prime location in the heart of Madrid.",
    shortDescription: "Premium residential development in Madrid with luxury amenities and city views.",
    location: {
      address: "Calle de Alcalá 123",
      city: "Madrid",
      country: "Spain",
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    imageUrls: [
      "/api/placeholder/800/600",
      "/api/placeholder/800/600", 
      "/api/placeholder/800/600",
      "/api/placeholder/800/600",
      "/api/placeholder/800/600"
    ],
    videoUrl: "/api/placeholder/video",
    virtualTourUrl: "/virtual-tour",
    totalValue: 2500000,
    targetFunding: 1500000,
    currentFunding: 980000,
    minInvestment: 1000,
    maxInvestment: 50000,
    expectedReturn: 12.5,
    investmentTerm: 24,
    distributionType: "quarterly",
    projectType: "residential",
    status: "OPEN",
    fundingDeadline: "2024-12-31T23:59:59Z",
    expectedCompletion: "2026-06-30T00:00:00Z",
    fundingProgress: 65.3,
    totalInvestors: 127,
    daysRemaining: 45,
    isFundingActive: true,
    isFullyFunded: false,
    owner: {
      firstName: "Carlos",
      lastName: "Rodriguez",
      role: "DEVELOPER"
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchProject = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await fetch(`/api/projects/${params.id}`);
        // const data = await response.json();
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProject(mockProject);
      } catch (err) {
        setError('Failed to load project details');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
      try {
        // Check if user is authenticated first
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Mock favorite status for development
        // Replace with actual API call:
        // const response = await fetch(`/api/favorites/${params.id}`, {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await response.json();
        // setIsFavorited(data.isFavorited);
        
        // Mock: randomly set favorite status
        setIsFavorited(Math.random() > 0.5);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };

    fetchProject();
    checkFavoriteStatus();
  }, [params.id]);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleInvestClick = () => {
    // Navigate to investment flow
    router.push(`/dashboard/invest?project=${params.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.shortDescription,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleToggleFavorite = async () => {
    try {
      setFavoriteLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Redirect to login
        router.push(`/login?redirectTo=${window.location.pathname}`);
        return;
      }

      // Replace with actual API call
      // const response = await fetch('/api/favorites', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ projectId: params.id })
      // });
      
      // const data = await response.json();
      
      // if (response.ok) {
      //   setIsFavorited(data.isFavorited);
      //   // Show success toast notification
      // } else {
      //   console.error('Failed to toggle favorite:', data.error);
      //   // Show error toast notification
      // }

      // Mock toggle for development
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsFavorited(!isFavorited);
      
      // Mock toast notification
      console.log(isFavorited ? 'Removed from favorites' : 'Added to favorites');

    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Show error toast notification
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The project you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Properties
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`p-2 transition-colors ${
                  isFavorited 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-600 hover:text-gray-900'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Image - Full Width */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="relative h-96 md:h-[500px] bg-gray-200">
            <Image
              src={project.imageUrls[selectedImageIndex] || '/api/placeholder/800/600'}
              alt={`${project.title} - Image ${selectedImageIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {project.imageUrls.length}
            </div>
          </div>
        </div>

        {/* Thumbnail Strip - Full Width Below Main Image */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 THUMBNAILS BELOW - UPDATED FILE 🚨</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {project.imageUrls.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(index)}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  selectedImageIndex === index 
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={`Property view ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Current
                    </div>
                  </div>
                )}
              </button>
            ))}
            
            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center text-white hover:scale-105 transition-all"
            >
              <Share className="h-6 w-6 mb-1" />
              <div className="text-xs font-medium">Share</div>
            </button>
            
            {/* Camera/Photos Button */}
            <button className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 bg-gradient-to-br from-gray-500 to-gray-600 flex flex-col items-center justify-center text-white hover:scale-105 transition-all">
              <Camera className="h-6 w-6 mb-1" />
              <div className="text-xs font-medium">Photos</div>
            </button>
            
            {/* Virtual Tour Button */}
            {project.virtualTourUrl && (
              <button className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 bg-gradient-to-br from-purple-500 to-blue-600 flex flex-col items-center justify-center text-white hover:scale-105 transition-all">
                <div className="text-2xl mb-1">🏠</div>
                <div className="text-xs font-medium">360° Tour</div>
              </button>
            )}
            
            {/* Video Button */}
            {project.videoUrl && (
              <button className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 bg-gradient-to-br from-red-500 to-pink-600 flex flex-col items-center justify-center text-white hover:scale-105 transition-all">
                <div className="text-2xl mb-1">▶️</div>
                <div className="text-xs font-medium">Video</div>
              </button>
            )}
          </div>
        </div>

        {/* Content Grid - Project Details and Investment Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2">

            {/* Project Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{project.location.address}, {project.location.city}, {project.location.country}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    €{project.totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{project.expectedReturn}%</div>
                  <div className="text-sm text-gray-600">Annual Return</div>
                </div>
                <div className="text-center">
                  <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{project.investmentTerm}</div>
                  <div className="text-sm text-gray-600">Months</div>
                </div>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">€{project.minInvestment.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Min Investment</div>
                </div>
                <div className="text-center">
                  <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{project.totalInvestors}</div>
                  <div className="text-sm text-gray-600">Investors</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            
            {/* Investment Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Funding Progress</span>
                  <span className="text-sm font-medium text-gray-900">{project.fundingProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(project.fundingProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-600">€{project.currentFunding.toLocaleString()} raised</span>
                  <span className="text-gray-600">€{project.targetFunding.toLocaleString()} goal</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Days remaining</span>
                  <span className="font-medium text-gray-900">{project.daysRemaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total investors</span>
                  <span className="font-medium text-gray-900">{project.totalInvestors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distribution</span>
                  <span className="font-medium text-gray-900 capitalize">{project.distributionType}</span>
                </div>
              </div>

              {project.isFundingActive ? (
                <button
                  onClick={handleInvestClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                >
                  Invest Now
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium text-center">
                  {project.isFullyFunded ? 'Fully Funded' : 'Funding Closed'}
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500 text-center">
                Minimum investment: €{project.minInvestment.toLocaleString()}
              </div>
            </div>

            {/* Project Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Due diligence completed</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Legal documentation verified</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Financial projections reviewed</span>
                </div>
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-blue-100 rounded-full mr-3 flex items-center justify-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">Funding in progress</span>
                </div>
              </div>

              {project.expectedCompletion && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">Expected Completion</span>
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {new Date(project.expectedCompletion).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}