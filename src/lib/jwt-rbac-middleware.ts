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
 * Main JWT verification function with RBAC support
 */
export async function verifyJWT(request: NextRequest): Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }> {
  try {
    // Extract token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }
    
    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    const payload = await verifySecureJWT(token);
    
    if (!payload.userId || !payload.email) {
      return { success: false, error: 'Invalid token payload' };
    }

    const user: AuthenticatedUser = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      isAdmin: payload.isAdmin || false
    };

    return { success: true, user };
  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { success: false, error: 'Token expired' };
      } else if (error.message.includes('signature')) {
        return { success: false, error: 'Invalid token signature' };
      }
    }
    
    return { success: false, error: 'Invalid authentication token' };
  }
}

/**
 * Middleware for JWT authentication with RBAC support (legacy compatibility)
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const result = await verifyJWT(request);
  return result.success ? result.user! : null;
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

/**
 * Route protection configurations for common endpoints
 */
export const ROUTE_PROTECTIONS = {
  // Admin routes
  ADMIN_ROUTES: {
    requiredPermissions: ['admin:read'] as string[],
    requireAllPermissions: true
  },
  
  // User management
  USER_MANAGEMENT: {
    requiredPermissions: ['user:manage'] as string[],
    requireAllPermissions: true
  },
  
  // System settings
  SYSTEM_MANAGEMENT: {
    requiredPermissions: ['system:manage'] as string[],
    requireAllPermissions: true
  },
  
  // Analytics access
  ANALYTICS_READ: {
    requiredPermissions: ['analytics:read'] as string[],
    requireAllPermissions: true
  },
  
  // Audit logs
  AUDIT_READ: {
    requiredPermissions: ['audit:read'] as string[],
    requireAllPermissions: true
  },
  
  // Role management
  ROLE_MANAGEMENT: {
    requiredPermissions: ['role:manage'] as string[],
    requireAllPermissions: true
  },
  
  // Session monitoring
  SESSION_READ: {
    requiredPermissions: ['session:read'] as string[],
    requireAllPermissions: true
  }
};

/**
 * Simplified middleware wrappers for common permissions
 */
export function requireAdminAccess<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.ADMIN_ROUTES);
}

export function requireUserManagement<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.USER_MANAGEMENT);
}

export function requireSystemManagement<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.SYSTEM_MANAGEMENT);
}

export function requireAnalyticsRead<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.ANALYTICS_READ);
}

export function requireAuditRead<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.AUDIT_READ);
}

export function requireRoleManagement<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.ROLE_MANAGEMENT);
}

export function requireSessionRead<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return withRBAC(handler, ROUTE_PROTECTIONS.SESSION_READ);
}

// Utility functions for common patterns
export const rbacUtils = {
  hasRequiredRoles,
  hasRequiredPermissions,
  canAccessResource,
  authenticateUser,
  verifyJWT
};