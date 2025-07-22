// Investment calculation utilities and ROI projections

export interface InvestmentMetrics {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  unrealizedGains: number;
  totalDistributions: number;
  absoluteReturn: number;
  percentageReturn: number;
  annualizedReturn: number;
  roi: number;
}

export interface PortfolioMetrics extends InvestmentMetrics {
  numberOfInvestments: number;
  averageInvestmentSize: number;
  totalValueAtRisk: number;
  diversificationScore: number;
  riskScore: number;
}

export interface ROIProjection {
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

/**
 * Calculate investment performance metrics
 */
export function calculateInvestmentMetrics(investment: {
  amount: number;
  currentValue?: number;
  totalReturns: number;
  totalDistributions: number;
  unrealizedReturns: number;
  investmentDate: Date;
}): InvestmentMetrics {
  const currentValue = investment.currentValue || investment.amount;
  const totalReturns = investment.totalReturns;
  const totalDistributions = investment.totalDistributions;
  const unrealizedGains = investment.unrealizedReturns;
  
  const absoluteReturn = totalReturns + unrealizedGains;
  const percentageReturn = investment.amount > 0 ? (absoluteReturn / investment.amount) * 100 : 0;
  
  // Calculate annualized return
  const daysSinceInvestment = (new Date().getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24);
  const yearsSinceInvestment = daysSinceInvestment / 365.25;
  
  const annualizedReturn = yearsSinceInvestment > 0 && investment.amount > 0
    ? (Math.pow((currentValue + totalDistributions) / investment.amount, 1 / yearsSinceInvestment) - 1) * 100
    : 0;
  
  const roi = investment.amount > 0 ? ((currentValue + totalDistributions - investment.amount) / investment.amount) * 100 : 0;
  
  return {
    totalInvested: investment.amount,
    currentValue,
    totalReturns,
    unrealizedGains,
    totalDistributions,
    absoluteReturn,
    percentageReturn,
    annualizedReturn,
    roi
  };
}

/**
 * Calculate portfolio-level metrics
 */
export function calculatePortfolioMetrics(investments: Array<{
  amount: number;
  currentValue?: number;
  totalReturns: number;
  totalDistributions: number;
  unrealizedReturns: number;
  investmentDate: Date;
  opportunity: {
    riskLevel: string;
    investmentType: string;
    category: string;
  };
}>): PortfolioMetrics {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const currentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
  const totalReturns = investments.reduce((sum, inv) => sum + inv.totalReturns, 0);
  const totalDistributions = investments.reduce((sum, inv) => sum + inv.totalDistributions, 0);
  const unrealizedGains = investments.reduce((sum, inv) => sum + inv.unrealizedReturns, 0);
  
  const numberOfInvestments = investments.length;
  const averageInvestmentSize = numberOfInvestments > 0 ? totalInvested / numberOfInvestments : 0;
  
  // Calculate portfolio-level returns
  const absoluteReturn = totalReturns + unrealizedGains;
  const percentageReturn = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;
  
  // Calculate weighted annualized return
  let weightedAnnualizedReturn = 0;
  if (investments.length > 0) {
    const totalValue = currentValue + totalDistributions;
    weightedAnnualizedReturn = investments.reduce((sum, inv) => {
      const weight = inv.amount / totalInvested;
      const daysSinceInvestment = (new Date().getTime() - inv.investmentDate.getTime()) / (1000 * 60 * 60 * 24);
      const yearsSinceInvestment = daysSinceInvestment / 365.25;
      
      if (yearsSinceInvestment > 0 && inv.amount > 0) {
        const invCurrentValue = inv.currentValue || inv.amount;
        const invAnnualizedReturn = (Math.pow((invCurrentValue + inv.totalDistributions) / inv.amount, 1 / yearsSinceInvestment) - 1) * 100;
        return sum + (weight * invAnnualizedReturn);
      }
      return sum;
    }, 0);
  }
  
  const roi = totalInvested > 0 ? ((currentValue + totalDistributions - totalInvested) / totalInvested) * 100 : 0;
  
  // Calculate diversification score (0-100, higher is better)
  const diversificationScore = calculateDiversificationScore(investments);
  
  // Calculate risk score (weighted average of investment risk levels)
  const riskScore = calculateRiskScore(investments);
  
  // Value at Risk (simplified - 5% of portfolio value)
  const totalValueAtRisk = currentValue * 0.05;
  
  return {
    totalInvested,
    currentValue,
    totalReturns,
    unrealizedGains,
    totalDistributions,
    absoluteReturn,
    percentageReturn,
    annualizedReturn: weightedAnnualizedReturn,
    roi,
    numberOfInvestments,
    averageInvestmentSize,
    totalValueAtRisk,
    diversificationScore,
    riskScore
  };
}

/**
 * Project future ROI based on investment parameters
 */
export function projectROI(investment: {
  amount: number;
  expectedRoi: number;
  investmentPeriod: number;
  riskLevel: string;
}): ROIProjection[] {
  const projections: ROIProjection[] = [];
  const { amount, expectedRoi, investmentPeriod, riskLevel } = investment;
  
  // Risk adjustment factors
  const riskFactors = {
    'low': { volatility: 0.05, confidenceRange: 0.1 },
    'medium': { volatility: 0.15, confidenceRange: 0.2 },
    'high': { volatility: 0.25, confidenceRange: 0.3 },
    'very_high': { volatility: 0.4, confidenceRange: 0.5 }
  };
  
  const riskFactor = riskFactors[riskLevel as keyof typeof riskFactors] || riskFactors.medium;
  
  // Create projections for different time horizons
  const timeHorizons = [6, 12, 24, 36, investmentPeriod];
  
  timeHorizons.forEach(months => {
    if (months <= investmentPeriod) {
      const yearsElapsed = months / 12;
      const projectedAnnualReturn = expectedRoi / 100;
      
      // Compound the expected return
      const projectedValue = amount * Math.pow(1 + projectedAnnualReturn, yearsElapsed);
      const projectedReturns = projectedValue - amount;
      const projectedROI = (projectedReturns / amount) * 100;
      const annualizedReturn = yearsElapsed > 0 ? (Math.pow(projectedValue / amount, 1 / yearsElapsed) - 1) * 100 : 0;
      
      // Calculate confidence intervals based on risk
      const confidenceRange = riskFactor.confidenceRange;
      const lowEstimate = projectedValue * (1 - confidenceRange);
      const highEstimate = projectedValue * (1 + confidenceRange);
      
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
  
  return projections;
}

/**
 * Calculate diversification score based on portfolio composition
 */
function calculateDiversificationScore(investments: Array<{
  opportunity: {
    riskLevel: string;
    investmentType: string;
    category: string;
  };
  amount: number;
}>): number {
  if (investments.length <= 1) return 0;
  
  const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Calculate distribution across investment types
  const typeDistribution = investments.reduce((acc, inv) => {
    const type = inv.opportunity.investmentType;
    acc[type] = (acc[type] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate distribution across categories
  const categoryDistribution = investments.reduce((acc, inv) => {
    const category = inv.opportunity.category;
    acc[category] = (acc[category] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate distribution across risk levels
  const riskDistribution = investments.reduce((acc, inv) => {
    const risk = inv.opportunity.riskLevel;
    acc[risk] = (acc[risk] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate Herfindahl-Hirschman Index (HHI) for each dimension
  const calculateHHI = (distribution: Record<string, number>) => {
    const shares = Object.values(distribution).map(amount => amount / totalAmount);
    return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  };
  
  const typeHHI = calculateHHI(typeDistribution);
  const categoryHHI = calculateHHI(categoryDistribution);
  const riskHHI = calculateHHI(riskDistribution);
  
  // Convert HHI to diversification score (lower HHI = higher diversification)
  const typeScore = (1 - typeHHI) * 100;
  const categoryScore = (1 - categoryHHI) * 100;
  const riskScore = (1 - riskHHI) * 100;
  
  // Weighted average of diversification scores
  return (typeScore * 0.4 + categoryScore * 0.3 + riskScore * 0.3);
}

/**
 * Calculate weighted average risk score
 */
function calculateRiskScore(investments: Array<{
  opportunity: {
    riskLevel: string;
  };
  amount: number;
}>): number {
  if (investments.length === 0) return 0;
  
  const riskLevelScores = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'very_high': 4
  };
  
  const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
  
  const weightedRiskScore = investments.reduce((sum, inv) => {
    const weight = inv.amount / totalAmount;
    const riskScore = riskLevelScores[inv.opportunity.riskLevel as keyof typeof riskLevelScores] || 2;
    return sum + (weight * riskScore);
  }, 0);
  
  return weightedRiskScore;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 */
export function calculateSharpeRatio(portfolioReturn: number, riskFreeRate: number = 2, portfolioVolatility: number): number {
  if (portfolioVolatility <= 0) return 0;
  return (portfolioReturn - riskFreeRate) / portfolioVolatility;
}