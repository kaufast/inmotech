import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';
import { checkCacheHealth } from '@/lib/cache';
import { env } from '@/lib/env-validation';
import { monitoring } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Health check response interface
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    api: 'ok' | 'error';
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    cache: {
      status: 'healthy' | 'unhealthy';
      type: 'redis' | 'memory';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      used: number;
      total: number;
      percentage: number;
    };
    auth: 'ok' | 'missing_config';
  };
  performance: {
    responseTime: number;
    dbLatency?: number;
    cacheLatency?: number;
  };
  details?: {
    processId: number;
    platform: string;
    nodeVersion: string;
    architecture: string;
  };
}

// Memory usage helper
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.rss;
  
  // Convert to MB for readability
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memUsage.rss / 1024 / 1024);
  const percentage = (memUsage.heapUsed / memUsage.rss) * 100;
  
  return {
    used: usedMB,
    total: totalMB,
    percentage: Math.round(percentage * 100) / 100,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  
  try {
    // Parallel health checks
    const [databaseHealth, cacheHealth] = await Promise.allSettled([
      env.HEALTH_CHECK_DATABASE ? checkDatabaseHealth() : Promise.resolve({ status: 'healthy' as const, responseTime: 0 }),
      env.HEALTH_CHECK_REDIS ? checkCacheHealth() : Promise.resolve({ status: 'healthy' as const, type: 'memory' as const, responseTime: 0 }),
    ]);

    // Memory usage
    const memoryUsage = getMemoryUsage();
    const memoryStatus = memoryUsage.percentage > 90 ? 'unhealthy' : 'healthy';

    // Auth configuration check
    const authStatus = process.env.JWT_SECRET ? 'ok' : 'missing_config';

    // Process health check results
    const dbResult = databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'unhealthy' as const, error: 'Check failed' };
    const cacheResult = cacheHealth.status === 'fulfilled' ? cacheHealth.value : { status: 'unhealthy' as const, type: 'memory' as const, error: 'Check failed' };

    // Build response
    const checks = {
      api: 'ok' as const,
      database: dbResult,
      cache: cacheResult,
      memory: {
        status: memoryStatus,
        used: memoryUsage.used,
        total: memoryUsage.total,
        percentage: memoryUsage.percentage,
      },
      auth: authStatus,
    };

    // Determine overall status
    const hasUnhealthy = [checks.database.status, checks.cache.status, checks.memory.status].includes('unhealthy') || checks.auth === 'missing_config';
    const hasDegraded = checks.memory.percentage > 75;
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    const responseTime = Date.now() - startTime;

    const response: HealthCheckResponse = {
      status: overallStatus,
      message: overallStatus === 'healthy' ? 'InmoTech API is running normally' : 
               overallStatus === 'degraded' ? 'InmoTech API is running with degraded performance' :
               'InmoTech API has critical issues',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: '1.0.0',
      environment: env.NODE_ENV,
      checks,
      performance: {
        responseTime,
        dbLatency: dbResult.responseTime,
        cacheLatency: cacheResult.responseTime,
      },
      details: env.NODE_ENV === 'development' ? {
        processId: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        architecture: process.arch,
      } : undefined,
    };

    // Report unhealthy status to monitoring
    if (overallStatus === 'unhealthy') {
      monitoring.reportHealthCheck('api', 'unhealthy', {
        checks,
        responseTime,
      });
    }

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    // Add performance headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Response-Time': `${responseTime}ms`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    return NextResponse.json(response, { status: httpStatus, headers });

  } catch (error) {
    console.error('Health check failed:', error);
    
    // Report critical error to monitoring
    monitoring.captureError(error as Error, {
      context: 'health_check',
      endpoint: '/api/health',
    });

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: '1.0.0',
      environment: env.NODE_ENV,
      checks: {
        api: 'error',
        database: { status: 'unhealthy', error: 'Health check failed' },
        cache: { status: 'unhealthy', type: 'memory', error: 'Health check failed' },
        memory: { status: 'unhealthy', used: 0, total: 0, percentage: 0 },
        auth: 'missing_config',
      },
      performance: {
        responseTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}