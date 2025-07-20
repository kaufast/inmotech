import { NextRequest } from 'next/server';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, keyGenerator } = options;
  
  // Generate key for this request
  const key = keyGenerator ? keyGenerator(request) : request.ip || 'unknown';
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [k, v] of store.entries()) {
    if (v.resetTime < now) {
      store.delete(k);
    }
  }
  
  // Get or create entry for this key
  let entry = store.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    store.set(key, entry);
    
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  
  if (entry.count <= maxRequests) {
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
  
  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}