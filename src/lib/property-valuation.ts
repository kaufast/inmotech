// Property valuation algorithms and market analysis tools

export interface PropertyValuation {
  estimatedValue: number;
  confidence: number; // 0-100
  pricePerSqm: number;
  marketPosition: 'below' | 'average' | 'above'; // compared to local market
  methodology: ValuationMethod[];
  comparables: ComparableProperty[];
  marketTrends: MarketTrend;
  investmentMetrics: InvestmentMetrics;
  risks: RiskFactor[];
  recommendations: string[];
}

export interface ValuationMethod {
  name: string;
  weight: number; // percentage weight in final valuation
  value: number;
  confidence: number;
  description: string;
}

export interface ComparableProperty {
  id: string;
  address: string;
  distance: number; // in meters
  soldPrice: number;
  soldDate: string;
  adjustedPrice: number; // adjusted for differences
  bedrooms?: number;
  bathrooms?: number;
  totalArea: number;
  propertyType: string;
  adjustments: {
    location: number;
    size: number;
    age: number;
    condition: number;
    features: number;
    total: number;
  };
}

export interface MarketTrend {
  area: string;
  priceChange1Year: number; // percentage
  priceChange3Year: number; // percentage
  averageDaysOnMarket: number;
  inventoryLevels: 'low' | 'normal' | 'high';
  demandLevel: 'low' | 'moderate' | 'high';
  priceDirection: 'declining' | 'stable' | 'rising';
  seasonality: SeasonalityData;
}

export interface SeasonalityData {
  bestMonthsToBuy: number[]; // month numbers 1-12
  bestMonthsToSell: number[];
  currentSeasonMultiplier: number; // 0.8-1.2
}

export interface InvestmentMetrics {
  capRate?: number; // for investment properties
  grossRentalYield?: number;
  netRentalYield?: number;
  cashFlow?: number;
  roi?: number;
  paybackPeriod?: number; // years
  totalReturn5Year?: number;
}

export interface RiskFactor {
  type: 'market' | 'property' | 'location' | 'economic';
  level: 'low' | 'medium' | 'high';
  description: string;
  impact: number; // -10 to +10 percentage impact on value
}

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea: number;
  yearBuilt?: number;
  condition?: string;
  features?: Record<string, boolean>;
  listingPrice?: number;
  rentPrice?: number;
  energyRating?: string;
}

/**
 * Main property valuation function using multiple methodologies
 */
export async function valuateProperty(property: PropertyData): Promise<PropertyValuation> {
  // Get market data and comparables
  const comparables = await findComparableProperties(property);
  const marketTrends = await getMarketTrends(property.city);
  
  // Apply different valuation methods
  const methods: ValuationMethod[] = [];
  
  // 1. Comparative Market Analysis (CMA) - 40% weight
  if (comparables.length >= 3) {
    const cmaValue = calculateCMAValue(property, comparables);
    methods.push({
      name: 'Comparative Market Analysis',
      weight: 40,
      value: cmaValue.value,
      confidence: cmaValue.confidence,
      description: `Based on ${comparables.length} comparable sales within 1km`
    });
  }
  
  // 2. Price per Square Meter Analysis - 30% weight
  const psmValue = calculatePricePerSqmValue(property, comparables, marketTrends);
  methods.push({
    name: 'Price per Square Meter',
    weight: 30,
    value: psmValue.value,
    confidence: psmValue.confidence,
    description: 'Market average adjusted for property characteristics'
  });
  
  // 3. Cost Approach - 20% weight (for newer properties)
  if (property.yearBuilt && property.yearBuilt > 2000) {
    const costValue = calculateCostValue(property);
    methods.push({
      name: 'Cost Approach',
      weight: 20,
      value: costValue.value,
      confidence: costValue.confidence,
      description: 'Replacement cost minus depreciation'
    });
  }
  
  // 4. Income Approach - 10% weight (if rental data available)
  if (property.rentPrice) {
    const incomeValue = calculateIncomeValue(property);
    methods.push({
      name: 'Income Approach',
      weight: 10,
      value: incomeValue.value,
      confidence: incomeValue.confidence,
      description: 'Present value of expected rental income'
    });
  }
  
  // Calculate weighted average
  const totalWeight = methods.reduce((sum, method) => sum + method.weight, 0);
  const estimatedValue = methods.reduce((sum, method) => 
    sum + (method.value * method.weight / totalWeight), 0
  );
  
  // Calculate overall confidence
  const confidence = methods.reduce((sum, method) => 
    sum + (method.confidence * method.weight / totalWeight), 0
  );
  
  // Calculate price per square meter
  const pricePerSqm = estimatedValue / property.totalArea;
  
  // Determine market position
  const localMedianPricePerSqm = calculateLocalMedianPrice(comparables);
  const marketPosition = pricePerSqm < localMedianPricePerSqm * 0.9 ? 'below' :
                        pricePerSqm > localMedianPricePerSqm * 1.1 ? 'above' : 'average';
  
  // Calculate investment metrics
  const investmentMetrics = calculateInvestmentMetrics(property, estimatedValue);
  
  // Assess risks
  const risks = assessRisks(property, marketTrends, comparables);
  
  // Generate recommendations
  const recommendations = generateRecommendations(property, marketTrends, investmentMetrics, risks);
  
  return {
    estimatedValue: Math.round(estimatedValue),
    confidence: Math.round(confidence),
    pricePerSqm: Math.round(pricePerSqm),
    marketPosition,
    methodology: methods,
    comparables,
    marketTrends,
    investmentMetrics,
    risks,
    recommendations
  };
}

/**
 * Find comparable properties within radius
 */
async function findComparableProperties(property: PropertyData): Promise<ComparableProperty[]> {
  // This would typically query a database of recent sales
  // For now, return mock data based on the property
  
  const basePrice = property.totalArea * getAreaBasePriceByCity(property.city);
  const mockComparables: ComparableProperty[] = [];
  
  for (let i = 0; i < 5; i++) {
    const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
    const soldPrice = basePrice * (1 + variance);
    const distance = Math.random() * 800 + 100; // 100-900m
    const ageDays = Math.random() * 365 + 30; // 30-395 days ago
    
    mockComparables.push({
      id: `comp_${i + 1}`,
      address: `${property.address} nearby ${i + 1}`,
      distance,
      soldPrice,
      soldDate: new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString(),
      adjustedPrice: soldPrice,
      bedrooms: property.bedrooms ? property.bedrooms + (Math.random() > 0.5 ? 1 : -1) : undefined,
      bathrooms: property.bathrooms,
      totalArea: property.totalArea * (0.8 + Math.random() * 0.4), // ±20% size variance
      propertyType: property.propertyType,
      adjustments: {
        location: Math.round((Math.random() - 0.5) * 10),
        size: Math.round((Math.random() - 0.5) * 15),
        age: Math.round((Math.random() - 0.5) * 8),
        condition: Math.round((Math.random() - 0.5) * 12),
        features: Math.round((Math.random() - 0.5) * 6),
        total: 0
      }
    });
  }
  
  // Calculate total adjustments
  mockComparables.forEach(comp => {
    comp.adjustments.total = Object.values(comp.adjustments).reduce((sum, adj) => sum + adj, 0) - comp.adjustments.total;
    comp.adjustedPrice = comp.soldPrice * (1 + comp.adjustments.total / 100);
  });
  
  return mockComparables.sort((a, b) => a.distance - b.distance);
}

/**
 * Get market trends for the area
 */
async function getMarketTrends(city: string): Promise<MarketTrend> {
  // Mock market trends data
  const trends: Record<string, Partial<MarketTrend>> = {
    'Madrid': {
      priceChange1Year: 8.5,
      priceChange3Year: 25.3,
      averageDaysOnMarket: 45,
      inventoryLevels: 'normal',
      demandLevel: 'high'
    },
    'Barcelona': {
      priceChange1Year: 6.2,
      priceChange3Year: 22.1,
      averageDaysOnMarket: 38,
      inventoryLevels: 'low',
      demandLevel: 'high'
    }
  };
  
  const cityTrends = trends[city] || trends['Madrid'];
  const currentMonth = new Date().getMonth() + 1;
  
  return {
    area: city,
    priceChange1Year: cityTrends.priceChange1Year || 5.0,
    priceChange3Year: cityTrends.priceChange3Year || 18.0,
    averageDaysOnMarket: cityTrends.averageDaysOnMarket || 50,
    inventoryLevels: cityTrends.inventoryLevels || 'normal',
    demandLevel: cityTrends.demandLevel || 'moderate',
    priceDirection: (cityTrends.priceChange1Year || 0) > 3 ? 'rising' : 
                   (cityTrends.priceChange1Year || 0) < -2 ? 'declining' : 'stable',
    seasonality: {
      bestMonthsToBuy: [1, 2, 7, 8], // Winter and summer
      bestMonthsToSell: [4, 5, 9, 10], // Spring and fall
      currentSeasonMultiplier: [4, 5, 9, 10].includes(currentMonth) ? 1.05 : 
                              [1, 2, 7, 8].includes(currentMonth) ? 0.95 : 1.0
    }
  };
}

/**
 * Calculate CMA value based on comparables
 */
function calculateCMAValue(property: PropertyData, comparables: ComparableProperty[]) {
  const adjustedValues = comparables.map(comp => comp.adjustedPrice);
  const averageValue = adjustedValues.reduce((sum, val) => sum + val, 0) / adjustedValues.length;
  
  // Calculate confidence based on consistency of comparables
  const variance = adjustedValues.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / adjustedValues.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / averageValue;
  
  const confidence = Math.max(60, 95 - (coefficientOfVariation * 100));
  
  return {
    value: averageValue,
    confidence
  };
}

/**
 * Calculate value based on price per square meter
 */
function calculatePricePerSqmValue(property: PropertyData, comparables: ComparableProperty[], trends: MarketTrend) {
  const basePricePerSqm = getAreaBasePriceByCity(property.city);
  
  // Adjust for market trends
  const trendAdjustedPrice = basePricePerSqm * (1 + trends.priceChange1Year / 100 / 2);
  
  // Adjust for property characteristics
  let adjustmentFactor = 1.0;
  
  // Property type adjustments
  const typeAdjustments: Record<string, number> = {
    'apartment': 1.0,
    'house': 1.15,
    'commercial': 0.9,
    'warehouse': 0.7,
    'land': 0.5
  };
  adjustmentFactor *= typeAdjustments[property.propertyType] || 1.0;
  
  // Age adjustments
  if (property.yearBuilt) {
    const age = new Date().getFullYear() - property.yearBuilt;
    if (age <= 5) adjustmentFactor *= 1.1;
    else if (age <= 15) adjustmentFactor *= 1.05;
    else if (age <= 30) adjustmentFactor *= 1.0;
    else adjustmentFactor *= 0.9;
  }
  
  // Size adjustments (larger properties often have lower per-sqm prices)
  if (property.totalArea > 150) adjustmentFactor *= 0.95;
  else if (property.totalArea < 50) adjustmentFactor *= 1.05;
  
  const finalPricePerSqm = trendAdjustedPrice * adjustmentFactor;
  const value = finalPricePerSqm * property.totalArea;
  
  return {
    value,
    confidence: 75
  };
}

/**
 * Calculate cost approach value
 */
function calculateCostValue(property: PropertyData) {
  const constructionCostPerSqm = getConstructionCostByType(property.propertyType);
  const landValuePerSqm = getAreaBasePriceByCity(property.city) * 0.3; // Land typically 30% of total
  
  const constructionCost = constructionCostPerSqm * property.totalArea;
  const landValue = landValuePerSqm * property.totalArea;
  
  // Apply depreciation
  const age = property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : 20;
  const depreciationRate = Math.min(age * 0.02, 0.5); // Max 50% depreciation
  const depreciatedValue = constructionCost * (1 - depreciationRate) + landValue;
  
  return {
    value: depreciatedValue,
    confidence: property.yearBuilt ? 70 : 50
  };
}

/**
 * Calculate income approach value
 */
function calculateIncomeValue(property: PropertyData) {
  if (!property.rentPrice) {
    return { value: 0, confidence: 0 };
  }
  
  const annualRent = property.rentPrice * 12;
  const capRate = getCapRateByArea(property.city, property.propertyType);
  const value = annualRent / (capRate / 100);
  
  return {
    value,
    confidence: 65
  };
}

/**
 * Calculate investment metrics
 */
function calculateInvestmentMetrics(property: PropertyData, estimatedValue: number): InvestmentMetrics {
  const metrics: InvestmentMetrics = {};
  
  if (property.rentPrice) {
    const annualRent = property.rentPrice * 12;
    metrics.grossRentalYield = (annualRent / estimatedValue) * 100;
    
    // Assume 25% expenses (taxes, maintenance, management, vacancy)
    const netAnnualRent = annualRent * 0.75;
    metrics.netRentalYield = (netAnnualRent / estimatedValue) * 100;
    metrics.capRate = metrics.netRentalYield;
    
    // Simple cash flow calculation
    metrics.cashFlow = netAnnualRent - (estimatedValue * 0.04); // Assume 4% financing cost
    
    // ROI calculation (assuming 20% down payment)
    const downPayment = estimatedValue * 0.2;
    metrics.roi = (metrics.cashFlow! / downPayment) * 100;
    
    // Payback period
    metrics.paybackPeriod = downPayment / Math.max(metrics.cashFlow!, 1);
    
    // Projected 5-year return (rent appreciation + value appreciation)
    const rentAppreciation = 1.03; // 3% annual rent growth
    const valueAppreciation = 1.05; // 5% annual value growth
    const futureValue = estimatedValue * Math.pow(valueAppreciation, 5);
    const futureRent = property.rentPrice * Math.pow(rentAppreciation, 5) * 12;
    metrics.totalReturn5Year = ((futureValue + futureRent * 5 - estimatedValue) / estimatedValue) * 100;
  }
  
  return metrics;
}

/**
 * Assess various risk factors
 */
function assessRisks(property: PropertyData, trends: MarketTrend, comparables: ComparableProperty[]): RiskFactor[] {
  const risks: RiskFactor[] = [];
  
  // Market risks
  if (trends.priceChange1Year > 15) {
    risks.push({
      type: 'market',
      level: 'medium',
      description: 'Rapid price appreciation may indicate market overheating',
      impact: -5
    });
  }
  
  if (trends.inventoryLevels === 'high') {
    risks.push({
      type: 'market',
      level: 'medium',
      description: 'High inventory levels may pressure prices downward',
      impact: -3
    });
  }
  
  // Property risks
  if (property.yearBuilt && property.yearBuilt < 1980) {
    risks.push({
      type: 'property',
      level: 'medium',
      description: 'Older property may require significant maintenance and updates',
      impact: -8
    });
  }
  
  if (property.totalArea < 30) {
    risks.push({
      type: 'property',
      level: 'low',
      description: 'Very small properties may have limited resale appeal',
      impact: -3
    });
  }
  
  // Location risks
  if (comparables.length < 3) {
    risks.push({
      type: 'location',
      level: 'high',
      description: 'Limited comparable sales data increases valuation uncertainty',
      impact: -10
    });
  }
  
  return risks;
}

/**
 * Generate valuation recommendations
 */
function generateRecommendations(
  property: PropertyData, 
  trends: MarketTrend, 
  metrics: InvestmentMetrics,
  risks: RiskFactor[]
): string[] {
  const recommendations: string[] = [];
  
  // Market timing recommendations
  if (trends.seasonality.bestMonthsToSell.includes(new Date().getMonth() + 1)) {
    recommendations.push('Current month is optimal for selling based on seasonal trends');
  }
  
  if (trends.priceDirection === 'rising' && trends.demandLevel === 'high') {
    recommendations.push('Strong market conditions favor sellers - consider listing at asking price');
  }
  
  // Investment recommendations
  if (metrics.netRentalYield && metrics.netRentalYield > 6) {
    recommendations.push('Excellent rental yield makes this attractive for investment');
  }
  
  if (metrics.cashFlow && metrics.cashFlow > 0) {
    recommendations.push('Positive cash flow potential for rental investment');
  }
  
  // Property improvement recommendations
  if (property.energyRating && ['E', 'F', 'G'].includes(property.energyRating)) {
    recommendations.push('Energy efficiency improvements could increase value by 5-10%');
  }
  
  // Risk mitigation
  const highRisks = risks.filter(r => r.level === 'high');
  if (highRisks.length > 0) {
    recommendations.push('Consider additional due diligence given identified high-risk factors');
  }
  
  return recommendations;
}

// Helper functions
function getAreaBasePriceByCity(city: string): number {
  const prices: Record<string, number> = {
    'Madrid': 4200,
    'Barcelona': 4800,
    'Valencia': 2100,
    'Sevilla': 1800,
    'Bilbao': 3200,
    'default': 2500
  };
  return prices[city] || prices.default;
}

function getConstructionCostByType(propertyType: string): number {
  const costs: Record<string, number> = {
    'apartment': 1200,
    'house': 1400,
    'commercial': 1000,
    'warehouse': 600,
    'default': 1200
  };
  return costs[propertyType] || costs.default;
}

function getCapRateByArea(city: string, propertyType: string): number {
  const baseRates: Record<string, number> = {
    'Madrid': 4.5,
    'Barcelona': 4.2,
    'Valencia': 5.5,
    'default': 5.0
  };
  
  const typeAdjustments: Record<string, number> = {
    'apartment': 0,
    'house': 0.5,
    'commercial': -1.0,
    'default': 0
  };
  
  const baseRate = baseRates[city] || baseRates.default;
  const adjustment = typeAdjustments[propertyType] || typeAdjustments.default;
  
  return baseRate + adjustment;
}

function calculateLocalMedianPrice(comparables: ComparableProperty[]): number {
  if (comparables.length === 0) return 0;
  
  const pricesPerSqm = comparables.map(comp => comp.adjustedPrice / comp.totalArea);
  pricesPerSqm.sort((a, b) => a - b);
  
  const mid = Math.floor(pricesPerSqm.length / 2);
  return pricesPerSqm.length % 2 === 0
    ? (pricesPerSqm[mid - 1] + pricesPerSqm[mid]) / 2
    : pricesPerSqm[mid];
}

/**
 * Get automated valuation model (AVM) estimate
 */
export async function getAVMEstimate(property: PropertyData): Promise<{
  estimate: number;
  confidence: number;
  range: { low: number; high: number };
}> {
  const valuation = await valuateProperty(property);
  const confidenceRange = valuation.confidence / 100;
  const margin = valuation.estimatedValue * (1 - confidenceRange) * 0.5;
  
  return {
    estimate: valuation.estimatedValue,
    confidence: valuation.confidence,
    range: {
      low: Math.round(valuation.estimatedValue - margin),
      high: Math.round(valuation.estimatedValue + margin)
    }
  };
}