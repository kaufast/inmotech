'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Euro,
  Home,
  MapPin,
  Calendar,
  Zap,
  CheckCircle,
  XCircle,
  Info,
  Target,
  PieChart,
  BarChart3,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { PropertyData, PropertyValuation, valuateProperty } from '@/lib/property-valuation';

interface PropertyValuationProps {
  property: PropertyData;
  showDetailed?: boolean;
  className?: string;
}

interface ValuationDisplay extends PropertyValuation {
  isLoading: boolean;
  error: string | null;
}

export default function PropertyValuationComponent({ 
  property, 
  showDetailed = false,
  className = ''
}: PropertyValuationProps) {
  const [valuation, setValuation] = useState<ValuationDisplay>({
    estimatedValue: 0,
    confidence: 0,
    pricePerSqm: 0,
    marketPosition: 'average',
    methodology: [],
    comparables: [],
    marketTrends: {
      area: '',
      priceChange1Year: 0,
      priceChange3Year: 0,
      averageDaysOnMarket: 0,
      inventoryLevels: 'normal',
      demandLevel: 'moderate',
      priceDirection: 'stable',
      seasonality: {
        bestMonthsToBuy: [],
        bestMonthsToSell: [],
        currentSeasonMultiplier: 1
      }
    },
    investmentMetrics: {},
    risks: [],
    recommendations: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const performValuation = async () => {
      setValuation(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await valuateProperty(property);
        setValuation({
          ...result,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setValuation(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Valuation failed'
        }));
      }
    };

    performValuation();
  }, [property]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'below': return 'text-green-600 bg-green-50';
      case 'above': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriceDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (valuation.isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Property Valuation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (valuation.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Valuation Unavailable</h3>
          <p className="text-gray-600">{valuation.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Valuation Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Property Valuation</CardTitle>
            </div>
            <Badge className={`px-3 py-1 ${getConfidenceColor(valuation.confidence)}`}>
              {valuation.confidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estimated Value */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Estimated Market Value</h3>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(valuation.estimatedValue)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatCurrency(valuation.pricePerSqm)}/m² • {property.totalArea}m²
            </div>
          </div>

          {/* Market Position */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Market Position</h4>
              <p className="text-sm text-gray-600">Compared to local properties</p>
            </div>
            <Badge className={`px-3 py-1 ${getMarketPositionColor(valuation.marketPosition)}`}>
              {valuation.marketPosition === 'below' ? 'Below Market' :
               valuation.marketPosition === 'above' ? 'Above Market' : 'Market Average'}
            </Badge>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getPriceDirectionIcon(valuation.marketTrends.priceDirection)}
                <span className="text-sm font-medium">Price Trend</span>
              </div>
              <div className="text-lg font-semibold">
                {valuation.marketTrends.priceChange1Year > 0 ? '+' : ''}{valuation.marketTrends.priceChange1Year.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Last 12 months</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Market Time</span>
              </div>
              <div className="text-lg font-semibold">
                {valuation.marketTrends.averageDaysOnMarket} days
              </div>
              <div className="text-xs text-gray-500">Average listing</div>
            </div>
          </div>

          {/* Investment Metrics */}
          {valuation.investmentMetrics.netRentalYield && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Investment Potential</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Rental Yield:</span>
                  <span className="font-semibold ml-2">{valuation.investmentMetrics.netRentalYield.toFixed(1)}%</span>
                </div>
                {valuation.investmentMetrics.roi && (
                  <div>
                    <span className="text-green-700">ROI:</span>
                    <span className="font-semibold ml-2">{valuation.investmentMetrics.roi.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          {valuation.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Key Recommendations
              </h4>
              <div className="space-y-2">
                {valuation.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-900">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis - Only if requested */}
      {showDetailed && (
        <>
          {/* Valuation Methodology */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Valuation Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {valuation.methodology.map((method, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{method.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{method.weight}%</span>
                        <Badge variant="secondary" className="text-xs">
                          {method.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{method.description}</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(method.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Price Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">1 Year Change</span>
                      <span className={`font-semibold ${
                        valuation.marketTrends.priceChange1Year >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {valuation.marketTrends.priceChange1Year > 0 ? '+' : ''}{valuation.marketTrends.priceChange1Year.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">3 Year Change</span>
                      <span className={`font-semibold ${
                        valuation.marketTrends.priceChange3Year >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {valuation.marketTrends.priceChange3Year > 0 ? '+' : ''}{valuation.marketTrends.priceChange3Year.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Market Conditions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Inventory Level</span>
                      <Badge variant="secondary" className="capitalize">
                        {valuation.marketTrends.inventoryLevels}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Demand Level</span>
                      <Badge variant="secondary" className="capitalize">
                        {valuation.marketTrends.demandLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          {valuation.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {valuation.risks.map((risk, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskLevelColor(risk.level)}>
                            {risk.level} risk
                          </Badge>
                          <span className="text-sm font-medium capitalize">{risk.type}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {risk.impact > 0 ? '+' : ''}{risk.impact}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Recommendations */}
          {valuation.recommendations.length > 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  All Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {valuation.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparables */}
          {valuation.comparables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Comparable Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {valuation.comparables.slice(0, 3).map((comp, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{comp.address}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{comp.bedrooms || 0} bed • {comp.bathrooms || 0} bath</span>
                            <span>{Math.round(comp.totalArea)}m²</span>
                            <span>{Math.round(comp.distance)}m away</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(comp.soldPrice)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(comp.soldDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {comp.adjustments.total !== 0 && (
                        <div className="text-xs text-gray-600 pt-2 border-t">
                          Adjusted: {formatCurrency(comp.adjustedPrice)} 
                          ({comp.adjustments.total > 0 ? '+' : ''}{comp.adjustments.total.toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}