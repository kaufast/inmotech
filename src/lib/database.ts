import { PrismaClient, Prisma } from '@prisma/client';
import { env, databaseConfig } from './env-validation';

// Database configuration with optimizations
const databaseConfiguration: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: databaseConfig.url,
    },
  },
  log: env.DEBUG_SQL 
    ? ['query', 'info', 'warn', 'error'] 
    : ['warn', 'error'],
  errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
};

// Global prisma instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create database client with connection pooling and optimizations
export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    ...databaseConfiguration,
  });

// Prevent multiple instances in development
if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection management
let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return prisma;
  
  try {
    await prisma.$connect();
    isConnected = true;
    
    if (env.NODE_ENV === 'development') {
      console.log('🗄️ Connected to database');
    }
    
    return prisma;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (!isConnected) return;
  
  try {
    await prisma.$disconnect();
    isConnected = false;
    
    if (env.NODE_ENV === 'development') {
      console.log('🗄️ Disconnected from database');
    }
  } catch (error) {
    console.error('❌ Failed to disconnect from database:', error);
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Query optimization helpers
export const prismaExtensions = {
  // Select optimization for user queries
  userSelect: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    isVerified: true,
    isAdmin: true,
    isActive: true,
    kycStatus: true,
    createdAt: true,
    lastLogin: true,
  } as const,

  // Select optimization for property queries
  propertySelect: {
    id: true,
    title: true,
    description: true,
    propertyType: true,
    listingType: true,
    status: true,
    address: true,
    city: true,
    country: true,
    latitude: true,
    longitude: true,
    bedrooms: true,
    bathrooms: true,
    totalArea: true,
    salePrice: true,
    rentPrice: true,
    currency: true,
    images: true,
    isFeatured: true,
    views: true,
    inquiries: true,
    createdAt: true,
    updatedAt: true,
  } as const,

  // Select optimization for investment queries
  investmentSelect: {
    id: true,
    userId: true,
    opportunityId: true,
    amount: true,
    currency: true,
    investmentDate: true,
    status: true,
    paymentStatus: true,
    currentValue: true,
    totalReturns: true,
    unrealizedReturns: true,
    createdAt: true,
    updatedAt: true,
  } as const,

  // Common include patterns
  propertyWithOwner: {
    owner: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    _count: {
      select: {
        inquiries_list: true,
        viewings: true,
        watchlistedBy: true,
      },
    },
  } as const,

  investmentWithOpportunity: {
    opportunity: {
      select: {
        id: true,
        title: true,
        investmentType: true,
        category: true,
        expectedRoi: true,
        investmentPeriod: true,
        city: true,
        status: true,
      },
    },
  } as const,
};

// Query performance monitoring
export async function withQueryMetrics<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Log slow queries (threshold: 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️ Slow query detected: ${operationName} took ${duration}ms`);
    }
    
    // Log query metrics in development
    if (env.DEBUG_SQL) {
      console.log(`🔍 Query ${operationName}: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query ${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}

// Transaction helpers with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('Unique constraint') ||
        lastError.message.includes('Foreign key constraint') ||
        lastError.message.includes('Check constraint')
      ) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`⚠️ Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
}

// Pagination helpers
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

export function getPaginationConfig(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;
  
  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit,
    },
  };
}

// Database cleanup and maintenance
export async function performDatabaseMaintenance() {
  if (env.NODE_ENV !== 'production') return;
  
  try {
    console.log('🧹 Starting database maintenance...');
    
    // Clean up expired refresh tokens
    const expiredTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    
    // Clean up expired user sessions
    const expiredSessions = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false, terminatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    
    console.log(`🧹 Maintenance completed: cleaned ${expiredTokens.count} tokens, ${expiredSessions.count} sessions`);
  } catch (error) {
    console.error('❌ Database maintenance failed:', error);
  }
}

// Graceful shutdown
export async function gracefulShutdown() {
  console.log('🔄 Gracefully shutting down database connections...');
  
  try {
    await disconnectFromDatabase();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
  }
}

// Handle process signals for graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}

export default prisma;