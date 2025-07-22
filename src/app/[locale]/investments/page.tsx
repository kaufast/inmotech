'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface InvestmentOpportunity {
  id: string;
  title: string;
  shortDescription?: string;
  investmentType: string;
  category: string;
  riskLevel: string;
  targetAmount: number;
  raisedAmount: number;
  minimumInvestment: number;
  expectedRoi: number;
  investmentPeriod: number;
  city: string;
  country: string;
  images: string[];
  fundingEndDate: string;
  status: string;
  views: number;
  creator: {
    firstName: string;
    lastName: string;
  };
  _count: {
    investments: number;
  };
  fundingProgress: number;
  daysLeft: number;
}

interface InvestmentListingResponse {
  opportunities: InvestmentOpportunity[];
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const INVESTMENT_TYPES = [
  { value: 'property_development', label: 'Property Development' },
  { value: 'rental_property', label: 'Rental Property' },
  { value: 'property_flip', label: 'Property Flip' },
  { value: 'commercial_real_estate', label: 'Commercial Real Estate' },
  { value: 'land_development', label: 'Land Development' }
];

const CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'land', label: 'Land' }
];

const RISK_LEVELS = [
  { value: 'low', label: 'Low Risk', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Risk', color: 'bg-orange-100 text-orange-800' },
  { value: 'very_high', label: 'Very High Risk', color: 'bg-red-100 text-red-800' }
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'expectedRoi', label: 'Highest ROI' },
  { value: 'targetAmount', label: 'Funding Amount' },
  { value: 'fundingProgress', label: 'Funding Progress' },
  { value: 'fundingEndDate', label: 'Ending Soon' }
];

export default function InvestmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [investmentType, setInvestmentType] = useState(searchParams?.get('investmentType') || '');
  const [category, setCategory] = useState(searchParams?.get('category') || '');
  const [riskLevel, setRiskLevel] = useState(searchParams?.get('riskLevel') || '');
  const [city, setCity] = useState(searchParams?.get('city') || '');
  const [minAmount, setMinAmount] = useState(searchParams?.get('minAmount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams?.get('maxAmount') || '');
  const [minROI, setMinROI] = useState(searchParams?.get('minROI') || '');
  const [maxROI, setMaxROI] = useState(searchParams?.get('maxROI') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams?.get('sortOrder') || 'desc');
  const [showFilters, setShowFilters] = useState(false);

  const fetchOpportunities = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder
      });

      if (searchQuery) params.set('search', searchQuery);
      if (investmentType) params.set('investmentType', investmentType);
      if (category) params.set('category', category);
      if (riskLevel) params.set('riskLevel', riskLevel);
      if (city) params.set('city', city);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (minROI) params.set('minROI', minROI);
      if (maxROI) params.set('maxROI', maxROI);

      const response = await fetch(`/api/investment-opportunities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch investment opportunities');
      }

      const data: InvestmentListingResponse = await response.json();
      setOpportunities(data.opportunities);
      setPagination(data.pagination);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching investment opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(1);
  }, [searchQuery, investmentType, category, riskLevel, city, minAmount, maxAmount, minROI, maxROI, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    fetchOpportunities(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setInvestmentType('');
    setCategory('');
    setRiskLevel('');
    setCity('');
    setMinAmount('');
    setMaxAmount('');
    setMinROI('');
    setMaxROI('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const getRiskLevelStyle = (risk: string) => {
    return RISK_LEVELS.find(r => r.value === risk)?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Investment Opportunities</h1>
        <p className="text-lg text-gray-600">
          Discover and invest in carefully selected real estate opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search investment opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(investmentType || category || riskLevel || city || minAmount || maxAmount || minROI || maxROI) && (
                  <Badge variant="secondary" className="ml-1">
                    Active
                  </Badge>
                )}
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Type</label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    {INVESTMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any risk</SelectItem>
                    {RISK_LEVELS.map(risk => (
                      <SelectItem key={risk.value} value={risk.value}>
                        {risk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (€)</label>
                <Input
                  type="number"
                  placeholder="Min investment"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (€)</label>
                <Input
                  type="number"
                  placeholder="Max investment"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min ROI (%)</label>
                <Input
                  type="number"
                  placeholder="Min ROI"
                  value={minROI}
                  onChange={(e) => setMinROI(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max ROI (%)</label>
                <Input
                  type="number"
                  placeholder="Max ROI"
                  value={maxROI}
                  onChange={(e) => setMaxROI(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Showing {opportunities.length} of {total} investment opportunities
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all opportunities
            </p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Investment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {opportunities.map((opportunity) => (
              <Link key={opportunity.id} href={`/investments/${opportunity.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {opportunity.images.length > 0 ? (
                      <Image
                        src={opportunity.images[0]}
                        alt={opportunity.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
                        <DollarSign className="h-16 w-16 text-blue-400" />
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={getRiskLevelStyle(opportunity.riskLevel)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {RISK_LEVELS.find(r => r.value === opportunity.riskLevel)?.label}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant="secondary" className="bg-white/90 text-gray-700">
                        <Eye className="h-3 w-3 mr-1" />
                        {opportunity.views}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Title and Description */}
                    <div className="mb-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {opportunity.title}
                      </h3>
                      {opportunity.shortDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {opportunity.shortDescription}
                        </p>
                      )}
                      
                      {/* Location and Type */}
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {opportunity.city}, {opportunity.country}
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {INVESTMENT_TYPES.find(t => t.value === opportunity.investmentType)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES.find(c => c.value === opportunity.category)?.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Funding Progress</span>
                        <span>{Math.round(opportunity.fundingProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(opportunity.fundingProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(opportunity.raisedAmount)}</span>
                        <span>{formatCurrency(opportunity.targetAmount)}</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Expected ROI
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {opportunity.expectedRoi}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Duration
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {opportunity.investmentPeriod}mo
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {opportunity._count.investments} investors
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {opportunity.daysLeft} days left
                      </div>
                    </div>

                    {/* Minimum Investment */}
                    <div className="mt-3 text-sm text-gray-600">
                      Min. investment: <span className="font-semibold">{formatCurrency(opportunity.minimumInvestment)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}