'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  MapPin,
  Euro,
  Home,
  Calendar,
  Users,
  Eye,
  Activity,
  Target,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Building,
  Building2,
  Warehouse
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PropertyAnalytics {
  overview: {
    totalProperties: number;
    totalValue: number;
    averagePrice: number;
    averagePricePerSqm: number;
    totalViews: number;
    totalInquiries: number;
    conversionRate: number;
    averageDaysOnMarket: number;
  };
  priceAnalytics: {
    priceDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    priceByType: Array<{
      type: string;
      averagePrice: number;
      medianPrice: number;
      count: number;
    }>;
    priceByLocation: Array<{
      city: string;
      averagePrice: number;
      pricePerSqm: number;
      count: number;
      trend: number;
    }>;
    priceTrends: Array<{
      month: string;
      averagePrice: number;
      medianPrice: number;
      transactions: number;
    }>;
  };
  marketAnalytics: {
    propertyTypeDistribution: Array<{
      type: string;
      count: number;
      value: number;
      percentage: number;
    }>;
    listingTypeDistribution: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    statusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    sizeDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
  performanceAnalytics: {
    viewsPerProperty: Array<{
      month: string;
      averageViews: number;
      totalViews: number;
    }>;
    inquiryRates: Array<{
      month: string;
      inquiries: number;
      properties: number;
      rate: number;
    }>;
    timeOnMarket: Array<{
      type: string;
      averageDays: number;
      medianDays: number;
    }>;
    topPerformers: Array<{
      id: string;
      title: string;
      views: number;
      inquiries: number;
      price: number;
      type: string;
    }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function PropertyAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('12_months');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, cityFilter, typeFilter]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateRange,
        ...(cityFilter !== 'all' && { city: cityFilter }),
        ...(typeFilter !== 'all' && { propertyType: typeFilter })
      });

      const response = await fetch(`/api/analytics/properties?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Analytics</h1>
          <Button onClick={loadAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your property portfolio</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="3_months">Last 3 Months</option>
              <option value="6_months">Last 6 Months</option>
              <option value="12_months">Last 12 Months</option>
              <option value="all_time">All Time</option>
            </select>
            
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities</option>
              <option value="Madrid">Madrid</option>
              <option value="Barcelona">Barcelona</option>
              <option value="Valencia">Valencia</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartments</option>
              <option value="house">Houses</option>
              <option value="commercial">Commercial</option>
            </select>
            
            <Button variant="outline" onClick={loadAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(analytics.overview.totalProperties)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(analytics.overview.totalValue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Price per m²</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(analytics.overview.averagePricePerSqm)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPercent(analytics.overview.conversionRate)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.priceAnalytics.priceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Price']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averagePrice" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Average Price"
                      dot={{ fill: '#3B82F6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="medianPrice" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Median Price"
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Price Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Price Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.priceAnalytics.priceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'count') return [value, 'Properties'];
                        return [formatPercent(value), 'Percentage'];
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Property Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.marketAnalytics.propertyTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} ${formatPercent(percentage)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.marketAnalytics.propertyTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Properties']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Listing Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Listing Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.marketAnalytics.listingTypeDistribution.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium capitalize">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.count}</div>
                      <div className="text-sm text-gray-500">{formatPercent(item.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Size Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Size Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.marketAnalytics.sizeDistribution.map((item, index) => (
                  <div key={item.range} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.range}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.count}</div>
                      <div className="text-sm text-gray-500">{formatPercent(item.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Price by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.priceAnalytics.priceByLocation.map((location) => (
                <div key={location.city} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{location.city}</h3>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(location.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(location.trend)}`}>
                        {formatPercent(Math.abs(location.trend))}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. Price:</span>
                      <span className="font-medium">{formatCurrency(location.averagePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/m²:</span>
                      <span className="font-medium">{formatCurrency(location.pricePerSqm)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Properties:</span>
                      <span className="font-medium">{location.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views and Inquiries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Views & Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.performanceAnalytics.viewsPerProperty}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="totalViews" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Total Views"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="averageViews" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                      name="Avg Views/Property"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Performing Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.performanceAnalytics.topPerformers.slice(0, 5).map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium truncate max-w-48">{property.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{property.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(property.price)}</div>
                      <div className="text-sm text-gray-600">
                        {property.views} views • {property.inquiries} inquiries
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time on Market */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Average Time on Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.performanceAnalytics.timeOnMarket} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${value} days`} />
                  <YAxis dataKey="type" type="category" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} days`, name === 'averageDays' ? 'Average' : 'Median']}
                  />
                  <Legend />
                  <Bar dataKey="averageDays" fill="#3B82F6" name="Average Days" />
                  <Bar dataKey="medianDays" fill="#10B981" name="Median Days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}