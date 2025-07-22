'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Wallet,
  Target,
  Activity,
  Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface Investment {
  id: string;
  amount: number;
  currency: string;
  investmentDate: string;
  status: string;
  paymentStatus: string;
  currentValue?: number;
  totalReturns: number;
  unrealizedReturns: number;
  totalDistributions: number;
  lastValuationDate?: string;
  nextDistributionDate?: string;
  opportunity: {
    id: string;
    title: string;
    investmentType: string;
    category: string;
    riskLevel: string;
    expectedRoi: number;
    investmentPeriod: number;
    images: string[];
    status: string;
    creator: {
      firstName: string;
      lastName: string;
    };
  };
  distributions: Array<{
    id: string;
    amount: number;
    distributionType: string;
    distributionDate: string;
    status: string;
  }>;
  valuationHistory: Array<{
    id: string;
    valuationDate: string;
    totalValue: number;
    unrealizedGain: number;
    totalReturn: number;
  }>;
}

interface PortfolioMetrics {
  totalInvested: number;
  currentValue: number;
  totalDistributions: number;
  totalReturns: number;
  unrealizedReturns: number;
}

interface PortfolioResponse {
  investments: Investment[];
  portfolioMetrics: PortfolioMetrics;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface DetailedPortfolioMetrics {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  unrealizedGains: number;
  totalDistributions: number;
  absoluteReturn: number;
  percentageReturn: number;
  annualizedReturn: number;
  roi: number;
  numberOfInvestments: number;
  averageInvestmentSize: number;
  totalValueAtRisk: number;
  diversificationScore: number;
  riskScore: number;
}

const STATUS_STYLES = {
  'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  'CONFIRMED': { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
  'PROCESSING': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
  'COMPLETED': { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
  'CANCELLED': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
  'FAILED': { color: 'bg-red-100 text-red-800', label: 'Failed' }
};

const RISK_LEVEL_COLORS = {
  'low': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'very_high': 'bg-red-100 text-red-800'
};

export default function PortfolioDashboard() {
  const { user } = useSecureAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedPortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('investmentDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [timeframe, setTimeframe] = useState('all'); // all, ytd, 1y, 6m, 3m

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      calculateDetailedMetrics();
    }
  }, [user, statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchPortfolio = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder
      });

      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('investmentType', typeFilter);

      const response = await fetch(`/api/investments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data: PortfolioResponse = await response.json();
      setInvestments(data.investments);
      setPortfolioMetrics(data.portfolioMetrics);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDetailedMetrics = async () => {
    if (!portfolioMetrics || !investments.length) return;

    try {
      setMetricsLoading(true);
      
      // This would typically call the investment calculations API
      // For now, we'll calculate basic metrics on the frontend
      const totalInvested = portfolioMetrics.totalInvested;
      const currentValue = portfolioMetrics.currentValue;
      const totalReturns = portfolioMetrics.totalReturns;
      const unrealizedGains = portfolioMetrics.unrealizedReturns;
      const totalDistributions = portfolioMetrics.totalDistributions;
      
      const absoluteReturn = totalReturns + unrealizedGains;
      const percentageReturn = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;
      
      // Calculate average holding period for annualized return
      const avgHoldingDays = investments.reduce((sum, inv) => {
        const days = (new Date().getTime() - new Date(inv.investmentDate).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / investments.length;
      
      const avgHoldingYears = avgHoldingDays / 365.25;
      const annualizedReturn = avgHoldingYears > 0 && totalInvested > 0
        ? (Math.pow((currentValue + totalDistributions) / totalInvested, 1 / avgHoldingYears) - 1) * 100
        : 0;
      
      const roi = totalInvested > 0 ? ((currentValue + totalDistributions - totalInvested) / totalInvested) * 100 : 0;
      
      const numberOfInvestments = investments.length;
      const averageInvestmentSize = numberOfInvestments > 0 ? totalInvested / numberOfInvestments : 0;
      const totalValueAtRisk = currentValue * 0.05; // Simple 5% VaR
      
      // Calculate diversification score (simplified)
      const typeDistribution = investments.reduce((acc, inv) => {
        const type = inv.opportunity.investmentType;
        acc[type] = (acc[type] || 0) + inv.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryDistribution = investments.reduce((acc, inv) => {
        const category = inv.opportunity.category;
        acc[category] = (acc[category] || 0) + inv.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Herfindahl-Hirschman Index for diversification
      const calculateHHI = (distribution: Record<string, number>) => {
        const shares = Object.values(distribution).map(amount => amount / totalInvested);
        return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
      };
      
      const typeHHI = calculateHHI(typeDistribution);
      const categoryHHI = calculateHHI(categoryDistribution);
      const diversificationScore = ((1 - typeHHI) * 0.6 + (1 - categoryHHI) * 0.4) * 100;
      
      // Calculate weighted risk score
      const riskScores = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
      const riskScore = investments.reduce((sum, inv) => {
        const weight = inv.amount / totalInvested;
        const score = riskScores[inv.opportunity.riskLevel as keyof typeof riskScores] || 2;
        return sum + (weight * score);
      }, 0);
      
      setDetailedMetrics({
        totalInvested,
        currentValue,
        totalReturns,
        unrealizedGains,
        totalDistributions,
        absoluteReturn,
        percentageReturn,
        annualizedReturn,
        roi,
        numberOfInvestments,
        averageInvestmentSize,
        totalValueAtRisk,
        diversificationScore,
        riskScore
      });
    } catch (error) {
      console.error('Error calculating detailed metrics:', error);
    } finally {
      setMetricsLoading(false);
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getStatusStyle = (status: string) => {
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.PENDING;
  };

  const getRiskColor = (riskLevel: string) => {
    return RISK_LEVEL_COLORS[riskLevel as keyof typeof RISK_LEVEL_COLORS] || RISK_LEVEL_COLORS.medium;
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSortBy('investmentDate');
    setSortOrder('desc');
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to view your investment portfolio.</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Portfolio</h1>
            <p className="text-gray-600">
              Track your investments, monitor performance, and analyze returns
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchPortfolio()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        {portfolioMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Invested</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(portfolioMetrics.totalInvested)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Current Value</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(portfolioMetrics.currentValue)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    portfolioMetrics.totalReturns + portfolioMetrics.unrealizedReturns >= 0 
                      ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {portfolioMetrics.totalReturns + portfolioMetrics.unrealizedReturns >= 0 
                      ? <TrendingUp className="h-5 w-5 text-green-600" />
                      : <TrendingDown className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Returns</div>
                    <div className={`text-xl font-bold ${
                      portfolioMetrics.totalReturns + portfolioMetrics.unrealizedReturns >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(portfolioMetrics.totalReturns + portfolioMetrics.unrealizedReturns)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Distributions</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(portfolioMetrics.totalDistributions)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Detailed Metrics */}
          {detailedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ROI</span>
                    <span className={`font-medium ${detailedMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(detailedMetrics.roi)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Annualized Return</span>
                    <span className={`font-medium ${detailedMetrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(detailedMetrics.annualizedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Percentage Return</span>
                    <span className={`font-medium ${detailedMetrics.percentageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(detailedMetrics.percentageReturn)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Portfolio Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Number of Investments</span>
                    <span className="font-medium">{detailedMetrics.numberOfInvestments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Investment</span>
                    <span className="font-medium">{formatCurrency(detailedMetrics.averageInvestmentSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Diversification Score</span>
                    <span className="font-medium">{detailedMetrics.diversificationScore.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="font-medium">{detailedMetrics.riskScore.toFixed(1)}/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Value at Risk (5%)</span>
                    <span className="font-medium text-red-600">{formatCurrency(detailedMetrics.totalValueAtRisk)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unrealized Gains</span>
                    <span className={`font-medium ${detailedMetrics.unrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(detailedMetrics.unrealizedGains)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {investments.slice(0, 5).map((investment) => (
                <div key={investment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                      {investment.opportunity.images.length > 0 ? (
                        <Image
                          src={investment.opportunity.images[0]}
                          alt={investment.opportunity.title}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{investment.opportunity.title}</div>
                      <div className="text-sm text-gray-600">
                        Invested {formatCurrency(investment.amount)} • {new Date(investment.investmentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusStyle(investment.status).color}>
                      {getStatusStyle(investment.status).label}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="property_development">Property Development</SelectItem>
                      <SelectItem value="rental_property">Rental Property</SelectItem>
                      <SelectItem value="property_flip">Property Flip</SelectItem>
                      <SelectItem value="commercial_real_estate">Commercial Real Estate</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [sort, order] = value.split('-');
                    setSortBy(sort);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investmentDate-desc">Newest First</SelectItem>
                      <SelectItem value="investmentDate-asc">Oldest First</SelectItem>
                      <SelectItem value="amount-desc">Highest Amount</SelectItem>
                      <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(statusFilter || typeFilter) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Investments List */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded mb-2 w-1/3" />
                          <div className="h-4 bg-gray-200 rounded mb-1 w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                        <div className="text-right">
                          <div className="h-5 bg-gray-200 rounded mb-2 w-20" />
                          <div className="h-4 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : investments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Wallet className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start building your portfolio by exploring investment opportunities
                  </p>
                  <Link href="/investments">
                    <Button>Browse Investments</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              investments.map((investment) => (
                <Card key={investment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {investment.opportunity.images.length > 0 ? (
                          <Image
                            src={investment.opportunity.images[0]}
                            alt={investment.opportunity.title}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Investment Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <Link 
                            href={`/investments/${investment.opportunity.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {investment.opportunity.title}
                          </Link>
                          <div className="flex gap-2 ml-4">
                            <Badge className={getStatusStyle(investment.status).color}>
                              {getStatusStyle(investment.status).label}
                            </Badge>
                            <Badge className={getRiskColor(investment.opportunity.riskLevel)}>
                              {investment.opportunity.riskLevel.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Invested:</span>
                            <div className="font-medium">{formatCurrency(investment.amount)}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600">Current Value:</span>
                            <div className="font-medium">
                              {investment.currentValue 
                                ? formatCurrency(investment.currentValue)
                                : formatCurrency(investment.amount)
                              }
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600">Returns:</span>
                            <div className={`font-medium ${
                              investment.totalReturns + investment.unrealizedReturns >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(investment.totalReturns + investment.unrealizedReturns)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600">Investment Date:</span>
                            <div className="font-medium">
                              {new Date(investment.investmentDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Progress indicators */}
                        {investment.nextDistributionDate && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm">
                            <span className="text-blue-800">
                              Next distribution: {new Date(investment.nextDistributionDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Detailed portfolio analytics and performance charts coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6">
          {/* Distributions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Income Distributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investments.some(inv => inv.distributions.length > 0) ? (
                <div className="space-y-4">
                  {investments
                    .filter(inv => inv.distributions.length > 0)
                    .map(investment => 
                      investment.distributions.map(distribution => (
                        <div key={distribution.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{investment.opportunity.title}</div>
                              <div className="text-sm text-gray-600">
                                {distribution.distributionType.replace('_', ' ')} • {new Date(distribution.distributionDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">+{formatCurrency(distribution.amount)}</div>
                            <Badge className={getStatusStyle(distribution.status).color}>
                              {getStatusStyle(distribution.status).label}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Distributions Yet</h3>
                  <p className="text-gray-600">
                    You haven't received any distributions from your investments yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}