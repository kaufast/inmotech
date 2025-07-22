import { cache } from './cache';
import { env, rateLimitConfig } from './env-validation';
import { NextRequest, NextResponse } from 'next/server';

// Rate limit result interface
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Rate limit configuration interface
interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
  message?: string;
}

// Default rate limit configuration
const defaultOptions: Required<RateLimitOptions> = {
  windowMs: rateLimitConfig.windowMs,
  maxRequests: rateLimitConfig.maxRequests,
  keyPrefix: rateLimitConfig.keyPrefix,
  message: 'Too many requests, please try again later.',
};

// Rate limiter class
class RateLimiter {
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  async check(key: string): Promise<RateLimitResult> {
    const cacheKey = `${this.options.keyPrefix}${key}`;
    const now = Date.now();
    const window = this.options.windowMs;
    const maxRequests = this.options.maxRequests;

    try {
      // Get current count and window start time
      const currentData = await cache.get<{ count: number; windowStart: number }>(cacheKey);
      
      let count = 0;
      let windowStart = now;

      if (currentData) {
        count = currentData.count;
        windowStart = currentData.windowStart;

        // Check if we're still in the same window
        if (now - windowStart >= window) {
          // Reset for new window
          count = 0;
          windowStart = now;
        }
      }

      // Increment count
      count++;

      // Calculate reset time and remaining requests
      const resetTime = windowStart + window;
      const remaining = Math.max(0, maxRequests - count);

      // Check if limit exceeded
      const allowed = count <= maxRequests;

      // Store updated count
      const ttl = Math.ceil((resetTime - now) / 1000);
      await cache.set(cacheKey, { count, windowStart }, ttl);

      // Calculate retry after time if limit exceeded
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
      };
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + window,
      };
    }
  }

  async reset(key: string): Promise<void> {
    const cacheKey = `${this.options.keyPrefix}${key}`;
    await cache.del(cacheKey);
  }
}

// Create rate limiter instances for different endpoints
export const rateLimiters = {
  // Global API rate limiter
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    keyPrefix: 'rl:api:',
  }),

  // Authentication rate limiter (more restrictive)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyPrefix: 'rl:auth:',
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Search rate limiter
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 searches per minute
    keyPrefix: 'rl:search:',
  }),

  // Property valuation rate limiter (computationally expensive)
  valuation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 valuations per minute
    keyPrefix: 'rl:valuation:',
    message: 'Too many valuation requests, please try again later.',
  }),
};

// Get client identifier for rate limiting
export function getClientId(request: NextRequest): string {
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

// Rate limit middleware
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  keyGenerator?: (request: NextRequest) => string
) {
  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    try {
      const key = keyGenerator ? keyGenerator(request) : getClientId(request);
      const result = await limiter.check(key);

      if (!result.allowed) {
        const headers = new Headers();
        headers.set('X-RateLimit-Limit', limiter['options'].maxRequests.toString());
        headers.set('X-RateLimit-Remaining', result.remaining.toString());
        headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        if (result.retryAfter) {
          headers.set('Retry-After', result.retryAfter.toString());
        }

        return NextResponse.json(
          {
            error: limiter['options'].message,
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers,
          }
        );
      }

      return null; // Continue with the request
    } catch (error) {
      console.error('❌ Rate limit middleware error:', error);
      return null; // Fail open
    }
  };
}

// Legacy exports for backward compatibility
export function rateLimit(config: { windowMs?: number; max?: number } = {}) {
  const limiter = new RateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.max,
  });

  return async (request: NextRequest): Promise<boolean> => {
    const key = getClientId(request);
    const result = await limiter.check(key);
    return result.allowed;
  };
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});

export default rateLimiters;