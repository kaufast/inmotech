import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds
  max?: number;       // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (consider Redis for production)
const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean every minute

export function rateLimit(config: RateLimitConfig = {}) {
  const windowMs = config.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = config.max || 100; // 100 requests default

  return async (request: NextRequest): Promise<boolean> => {
    // Get client identifier (IP address)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    const key = `${request.nextUrl.pathname}:${ip}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    // Get or create rate limit entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = { count: 1, resetTime };
      return true;
    }

    // Increment count
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > max) {
      return false;
    }

    return true;
  };
}

// Specific rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});