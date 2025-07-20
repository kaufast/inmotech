import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization token provided'
      };
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return {
        success: false,
        error: 'Server configuration error'
      };
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      
      return {
        success: true,
        userId: payload.userId
      };
      
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          error: 'Token expired'
        };
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          error: 'Invalid token'
        };
      } else {
        return {
          success: false,
          error: 'Token verification failed'
        };
      }
    }

  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}