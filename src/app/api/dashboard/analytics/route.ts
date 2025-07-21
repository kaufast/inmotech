import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

// GET /api/dashboard/analytics - Get comprehensive dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;

    // Get user's investments with project details
    const investments = await prisma.investment.findMany({
      where: { 
        userId,
        status: 'CONFIRMED'
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            expectedReturn: true,
            duration: true,
            currency: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate portfolio statistics
    const portfolioStats = calculatePortfolioStats(investments);

    // Get user's watchlist
    const watchlist = await prisma.userWatchlist.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            location: true,
            expectedReturn: true,
            minimumInvestment: true,
            currency: true,
            images: true
          }
        }
      },
      orderBy: { addedAt: 'desc' },
      take: 5
    });

    // Get recent activity
    const recentActivity = await getRecentActivity(userId);

    // Get personalized recommendations
    const recommendations = await getPersonalizedRecommendations(userId, investments);

    // Get portfolio performance over time
    const performanceData = await getPortfolioPerformance(userId);

    return NextResponse.json({
      portfolioStats,
      investments: investments.slice(0, 5), // Latest 5 for dashboard
      watchlist: watchlist.map(w => w.project),
      recentActivity,
      recommendations,
      performanceData
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}

function calculatePortfolioStats(investments: any[]) {
  if (investments.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      currentReturns: 0,
      expectedAnnualReturn: 0,
      activeProjects: 0,
      portfolioGrowth: 0,
      nextPayment: null,
      diversification: {
        byPropertyType: {},
        byCurrency: {},
        byRiskLevel: {}
      }
    };
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Calculate weighted average expected return
  const weightedReturn = investments.reduce((sum, inv) => {
    const weight = inv.amount / totalInvested;
    return sum + (inv.project.expectedReturn * weight);
  }, 0);

  // Calculate current returns (simplified - in reality would need time-based calculation)
  const avgDuration = investments.reduce((sum, inv) => sum + inv.project.duration, 0) / investments.length;
  const monthsElapsed = Math.min(6, avgDuration); // Simulate 6 months elapsed
  const currentReturns = totalInvested * (weightedReturn / 100) * (monthsElapsed / 12);

  const totalValue = totalInvested + currentReturns;
  const portfolioGrowth = totalInvested > 0 ? (currentReturns / totalInvested) * 100 : 0;

  // Group investments for diversification analysis
  const byPropertyType = groupBy(investments, inv => inv.project.propertyType || 'Unknown');
  const byCurrency = groupBy(investments, inv => inv.project.currency);
  
  // Find next payment (simulate based on project duration)
  const nextPayment = investments.length > 0 ? {
    amount: Math.round((totalValue * 0.05) * 100) / 100, // 5% of portfolio
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    projectTitle: investments[0].project.title
  } : null;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    currentReturns: Math.round(currentReturns * 100) / 100,
    expectedAnnualReturn: Math.round(weightedReturn * 100) / 100,
    activeProjects: investments.length,
    portfolioGrowth: Math.round(portfolioGrowth * 100) / 100,
    nextPayment,
    diversification: {
      byPropertyType: calculatePercentages(byPropertyType, totalInvested),
      byCurrency: calculatePercentages(byCurrency, totalInvested),
    }
  };
}

function groupBy(array: any[], keyFn: (item: any) => string) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] = (groups[key] || 0) + item.amount;
    return groups;
  }, {} as Record<string, number>);
}

function calculatePercentages(groups: Record<string, number>, total: number) {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(groups)) {
    result[key] = Math.round((value / total) * 10000) / 100; // Round to 2 decimal places
  }
  return result;
}

async function getRecentActivity(userId: string) {
  const activities: Array<{
    type: string;
    title: string;
    amount?: number;
    currency?: string;
    date: Date;
    status: string;
  }> = [];

  // Get recent investments
  const recentInvestments = await prisma.investment.findMany({
    where: { userId },
    include: {
      project: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  recentInvestments.forEach(investment => {
    activities.push({
      type: 'investment',
      title: `Invested in ${investment.project.title}`,
      amount: investment.amount,
      currency: investment.currency,
      date: investment.createdAt,
      status: investment.status
    });
  });

  // Get recent watchlist additions
  const recentWatchlist = await prisma.userWatchlist.findMany({
    where: { userId },
    include: {
      project: { select: { title: true } }
    },
    orderBy: { addedAt: 'desc' },
    take: 2
  });

  recentWatchlist.forEach(item => {
    activities.push({
      type: 'watchlist',
      title: `Added ${item.project.title} to watchlist`,
      date: item.addedAt,
      status: 'active'
    });
  });

  // Sort by date and return latest 5
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

async function getPersonalizedRecommendations(userId: string, userInvestments: any[]) {
  // Get user's investment patterns
  const propertyTypes = userInvestments.map(inv => inv.project.propertyType);
  const currencies = userInvestments.map(inv => inv.project.currency);
  const investedPropertyTypes = Array.from(new Set(propertyTypes));
  const preferredCurrencies = Array.from(new Set(currencies));
  const avgInvestment = userInvestments.length > 0 
    ? userInvestments.reduce((sum, inv) => sum + inv.amount, 0) / userInvestments.length 
    : 5000;

  // Get projects not already invested in
  const investedProjectIds = userInvestments.map(inv => inv.projectId);
  
  let whereClause: any = {
    status: 'ACTIVE',
    id: { notIn: investedProjectIds }
  };

  // If user has investment history, prefer similar types
  if (investedPropertyTypes.length > 0) {
    whereClause.OR = [
      { propertyType: { in: investedPropertyTypes } },
      { currency: { in: preferredCurrencies } },
      { minimumInvestment: { lte: avgInvestment * 1.5 } }
    ];
  }

  const recommendations = await prisma.project.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      location: true,
      expectedReturn: true,
      minimumInvestment: true,
      currency: true,
      propertyType: true,
      images: true,
      riskLevel: true
    },
    orderBy: [
      { expectedReturn: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 6
  });

  return recommendations;
}

async function getPortfolioPerformance(userId: string) {
  // Generate performance data for the last 6 months
  const months = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM format
      date: date.toISOString().slice(0, 10)
    });
  }

  // Get investments made before each month to simulate portfolio growth
  const performanceData = await Promise.all(
    months.map(async (month) => {
      const investmentsByMonth = await prisma.investment.findMany({
        where: {
          userId,
          status: 'CONFIRMED',
          createdAt: { lte: new Date(month.date) }
        },
        include: {
          project: {
            select: { expectedReturn: true }
          }
        }
      });

      const totalInvested = investmentsByMonth.reduce((sum, inv) => sum + inv.amount, 0);
      
      // Simulate returns based on time elapsed and expected returns
      const avgReturn = investmentsByMonth.length > 0
        ? investmentsByMonth.reduce((sum, inv) => sum + inv.project.expectedReturn, 0) / investmentsByMonth.length
        : 0;
      
      const monthsElapsed = Math.max(1, (new Date().getTime() - new Date(month.date).getTime()) / (30 * 24 * 60 * 60 * 1000));
      const returns = totalInvested * (avgReturn / 100) * (monthsElapsed / 12);

      return {
        month: month.month,
        totalValue: Math.round((totalInvested + returns) * 100) / 100,
        invested: Math.round(totalInvested * 100) / 100,
        returns: Math.round(returns * 100) / 100
      };
    })
  );

  return performanceData;
}