import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { cache } from '@/lib/cache';
import { env } from '@/lib/env-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Metrics response interface
interface MetricsResponse {
  timestamp: string;
  application: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
      heapUsed: number;
      heapTotal: number;
    };
    cpu: {
      usage: number; // This would require additional monitoring in production
    };
    process: {
      id: number;
      version: string;
      platform: string;
      architecture: string;
    };
  };
  database: {
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    queries: {
      slow: number; // Count of slow queries in last hour
      total: number; // Total queries in last hour (if tracked)
    };
  };
  cache: {
    type: 'redis' | 'memory';
    hits: number;
    misses: number;
    hitRate: number;
    keys: number;
  };
  business: {
    users: {
      total: number;
      active: number; // Active in last 24 hours
      verified: number;
    };
    properties: {
      total: number;
      published: number;
      forSale: number;
      forRent: number;
    };
    investments: {
      total: number;
      active: number;
      totalValue: number;
    };
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
}

// Get cache statistics (simplified)
async function getCacheStats() {
  try {
    const keys = await cache.keys('*');
    return {
      type: 'redis' as const, // Simplified
      hits: 0,      // Would need Redis INFO command for real stats
      misses: 0,    // Would need Redis INFO command for real stats
      hitRate: 0,   // Would need Redis INFO command for real stats
      keys: keys.length,
    };
  } catch (error) {
    return {
      type: 'memory' as const,
      hits: 0,
      misses: 0,
      hitRate: 0,
      keys: 0,
    };
  }
}

// Get business metrics from database
async function getBusinessMetrics() {
  try {
    const [
      totalUsers,
      verifiedUsers,
      activeUsers,
      totalProperties,
      publishedProperties,
      saleProperties,
      rentProperties,
      totalInvestments,
      activeInvestments,
      investmentValue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ 
        where: { 
          lastLogin: { 
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          } 
        } 
      }),
      prisma.property.count(),
      prisma.property.count({ where: { isPublished: true } }),
      prisma.property.count({ where: { listingType: 'sale' } }),
      prisma.property.count({ where: { listingType: 'rent' } }),
      prisma.investment.count(),
      prisma.investment.count({ where: { status: 'ACTIVE' } }),
      prisma.investment.aggregate({
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
      },
      properties: {
        total: totalProperties,
        published: publishedProperties,
        forSale: saleProperties,
        forRent: rentProperties,
      },
      investments: {
        total: totalInvestments,
        active: activeInvestments,
        totalValue: investmentValue._sum.amount || 0,
      },
    };
  } catch (error) {
    console.error('Error getting business metrics:', error);
    return {
      users: { total: 0, active: 0, verified: 0 },
      properties: { total: 0, published: 0, forSale: 0, forRent: 0 },
      investments: { total: 0, active: 0, totalValue: 0 },
    };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<MetricsResponse>> {
  try {
    // Check if metrics endpoint should be public (typically should be protected)
    const authHeader = request.headers.get('authorization');
    const allowPublic = env.NODE_ENV === 'development' || env.APP_ENV === 'staging';
    
    if (!allowPublic && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // Get system metrics
    const memUsage = process.memoryUsage();
    const memoryStats = {
      used: Math.round(memUsage.rss / 1024 / 1024), // MB
      total: Math.round(memUsage.rss / 1024 / 1024), // Simplified
      percentage: Math.round((memUsage.heapUsed / memUsage.rss) * 100),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    };

    // Get cache and business metrics in parallel
    const [cacheStats, businessMetrics] = await Promise.all([
      getCacheStats(),
      getBusinessMetrics(),
    ]);

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      application: {
        name: 'InmoTech',
        version: '1.0.0',
        environment: env.NODE_ENV,
        uptime: Math.round(process.uptime()),
      },
      system: {
        memory: memoryStats,
        cpu: {
          usage: 0, // Would need process monitoring for real CPU usage
        },
        process: {
          id: process.pid,
          version: process.version,
          platform: process.platform,
          architecture: process.arch,
        },
      },
      database: {
        connections: {
          active: 0,  // Would need Prisma metrics for real data
          idle: 0,    // Would need Prisma metrics for real data
          total: env.DATABASE_POOL_SIZE,
        },
        queries: {
          slow: 0,    // Would need query monitoring
          total: 0,   // Would need query monitoring
        },
      },
      cache: cacheStats,
      business: businessMetrics,
      performance: {
        averageResponseTime: Date.now() - startTime, // Simplified
        p95ResponseTime: 0, // Would need APM for real data
        errorRate: 0,       // Would need APM for real data
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });

  } catch (error) {
    console.error('Metrics endpoint failed:', error);

    return NextResponse.json(
      { 
        error: 'Failed to gather metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}