'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Shield,
  FileText,
  Building,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Heart,
  AlertTriangle,
  CheckCircle,
  User
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface InvestmentOpportunity {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  investmentType: string;
  category: string;
  riskLevel: string;
  targetAmount: number;
  raisedAmount: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  expectedRoi: number;
  expectedAnnualReturn?: number;
  projectedRentalYield?: number;
  investmentPeriod: number;
  city: string;
  country: string;
  address?: string;
  propertyType?: string;
  totalArea?: number;
  numberOfUnits?: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  documents: string[];
  businessPlan?: string;
  financialProjections?: any;
  fundingStartDate: string;
  fundingEndDate: string;
  expectedStartDate?: string;
  expectedCompletionDate?: string;
  status: string;
  views: number;
  totalInvestors: number;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  fundManager?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  investments: Array<{
    id: string;
    amount: number;
    investmentDate: string;
    investor: {
      firstName: string;
      lastName: string;
    };
  }>;
  opportunityUpdates: Array<{
    id: string;
    title: string;
    content: string;
    updateType: string;
    priority: string;
    publishedAt: string;
    author: {
      firstName: string;
      lastName: string;
    };
  }>;
  fundingProgress: number;
  daysLeft: number;
  uniqueInvestors: number;
  averageInvestment: number;
}

interface ROIProjection {
  timeHorizonMonths: number;
  projectedValue: number;
  projectedReturns: number;
  projectedROI: number;
  annualizedReturn: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
}

const RISK_LEVELS = [
  { value: 'low', label: 'Low Risk', color: 'bg-green-100 text-green-800', description: 'Conservative investment with stable returns' },
  { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800', description: 'Balanced risk-return profile' },
  { value: 'high', label: 'High Risk', color: 'bg-orange-100 text-orange-800', description: 'Higher returns with increased volatility' },
  { value: 'very_high', label: 'Very High Risk', color: 'bg-red-100 text-red-800', description: 'Maximum returns with significant risk' }
];

const INVESTMENT_TYPES = [
  { value: 'property_development', label: 'Property Development' },
  { value: 'rental_property', label: 'Rental Property' },
  { value: 'property_flip', label: 'Property Flip' },
  { value: 'commercial_real_estate', label: 'Commercial Real Estate' },
  { value: 'land_development', label: 'Land Development' }
];

const UPDATE_TYPES = [
  { value: 'progress', label: 'Progress Update', icon: CheckCircle },
  { value: 'financial', label: 'Financial Update', icon: DollarSign },
  { value: 'milestone', label: 'Milestone', icon: Calendar },
  { value: 'news', label: 'News', icon: FileText },
  { value: 'risk', label: 'Risk Alert', icon: AlertTriangle }
];

export default function InvestmentOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSecureAuth();
  
  const [opportunity, setOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [roiProjections, setRoiProjections] = useState<ROIProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const opportunityId = params?.opportunityId as string;

  useEffect(() => {
    fetchOpportunityDetails();
  }, [opportunityId]);

  useEffect(() => {
    if (opportunity) {
      calculateROIProjections();
    }
  }, [opportunity, investmentAmount]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/investment-opportunities/${opportunityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch investment opportunity');
      }

      const data: InvestmentOpportunity = await response.json();
      setOpportunity(data);
    } catch (error) {
      console.error('Error fetching investment opportunity:', error);
      router.push('/investments');
    } finally {
      setLoading(false);
    }
  };

  const calculateROIProjections = async () => {
    if (!opportunity || !investmentAmount || parseFloat(investmentAmount) <= 0) {
      setRoiProjections([]);
      return;
    }

    try {
      // This would typically call the ROI calculation API or utility
      const amount = parseFloat(investmentAmount);
      const projections: ROIProjection[] = [];
      
      // Calculate projections for 6, 12, 24, 36 months and full period
      const timeHorizons = [6, 12, 24, 36, opportunity.investmentPeriod];
      
      timeHorizons.forEach(months => {
        if (months <= opportunity.investmentPeriod) {
          const yearsElapsed = months / 12;
          const projectedAnnualReturn = opportunity.expectedRoi / 100;
          
          const projectedValue = amount * Math.pow(1 + projectedAnnualReturn, yearsElapsed);
          const projectedReturns = projectedValue - amount;
          const projectedROI = (projectedReturns / amount) * 100;
          const annualizedReturn = yearsElapsed > 0 ? (Math.pow(projectedValue / amount, 1 / yearsElapsed) - 1) * 100 : 0;
          
          // Simple confidence intervals based on risk level
          const riskMultipliers = {
            'low': 0.1,
            'medium': 0.2,
            'high': 0.3,
            'very_high': 0.5
          };
          
          const riskMultiplier = riskMultipliers[opportunity.riskLevel as keyof typeof riskMultipliers] || 0.2;
          const lowEstimate = projectedValue * (1 - riskMultiplier);
          const highEstimate = projectedValue * (1 + riskMultiplier);
          
          projections.push({
            timeHorizonMonths: months,
            projectedValue,
            projectedReturns,
            projectedROI,
            annualizedReturn,
            confidenceInterval: {
              low: lowEstimate,
              high: highEstimate
            }
          });
        }
      });
      
      setRoiProjections(projections);
    } catch (error) {
      console.error('Error calculating ROI projections:', error);
    }
  };

  const handleInvestment = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!investmentAmount || !paymentMethod) {
      alert('Please enter investment amount and select payment method');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < opportunity!.minimumInvestment) {
      alert(`Minimum investment is €${opportunity!.minimumInvestment}`);
      return;
    }

    if (opportunity!.maximumInvestment && amount > opportunity!.maximumInvestment) {
      alert(`Maximum investment is €${opportunity!.maximumInvestment}`);
      return;
    }

    try {
      setIsInvesting(true);
      
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId,
          amount,
          paymentMethod
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create investment');
      }

      const result = await response.json();
      alert('Investment created successfully! You will be redirected to complete payment.');
      
      // Refresh opportunity data
      fetchOpportunityDetails();
      
      // TODO: Redirect to payment processing
      // For now, just show success message
      
    } catch (error) {
      console.error('Error creating investment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create investment');
    } finally {
      setIsInvesting(false);
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

  const getRiskLevelInfo = (risk: string) => {
    return RISK_LEVELS.find(r => r.value === risk) || RISK_LEVELS[1];
  };

  const nextImage = () => {
    if (opportunity && opportunity.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === opportunity.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (opportunity && opportunity.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? opportunity.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
          <div className="h-64 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded" />
              <div className="h-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Investment Opportunity Not Found</h1>
            <p className="text-gray-600 mb-6">The investment opportunity you're looking for doesn't exist or has been removed.</p>
            <Link href="/investments">
              <Button>Browse Investment Opportunities</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskInfo = getRiskLevelInfo(opportunity.riskLevel);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/investments">
          <Button variant="ghost" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Investments
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{opportunity.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {opportunity.city}, {opportunity.country}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {opportunity.daysLeft} days left
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {opportunity.uniqueInvestors} investors
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge className={riskInfo.color}>
                <Shield className="h-3 w-3 mr-1" />
                {riskInfo.label}
              </Badge>
              <Badge variant="outline">
                {INVESTMENT_TYPES.find(t => t.value === opportunity.investmentType)?.label}
              </Badge>
              <Badge variant="outline">
                {opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{opportunity.expectedRoi}%</div>
              <div className="text-sm text-gray-600">Expected ROI</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(opportunity.targetAmount)}</div>
              <div className="text-sm text-gray-600">Target Amount</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{opportunity.investmentPeriod}</div>
              <div className="text-sm text-gray-600">Months</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Gauge className="h-6 w-6 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{Math.round(opportunity.fundingProgress)}%</div>
              <div className="text-sm text-gray-600">Funded</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          {opportunity.images.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-0">
                <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={opportunity.images[currentImageIndex]}
                    alt={`${opportunity.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {opportunity.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={previousImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        {opportunity.images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/60'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="investors">Investors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Investment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6">
                    {opportunity.description || opportunity.shortDescription || 'No description available.'}
                  </p>
                  
                  {/* Property Details */}
                  {(opportunity.propertyType || opportunity.totalArea || opportunity.numberOfUnits) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {opportunity.propertyType && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Property Type</div>
                          <div className="text-lg text-gray-900 capitalize">{opportunity.propertyType.replace('_', ' ')}</div>
                        </div>
                      )}
                      
                      {opportunity.totalArea && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Total Area</div>
                          <div className="text-lg text-gray-900">{opportunity.totalArea} m²</div>
                        </div>
                      )}
                      
                      {opportunity.numberOfUnits && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Number of Units</div>
                          <div className="text-lg text-gray-900">{opportunity.numberOfUnits}</div>
                        </div>
                      )}
                      
                      {opportunity.bedrooms && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Bedrooms</div>
                          <div className="text-lg text-gray-900">{opportunity.bedrooms}</div>
                        </div>
                      )}
                      
                      {opportunity.bathrooms && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Bathrooms</div>
                          <div className="text-lg text-gray-900">{opportunity.bathrooms}</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Badge className={riskInfo.color}>
                      {riskInfo.label}
                    </Badge>
                    <div>
                      <p className="text-gray-700">{riskInfo.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Investment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Funding Period</span>
                      <span className="text-sm text-gray-900">
                        {new Date(opportunity.fundingStartDate).toLocaleDateString()} - {new Date(opportunity.fundingEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {opportunity.expectedStartDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Expected Start</span>
                        <span className="text-sm text-gray-900">
                          {new Date(opportunity.expectedStartDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {opportunity.expectedCompletionDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Expected Completion</span>
                        <span className="text-sm text-gray-900">
                          {new Date(opportunity.expectedCompletionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financials" className="space-y-6">
              {/* Financial Projections */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Expected ROI</div>
                      <div className="text-2xl font-bold text-green-600">{opportunity.expectedRoi}%</div>
                    </div>
                    
                    {opportunity.expectedAnnualReturn && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Annual Return</div>
                        <div className="text-2xl font-bold text-green-600">{opportunity.expectedAnnualReturn}%</div>
                      </div>
                    )}
                    
                    {opportunity.projectedRentalYield && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Rental Yield</div>
                        <div className="text-2xl font-bold text-blue-600">{opportunity.projectedRentalYield}%</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ROI Projections */}
              {roiProjections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Projected Returns for €{investmentAmount || '0'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-3 text-left">Time Period</th>
                            <th className="border border-gray-300 p-3 text-left">Projected Value</th>
                            <th className="border border-gray-300 p-3 text-left">Returns</th>
                            <th className="border border-gray-300 p-3 text-left">ROI</th>
                            <th className="border border-gray-300 p-3 text-left">Annual Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roiProjections.map((projection) => (
                            <tr key={projection.timeHorizonMonths}>
                              <td className="border border-gray-300 p-3">{projection.timeHorizonMonths} months</td>
                              <td className="border border-gray-300 p-3">{formatCurrency(projection.projectedValue)}</td>
                              <td className="border border-gray-300 p-3 text-green-600">+{formatCurrency(projection.projectedReturns)}</td>
                              <td className="border border-gray-300 p-3 text-green-600">{projection.projectedROI.toFixed(2)}%</td>
                              <td className="border border-gray-300 p-3">{projection.annualizedReturn.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {opportunity.documents.length > 0 ? (
                    <div className="space-y-3">
                      {opportunity.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="text-sm text-gray-900">{doc}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No documents available.</p>
                  )}
                  
                  {opportunity.businessPlan && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Business Plan</h4>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                        <Download className="h-4 w-4 mr-1" />
                        Download Business Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="updates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  {opportunity.opportunityUpdates.length > 0 ? (
                    <div className="space-y-4">
                      {opportunity.opportunityUpdates.map((update) => {
                        const UpdateIcon = UPDATE_TYPES.find(t => t.value === update.updateType)?.icon || FileText;
                        return (
                          <div key={update.id} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <UpdateIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900">{update.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {UPDATE_TYPES.find(t => t.value === update.updateType)?.label}
                                  </Badge>
                                  {update.priority === 'high' || update.priority === 'urgent' ? (
                                    <Badge variant="destructive" className="text-xs">
                                      {update.priority}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  By {update.author.firstName} {update.author.lastName} • {new Date(update.publishedAt).toLocaleDateString()}
                                </div>
                                <p className="text-sm text-gray-700">{update.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No updates available yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="investors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Investors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {opportunity.investments.length > 0 ? (
                    <div className="space-y-3">
                      {opportunity.investments.map((investment) => (
                        <div key={investment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {investment.investor.firstName} {investment.investor.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(investment.investmentDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(investment.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No investors yet. Be the first to invest!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investment Form */}
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Invest in this Opportunity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funding Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Funding Progress</span>
                  <span>{Math.round(opportunity.fundingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(opportunity.fundingProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(opportunity.raisedAmount)}</span>
                  <span>{formatCurrency(opportunity.targetAmount)}</span>
                </div>
              </div>

              {/* Investment Amount */}
              <div>
                <Label htmlFor="investment-amount">Investment Amount (€)</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={opportunity.minimumInvestment}
                  max={opportunity.maximumInvestment || undefined}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Min: {formatCurrency(opportunity.minimumInvestment)}
                  {opportunity.maximumInvestment && ` • Max: ${formatCurrency(opportunity.maximumInvestment)}`}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invest Button */}
              <Button 
                className="w-full" 
                onClick={handleInvestment}
                disabled={isInvesting || !investmentAmount || !paymentMethod}
              >
                {isInvesting ? 'Processing...' : 'Invest Now'}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                By investing, you agree to our terms and conditions
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Creator</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {opportunity.creator.firstName} {opportunity.creator.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{opportunity.creator.email}</div>
                  </div>
                </div>
              </div>

              {opportunity.fundManager && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Fund Manager</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {opportunity.fundManager.firstName} {opportunity.fundManager.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{opportunity.fundManager.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Investors</span>
                <span className="font-medium">{opportunity.uniqueInvestors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Investment</span>
                <span className="font-medium">{formatCurrency(opportunity.averageInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Views</span>
                <span className="font-medium">{opportunity.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className="font-medium">{opportunity.daysLeft}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}