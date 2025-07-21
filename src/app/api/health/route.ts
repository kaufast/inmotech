import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/api-middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function healthHandler() {
  const health: any = {
    status: 'ok',
    message: 'InmoTech API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.2',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: 'ok',
      database: 'unknown',
      auth: 'unknown',
    }
  };

  try {
    // Check database connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;
    
    health.checks.database = 'ok';
    health.dbLatency = `${dbLatency}ms`;
    
    // Check if JWT secret is configured
    health.checks.auth = process.env.JWT_SECRET ? 'ok' : 'missing_config';
    
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'error';
    health.error = process.env.NODE_ENV === 'development' 
      ? (error as Error).message 
      : 'Database connection failed';
  }

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503
  });
}

// Export handler with middleware
export const GET = withMiddleware(healthHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  },
  cors: {}
});