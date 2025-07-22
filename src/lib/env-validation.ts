import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_ENV: z.string().default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  DATABASE_CONNECTION_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('60000'),
  DATABASE_QUERY_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('30000'),
  DATABASE_SSL_MODE: z.enum(['disable', 'allow', 'prefer', 'require']).default('require'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  REFRESH_JWT_SECRET: z.string().min(32, 'Refresh JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_MAX_AGE: z.string().transform(Number).pipe(z.number().min(60000)).default('604800000'),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0).max(15)).default('0'),
  REDIS_CLUSTER_MODE: z.string().transform(val => val === 'true').default('false'),
  REDIS_MAX_RETRIES: z.string().transform(Number).pipe(z.number().min(0)).default('3'),
  
  // Caching
  ENABLE_CACHE: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL_DEFAULT: z.string().transform(Number).pipe(z.number().min(60)).default('3600'),
  CACHE_TTL_PROPERTIES: z.string().transform(Number).pipe(z.number().min(60)).default('1800'),
  CACHE_TTL_ANALYTICS: z.string().transform(Number).pipe(z.number().min(300)).default('7200'),
  CACHE_TTL_USERS: z.string().transform(Number).pipe(z.number().min(60)).default('900'),
  
  // Sentry (optional)
  ENABLE_SENTRY: z.string().transform(val => val === 'true').default('false'),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default('0.1'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().min(60000)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().min(1)).default('100'),
  RATE_LIMIT_KEY_PREFIX: z.string().default('rl:'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_FILE_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
  HELMET_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CORS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CORS_ORIGIN: z.string().default('*'),
  
  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().min(1024)).default('5242880'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf'),
  
  // Health checks
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HEALTH_CHECK_DATABASE: z.string().transform(val => val === 'true').default('true'),
  HEALTH_CHECK_REDIS: z.string().transform(val => val === 'true').default('true'),
  
  // External services
  HTTP_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('30000'),
  WEBHOOK_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('10000'),
  PAYMENT_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('60000'),
  
  // Feature flags
  ENABLE_BLOCKCHAIN: z.string().transform(val => val === 'true').default('false'),
  ENABLE_KYC: z.string().transform(val => val === 'true').default('true'),
  ENABLE_SANDBOX: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  
  // Public environment variables (client-side)
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().default('/api'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Development flags
  DEBUG_SQL: z.string().transform(val => val === 'true').default('false'),
  DEBUG_CACHE: z.string().transform(val => val === 'true').default('false'),
  DEBUG_REDIS: z.string().transform(val => val === 'true').default('false'),
});

// Environment-specific validation
const productionRequiredFields = [
  // 'SENTRY_DSN',
  // 'REDIS_URL',
  'NEXT_PUBLIC_BASE_URL',
] as const;

// Validate environment variables
export function validateEnv(): z.infer<typeof envSchema> {
  // Skip validation if explicitly disabled
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('⚠️ Environment validation skipped');
    return process.env as any;
  }
  
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional validation for production environment
    if (parsed.NODE_ENV === 'production') {
      const missingFields = productionRequiredFields.filter(
        field => !process.env[field]
      );
      
      if (missingFields.length > 0) {
        throw new Error(
          `Missing required environment variables for production: ${missingFields.join(', ')}`
        );
      }
      
      // Validate production-specific constraints
      if (parsed.CORS_ORIGIN === '*') {
        console.warn('⚠️  CORS_ORIGIN is set to "*" in production. Consider restricting to specific origins.');
      }
      
      if (parsed.BCRYPT_ROUNDS < 12) {
        throw new Error('BCRYPT_ROUNDS should be at least 12 in production');
      }
      
      if (!parsed.ENABLE_SENTRY) {
        console.warn('⚠️  Sentry monitoring is disabled in production.');
      }
    }
    
    // Validate Redis configuration if caching is enabled
    if (parsed.ENABLE_CACHE && !parsed.REDIS_URL && parsed.NODE_ENV === 'production') {
      console.warn('⚠️  Caching is enabled but Redis URL is not configured. Using in-memory cache fallback.');
    }
    
    // Validate Sentry configuration if enabled
    if (parsed.ENABLE_SENTRY && !parsed.SENTRY_DSN) {
      throw new Error('SENTRY_DSN is required when ENABLE_SENTRY is true');
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidFields = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      let errorMessage = 'Environment validation failed:\n';
      
      if (missingFields.length > 0) {
        errorMessage += `Missing required variables: ${missingFields.join(', ')}\n`;
      }
      
      if (invalidFields.length > 0) {
        errorMessage += `Invalid values: ${invalidFields.join(', ')}\n`;
      }
      
      throw new Error(errorMessage);
    }
    
    throw error;
  }
}

// Get validated environment variables
export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Environment helpers
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';
export const isDevelopment = env.NODE_ENV === 'development';

// Configuration objects based on environment
export const databaseConfig = {
  url: env.DATABASE_URL,
  poolSize: env.DATABASE_POOL_SIZE,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
  queryTimeout: env.DATABASE_QUERY_TIMEOUT,
  sslMode: env.DATABASE_SSL_MODE,
};

export const redisConfig = env.REDIS_URL ? {
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  clusterMode: env.REDIS_CLUSTER_MODE,
  maxRetries: env.REDIS_MAX_RETRIES,
} : null;

export const cacheConfig = {
  enabled: env.ENABLE_CACHE ?? true,
  defaultTTL: env.CACHE_TTL_DEFAULT || 3600,
  propertiesTTL: env.CACHE_TTL_PROPERTIES || 1800,
  analyticsTTL: env.CACHE_TTL_ANALYTICS || 7200,
  usersTTL: env.CACHE_TTL_USERS || 900,
};

export const sentryConfig = env.ENABLE_SENTRY ? {
  dsn: env.SENTRY_DSN!,
  environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
} : null;

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS || 900000,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS || 100,
  keyPrefix: env.RATE_LIMIT_KEY_PREFIX || 'rl:',
};

export const securityConfig = {
  bcryptRounds: env.BCRYPT_ROUNDS || 12,
  helmetEnabled: env.HELMET_ENABLED ?? true,
  corsEnabled: env.CORS_ENABLED ?? true,
  corsOrigin: !env.CORS_ORIGIN || env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
};

// Log environment configuration on startup
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    nodeEnv: env.NODE_ENV,
    appEnv: env.APP_ENV,
    database: !!env.DATABASE_URL,
    redis: !!env.REDIS_URL,
    sentry: env.ENABLE_SENTRY,
    cache: env.ENABLE_CACHE,
    rateLimit: `${env.RATE_LIMIT_MAX_REQUESTS}/${env.RATE_LIMIT_WINDOW_MS}ms`,
  });
}