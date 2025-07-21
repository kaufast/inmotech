import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

// GET /api/user/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId: authResult.userId! }
    });

    return NextResponse.json({
      preferences: preferences?.preferences || getDefaultPreferences()
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST /api/user/preferences - Update user preferences
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const preferences = await request.json();
    
    // Validate preferences structure
    const validatedPreferences = validatePreferences(preferences);

    const updatedPreferences = await prisma.userPreference.upsert({
      where: { userId: authResult.userId! },
      update: { preferences: validatedPreferences },
      create: {
        userId: authResult.userId!,
        preferences: validatedPreferences
      }
    });

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

function getDefaultPreferences() {
  return {
    investmentGoals: {
      primaryGoal: 'growth', // growth, income, preservation
      targetReturn: 10,
      investmentHorizon: 36, // months
      monthlyInvestmentBudget: 1000
    },
    riskTolerance: {
      level: 'moderate', // conservative, moderate, aggressive
      maxSingleInvestment: 10000,
      preferredRiskLevels: ['Low', 'Medium']
    },
    preferences: {
      preferredLocations: ['Spain', 'Portugal', 'France'],
      preferredPropertyTypes: ['Residential', 'Commercial'],
      preferredCurrencies: ['EUR', 'USD'],
      excludeHighRisk: false,
      minExpectedReturn: 8,
      maxInvestmentAmount: 50000
    },
    notifications: {
      emailAlerts: true,
      priceDropAlerts: true,
      newProjectAlerts: true,
      portfolioUpdates: true,
      weeklyReports: true
    },
    dashboard: {
      defaultCurrency: 'EUR',
      chartType: 'line', // line, bar, area
      showPerformanceComparison: true,
      compactView: false
    }
  };
}

function validatePreferences(preferences: any) {
  const defaults = getDefaultPreferences();
  
  return {
    investmentGoals: {
      primaryGoal: preferences.investmentGoals?.primaryGoal || defaults.investmentGoals.primaryGoal,
      targetReturn: Math.max(0, Math.min(50, preferences.investmentGoals?.targetReturn || defaults.investmentGoals.targetReturn)),
      investmentHorizon: Math.max(1, Math.min(120, preferences.investmentGoals?.investmentHorizon || defaults.investmentGoals.investmentHorizon)),
      monthlyInvestmentBudget: Math.max(0, preferences.investmentGoals?.monthlyInvestmentBudget || defaults.investmentGoals.monthlyInvestmentBudget)
    },
    riskTolerance: {
      level: ['conservative', 'moderate', 'aggressive'].includes(preferences.riskTolerance?.level) 
        ? preferences.riskTolerance.level 
        : defaults.riskTolerance.level,
      maxSingleInvestment: Math.max(100, preferences.riskTolerance?.maxSingleInvestment || defaults.riskTolerance.maxSingleInvestment),
      preferredRiskLevels: Array.isArray(preferences.riskTolerance?.preferredRiskLevels) 
        ? preferences.riskTolerance.preferredRiskLevels.filter((level: string) => ['Low', 'Medium', 'High'].includes(level))
        : defaults.riskTolerance.preferredRiskLevels
    },
    preferences: {
      preferredLocations: Array.isArray(preferences.preferences?.preferredLocations) 
        ? preferences.preferences.preferredLocations 
        : defaults.preferences.preferredLocations,
      preferredPropertyTypes: Array.isArray(preferences.preferences?.preferredPropertyTypes) 
        ? preferences.preferences.preferredPropertyTypes 
        : defaults.preferences.preferredPropertyTypes,
      preferredCurrencies: Array.isArray(preferences.preferences?.preferredCurrencies) 
        ? preferences.preferences.preferredCurrencies 
        : defaults.preferences.preferredCurrencies,
      excludeHighRisk: Boolean(preferences.preferences?.excludeHighRisk),
      minExpectedReturn: Math.max(0, Math.min(30, preferences.preferences?.minExpectedReturn || defaults.preferences.minExpectedReturn)),
      maxInvestmentAmount: Math.max(100, preferences.preferences?.maxInvestmentAmount || defaults.preferences.maxInvestmentAmount)
    },
    notifications: {
      emailAlerts: preferences.notifications?.emailAlerts !== false,
      priceDropAlerts: preferences.notifications?.priceDropAlerts !== false,
      newProjectAlerts: preferences.notifications?.newProjectAlerts !== false,
      portfolioUpdates: preferences.notifications?.portfolioUpdates !== false,
      weeklyReports: preferences.notifications?.weeklyReports !== false
    },
    dashboard: {
      defaultCurrency: ['EUR', 'USD', 'GBP', 'MXN'].includes(preferences.dashboard?.defaultCurrency) 
        ? preferences.dashboard.defaultCurrency 
        : defaults.dashboard.defaultCurrency,
      chartType: ['line', 'bar', 'area'].includes(preferences.dashboard?.chartType) 
        ? preferences.dashboard.chartType 
        : defaults.dashboard.chartType,
      showPerformanceComparison: preferences.dashboard?.showPerformanceComparison !== false,
      compactView: Boolean(preferences.dashboard?.compactView)
    }
  };
}