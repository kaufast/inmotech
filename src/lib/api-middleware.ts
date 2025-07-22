import { NextRequest, NextResponse } from 'next/server';
import { validateToken, extractToken, verifyUser } from './auth-server';
import { rateLimit } from './rate-limit';
import { corsHeaders, CorsOptions } from './cors';

export interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: { windowMs?: number; max?: number } | false;
  cors?: CorsOptions | false;
}

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

export function withMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: corsHeaders(options.cors || {})
        });
      }

      // Apply rate limiting
      if (options.rateLimit !== false) {
        const rateLimiter = rateLimit(options.rateLimit || {});
        const allowed = await rateLimiter(request);
        
        if (!allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { 
              status: 429,
              headers: corsHeaders(options.cors || {})
            }
          );
        }
      }

      // Apply authentication if required
      if (options.requireAuth) {
        const token = extractToken(request);
        
        if (!token) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { 
              status: 401,
              headers: corsHeaders(options.cors || {})
            }
          );
        }

        const payload = await validateToken(token);
        if (!payload) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { 
              status: 401,
              headers: corsHeaders(options.cors || {})
            }
          );
        }

        // Verify user still exists and is active
        const user = await verifyUser(payload.userId);
        if (!user) {
          return NextResponse.json(
            { error: 'User not found or inactive' },
            { 
              status: 401,
              headers: corsHeaders(options.cors || {})
            }
          );
        }

        // Add user to request
        (request as any).user = {
          id: user.id,
          email: user.email
        };
      }

      // Call the actual handler
      const response = await handler(request, context);

      // Apply CORS headers to response
      if (options.cors !== false && response instanceof NextResponse) {
        const headers = corsHeaders(options.cors || {});
        Object.entries(headers).forEach(([key, value]) => {
          if (value) {
            response.headers.set(key, value);
          }
        });
      }

      return response;

    } catch (error) {
      console.error('API middleware error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: corsHeaders(options.cors || {})
        }
      );
    }
  };
}