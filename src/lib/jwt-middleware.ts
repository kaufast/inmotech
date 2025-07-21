import { NextRequest } from 'next/server';
import { verifySecureJWT } from './edge-crypto';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Extract JWT from Authorization header
export function extractJWTFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  // Check for Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Verify JWT and return user data
export async function verifyJWTFromRequest(request: NextRequest): Promise<AuthenticatedUser> {
  // Try Authorization header first
  let token = extractJWTFromHeader(request);
  
  // If no Authorization header, try cookie
  if (!token) {
    token = request.cookies.get('auth_token')?.value || null;
  }
  
  if (!token) {
    throw new AuthenticationError('No authentication token provided');
  }
  
  try {
    const payload = await verifySecureJWT(token);
    
    // Validate required fields
    if (!payload.userId || !payload.email) {
      throw new AuthenticationError('Invalid token payload');
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new AuthenticationError('Token expired', 401);
      } else if (error.message.includes('signature')) {
        throw new AuthenticationError('Invalid token signature', 401);
      }
    }
    throw new AuthenticationError('Invalid authentication token', 401);
  }
}

// Create a standardized error response
export function createAuthErrorResponse(error: AuthenticationError) {
  return new Response(JSON.stringify({
    error: error.message,
    statusCode: error.statusCode
  }), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer'
    },
  });
}

// Wrapper for protected API routes
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await verifyJWTFromRequest(request);
      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createAuthErrorResponse(error);
      }
      
      // Unexpected error - log it and return generic error
      console.error('Unexpected auth error:', error);
      return createAuthErrorResponse(
        new AuthenticationError('Authentication failed', 500)
      );
    }
  };
}