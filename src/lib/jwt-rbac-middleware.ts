import { NextRequest } from 'next/server';
import { verifySecureJWT } from './edge-crypto';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
}

interface RBACOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
}

/**
 * Middleware for JWT authentication with RBAC support
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verifySecureJWT(token);
    
    if (!payload.userId) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      isAdmin: payload.isAdmin || false
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required roles
 */
export function hasRequiredRoles(
  userRoles: string[], 
  requiredRoles: string[], 
  requireAll: boolean = false
): boolean {
  if (requiredRoles.length === 0) return true;
  
  return requireAll 
    ? requiredRoles.every(role => userRoles.includes(role))
    : requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has required permissions
 */
export function hasRequiredPermissions(
  userPermissions: string[], 
  requiredPermissions: string[], 
  requireAll: boolean = false
): boolean {
  if (requiredPermissions.length === 0) return true;
  
  return requireAll
    ? requiredPermissions.every(permission => userPermissions.includes(permission))
    : requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user can access resource with action
 */
export function canAccessResource(
  userPermissions: string[], 
  resource: string, 
  action: string
): boolean {
  const permission = `${resource}:${action}`;
  return userPermissions.includes(permission);
}

/**
 * Higher-order function for protecting API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(request, user, ...args);
  };
}

/**
 * Higher-order function for protecting API routes with role-based access control
 */
export function withRBAC<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>,
  options: RBACOptions = {}
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, ...args: T): Promise<Response> => {
    const {
      requiredRoles = [],
      requiredPermissions = [],
      requireAllRoles = false,
      requireAllPermissions = false
    } = options;

    // Check role requirements
    if (requiredRoles.length > 0) {
      if (!hasRequiredRoles(user.roles, requiredRoles, requireAllRoles)) {
        return new Response(JSON.stringify({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          details: {
            requiredRoles,
            userRoles: user.roles,
            requireAll: requireAllRoles
          }
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      if (!hasRequiredPermissions(user.permissions, requiredPermissions, requireAllPermissions)) {
        return new Response(JSON.stringify({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          details: {
            requiredPermissions,
            userPermissions: user.permissions,
            requireAll: requireAllPermissions
          }
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return handler(request, user, ...args);
  });
}

/**
 * Specific role-based middleware functions
 */
export function requireInvestor<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, { requiredRoles: ['investor'] });
}

export function requirePropertyManager<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, { requiredRoles: ['property_manager'] });
}

export function requireAnalyst<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, { requiredRoles: ['analyst'] });
}

export function requireAdmin<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, { requiredRoles: ['admin'] });
}

/**
 * Permission-based middleware functions
 */
export function requirePermissions<T extends any[]>(
  permissions: string[],
  requireAll: boolean = false
) {
  return (
    handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
  ) => {
    return withRBAC(handler, { 
      requiredPermissions: permissions, 
      requireAllPermissions: requireAll 
    });
  };
}

// Utility functions for common patterns
export const rbacUtils = {
  hasRequiredRoles,
  hasRequiredPermissions,
  canAccessResource,
  authenticateUser
};