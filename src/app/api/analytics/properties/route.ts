import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '12_months';
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');

    // Calculate date filter
    const now = new Date();
    let dateFilter: Date | undefined;
    
    switch (dateRange) {
      case '3_months':
        dateFilter = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6_months':
        dateFilter = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '12_months':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = undefined;
    }

    // Build where clause
    const where: any = {
      isPublished: true,
      ...(dateFilter && { createdAt: { gte: dateFilter } }),
      ...(city && city !== 'all' && { city }),
      ...(propertyType && propertyType !== 'all' && { propertyType })
    };

    // Get basic property data
    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        propertyType: true,
        listingType: true,
        status: true,
        city: true,
        totalArea: true,
        salePrice: true,
        rentPrice: true,
        views: true,
        inquiries: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inquiries_list: true,
            viewings: true,
            watchlistedBy: true
          }
        }
      }
    });

    // Calculate overview metrics
    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + (p.salePrice || p.rentPrice || 0), 0);
    const averagePrice = totalValue / Math.max(totalProperties, 1);
    const totalArea = properties.reduce((sum, p) => sum + (p.totalArea || 0), 0);
    const averagePricePerSqm = totalArea > 0 ? totalValue / totalArea : 0;
    const totalViews = properties.reduce((sum, p) => sum + p.views, 0);
    const totalInquiries = properties.reduce((sum, p) => sum + (p._count?.inquiries_list || 0), 0);
    const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

    // Mock average days on market (in real app, calculate from sold properties)
    const averageDaysOnMarket = 45;

    // Calculate price distribution
    const priceRanges = [
      { min: 0, max: 100000, label: '< €100K' },
      { min: 100000, max: 250000, label: '€100K - €250K' },
      { min: 250000, max: 500000, label: '€250K - €500K' },
      { min: 500000, max: 1000000, label: '€500K - €1M' },
      { min: 1000000, max: Infinity, label: '> €1M' }
    ];

    const priceDistribution = priceRanges.map(range => {
      const count = properties.filter(p => {
        const price = p.salePrice || p.rentPrice || 0;
        return price >= range.min && price < range.max;
      }).length;
      
      return {
        range: range.label,
        count,
        percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
      };
    });

    // Calculate price by type
    const typeGroups = properties.reduce((acc, p) => {
      const price = p.salePrice || p.rentPrice || 0;
      if (!acc[p.propertyType]) {
        acc[p.propertyType] = { prices: [], count: 0 };
      }
      acc[p.propertyType].prices.push(price);
      acc[p.propertyType].count++;
      return acc;
    }, {} as Record<string, { prices: number[], count: number }>);

    const priceByType = Object.entries(typeGroups).map(([type, data]) => {
      const prices = data.prices.sort((a, b) => a - b);
      const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      return {
        type,
        averagePrice,
        medianPrice,
        count: data.count
      };
    });

    // Calculate price by location
    const cityGroups = properties.reduce((acc, p) => {
      const price = p.salePrice || p.rentPrice || 0;
      const area = p.totalArea || 1;
      
      if (!acc[p.city]) {
        acc[p.city] = { prices: [], areas: [], count: 0 };
      }
      acc[p.city].prices.push(price);
      acc[p.city].areas.push(area);
      acc[p.city].count++;
      return acc;
    }, {} as Record<string, { prices: number[], areas: number[], count: number }>);

    const priceByLocation = Object.entries(cityGroups).map(([city, data]) => {
      const averagePrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
      const totalArea = data.areas.reduce((sum, a) => sum + a, 0);
      const pricePerSqm = totalArea > 0 ? (data.prices.reduce((sum, p) => sum + p, 0) / totalArea) : 0;
      // Mock trend data
      const trend = (Math.random() - 0.5) * 20; // Random trend between -10% and +10%
      
      return {
        city,
        averagePrice,
        pricePerSqm,
        count: data.count,
        trend
      };
    });

    // Generate mock price trends (last 12 months)
    const priceTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      // Mock data with some variation
      const basePrice = averagePrice;
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const monthlyAverage = basePrice * (1 + variation);
      const monthlyMedian = monthlyAverage * 0.95; // Median typically slightly lower
      const transactions = Math.floor(Math.random() * 50) + 10;
      
      priceTrends.push({
        month: monthName,
        averagePrice: Math.round(monthlyAverage),
        medianPrice: Math.round(monthlyMedian),
        transactions
      });
    }

    // Calculate market distributions
    const propertyTypeDistribution = Object.entries(
      properties.reduce((acc, p) => {
        acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      type,
      count,
      value: properties
        .filter(p => p.propertyType === type)
        .reduce((sum, p) => sum + (p.salePrice || p.rentPrice || 0), 0),
      percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
    }));

    const listingTypeDistribution = Object.entries(
      properties.reduce((acc, p) => {
        acc[p.listingType] = (acc[p.listingType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      type,
      count,
      percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
    }));

    const statusDistribution = Object.entries(
      properties.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      status,
      count,
      percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
    }));

    // Size distribution
    const sizeRanges = [
      { min: 0, max: 50, label: '< 50m²' },
      { min: 50, max: 100, label: '50-100m²' },
      { min: 100, max: 150, label: '100-150m²' },
      { min: 150, max: 200, label: '150-200m²' },
      { min: 200, max: Infinity, label: '> 200m²' }
    ];

    const sizeDistribution = sizeRanges.map(range => {
      const count = properties.filter(p => {
        const area = p.totalArea || 0;
        return area >= range.min && area < range.max;
      }).length;
      
      return {
        range: range.label,
        count,
        percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
      };
    });

    // Generate mock performance data
    const viewsPerProperty = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      const totalViews = Math.floor(Math.random() * 1000) + 500;
      const averageViews = Math.floor(totalViews / Math.max(totalProperties, 1));
      
      viewsPerProperty.push({
        month: monthName,
        totalViews,
        averageViews
      });
    }

    const inquiryRates = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      const inquiries = Math.floor(Math.random() * 100) + 20;
      const propertiesCount = Math.max(totalProperties, 1);
      const rate = (inquiries / propertiesCount) * 100;
      
      inquiryRates.push({
        month: monthName,
        inquiries,
        properties: propertiesCount,
        rate
      });
    }

    // Time on market by type
    const timeOnMarket = propertyTypeDistribution.map(({ type }) => ({
      type,
      averageDays: Math.floor(Math.random() * 60) + 20, // 20-80 days
      medianDays: Math.floor(Math.random() * 50) + 15   // 15-65 days
    }));

    // Top performers
    const topPerformers = properties
      .map(p => ({
        id: p.id,
        title: p.title,
        views: p.views,
        inquiries: p._count?.inquiries_list || 0,
        price: p.salePrice || p.rentPrice || 0,
        type: p.propertyType
      }))
      .sort((a, b) => (b.views + b.inquiries * 5) - (a.views + a.inquiries * 5))
      .slice(0, 10);

    const analytics = {
      overview: {
        totalProperties,
        totalValue: Math.round(totalValue),
        averagePrice: Math.round(averagePrice),
        averagePricePerSqm: Math.round(averagePricePerSqm),
        totalViews,
        totalInquiries,
        conversionRate,
        averageDaysOnMarket
      },
      priceAnalytics: {
        priceDistribution,
        priceByType,
        priceByLocation,
        priceTrends
      },
      marketAnalytics: {
        propertyTypeDistribution,
        listingTypeDistribution,
        statusDistribution,
        sizeDistribution
      },
      performanceAnalytics: {
        viewsPerProperty,
        inquiryRates,
        timeOnMarket,
        topPerformers
      }
    };

    return NextResponse.json(analytics);
    
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}