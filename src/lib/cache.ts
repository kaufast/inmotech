import Redis from 'ioredis';
import { env, redisConfig, cacheConfig } from './env-validation';

// Redis client instance
let redis: Redis | null = null;
let isRedisConnected = false;

// Fallback in-memory cache for development or when Redis is unavailable
class InMemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private ttl: number;

  constructor(defaultTTL: number = 3600) {
    this.ttl = defaultTTL * 1000; // Convert to milliseconds
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl ? ttl * 1000 : this.ttl);
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flushall(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (only supports * wildcard)
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
}

// Fallback cache instance
const memoryCache = new InMemoryCache(cacheConfig.defaultTTL);

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  if (!redisConfig || !cacheConfig.enabled) {
    console.log('📦 Using in-memory cache (Redis disabled)');
    return;
  }

  try {
    const { url, password, db, clusterMode, maxRetries } = redisConfig;
    redis = new Redis({
      ...(url ? { url } : {}),
      ...(password ? { password } : {}),
      db,
      maxRetriesPerRequest: maxRetries,
      lazyConnect: true,
      // Connection event handlers
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });

    // Event handlers
    redis.on('connect', () => {
      isRedisConnected = true;
      if (env.DEBUG_REDIS) {
        console.log('🔗 Redis connected');
      }
    });

    redis.on('ready', () => {
      isRedisConnected = true;
      if (env.DEBUG_REDIS) {
        console.log('✅ Redis ready');
      }
    });

    redis.on('error', (error) => {
      isRedisConnected = false;
      console.error('❌ Redis error:', error.message);
      
      // Don't throw in production, fallback to memory cache
      if (env.NODE_ENV !== 'production') {
        console.warn('⚠️  Falling back to in-memory cache');
      }
    });

    redis.on('close', () => {
      isRedisConnected = false;
      if (env.DEBUG_REDIS) {
        console.log('🔌 Redis connection closed');
      }
    });

    // Test connection
    await redis.connect();
    console.log('📦 Redis cache initialized');
    
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    console.log('📦 Falling back to in-memory cache');
    redis = null;
    isRedisConnected = false;
  }
}

// Cache interface
interface CacheInterface {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  flushPattern(pattern: string): Promise<void>;
  flush(): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

// Cache implementation
class CacheManager implements CacheInterface {
  private getClient() {
    return redis && isRedisConnected ? redis : memoryCache;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const value = await client.get(key);
      
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache get error:', error);
      }
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const client = this.getClient();
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (redis && isRedisConnected) {
        if (ttl) {
          await redis.setex(key, ttl, serialized);
        } else {
          await redis.set(key, serialized);
        }
      } else {
        await memoryCache.set(key, value, ttl);
      }
      
      if (env.DEBUG_CACHE) {
        console.log(`📦 Cache set: ${key} (TTL: ${ttl || 'default'})`);
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache set error:', error);
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = this.getClient();
      
      if (redis && isRedisConnected) {
        await redis.del(key);
      } else {
        await memoryCache.del(key);
      }
      
      if (env.DEBUG_CACHE) {
        console.log(`🗑️ Cache deleted: ${key}`);
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache delete error:', error);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (redis && isRedisConnected) {
        const exists = await redis.exists(key);
        return exists === 1;
      } else {
        const value = await memoryCache.get(key);
        return value !== null;
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache exists error:', error);
      }
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (redis && isRedisConnected) {
        await redis.expire(key, ttl);
      }
      // In-memory cache doesn't support changing TTL after set
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache expire error:', error);
      }
    }
  }

  async flushPattern(pattern: string): Promise<void> {
    try {
      const client = this.getClient();
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        if (redis && isRedisConnected) {
          await redis.del(...keys);
        } else {
          for (const key of keys) {
            await memoryCache.del(key);
          }
        }
      }
      
      if (env.DEBUG_CACHE) {
        console.log(`🗑️ Cache flushed pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache flush pattern error:', error);
      }
    }
  }

  async flush(): Promise<void> {
    try {
      const client = this.getClient();
      
      if (redis && isRedisConnected) {
        await redis.flushall();
      } else {
        await memoryCache.flushall();
      }
      
      if (env.DEBUG_CACHE) {
        console.log('🗑️ Cache flushed all');
      }
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache flush error:', error);
      }
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      if (env.DEBUG_CACHE) {
        console.error('❌ Cache keys error:', error);
      }
      return [];
    }
  }
}

// Cache instance
export const cache = new CacheManager();

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userPermissions: (id: string) => `user:permissions:${id}`,
  userSessions: (id: string) => `user:sessions:${id}`,
  
  property: (id: string) => `property:${id}`,
  propertySearch: (params: string) => `property:search:${params}`,
  propertyAnalytics: (timeframe: string) => `property:analytics:${timeframe}`,
  propertiesByCity: (city: string) => `properties:city:${city}`,
  
  investment: (id: string) => `investment:${id}`,
  investmentOpportunity: (id: string) => `opportunity:${id}`,
  investmentPortfolio: (userId: string) => `portfolio:${userId}`,
  investmentAnalytics: (userId: string, period: string) => `investment:analytics:${userId}:${period}`,
  
  valuation: (propertyId: string) => `valuation:${propertyId}`,
  marketTrends: (city: string) => `market:trends:${city}`,
  
  session: (token: string) => `session:${token}`,
  rateLimit: (key: string) => `rl:${key}`,
  
  api: (endpoint: string, params?: string) => params ? `api:${endpoint}:${params}` : `api:${endpoint}`,
};

// Cache decorators and utilities
export function withCache<T>(
  key: string,
  ttl: number = cacheConfig.defaultTTL,
  generateKey?: (...args: any[]) => string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateKey ? generateKey(...args) : key;
      
      // Try to get from cache
      const cached = await cache.get<T>(cacheKey);
      if (cached !== null) {
        if (env.DEBUG_CACHE) {
          console.log(`📦 Cache hit: ${cacheKey}`);
        }
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(cacheKey, result, ttl);
      
      if (env.DEBUG_CACHE) {
        console.log(`📦 Cache miss, stored: ${cacheKey}`);
      }
      
      return result;
    };
  };
}

// Cache warming utilities
export async function warmCache() {
  if (!cacheConfig.enabled) return;
  
  try {
    console.log('🔥 Warming cache...');
    
    // Warm commonly accessed data
    // This would typically include:
    // - Active properties
    // - Popular investment opportunities  
    // - Market data
    // - User permissions
    
    console.log('✅ Cache warming completed');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
}

// Cache health check
export async function checkCacheHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  type: 'redis' | 'memory';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  const testKey = 'health_check';
  const testValue = 'ok';
  
  try {
    await cache.set(testKey, testValue, 10); // 10 second TTL
    const retrieved = await cache.get(testKey);
    await cache.del(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('Cache value mismatch');
    }
    
    return {
      status: 'healthy',
      type: redis && isRedisConnected ? 'redis' : 'memory',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: redis && isRedisConnected ? 'redis' : 'memory',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown
export async function shutdownCache(): Promise<void> {
  try {
    if (redis) {
      await redis.quit();
      console.log('✅ Redis connection closed gracefully');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
}

// Auto-initialize cache on module load
if (typeof window === 'undefined') {
  initializeRedis().catch((error) => {
    console.error('❌ Failed to initialize cache:', error);
  });
}

export default cache;