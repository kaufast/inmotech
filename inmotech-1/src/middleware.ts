import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, getUserFromToken } from '@/lib/auth';

// ==================== ROUTE CONFIGURATION ====================

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/investments',
  '/api/projects',
  '/api/kyc',
  '/api/user',
  '/api/admin',
  '/dashboard'
];

// Routes that require KYC approval for investments
const KYC_REQUIRED_ROUTES = [
  '/api/investments',
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/api/admin',
];

// Developer routes (project creation/management)
const DEVELOPER_ROUTES = [
  '/api/projects'
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/payments/webhook',
  '/api/projects/public'
];

// Frontend auth routes
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// ==================== MIDDLEWARE FUNCTION ====================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and static assets
  if (isPublicRoute(pathname) || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware for webhook routes (they have their own auth)
  if (pathname.includes('/webhook')) {
    return NextResponse.next();
  }

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
      if (!token) {
        return createErrorResponse('Authentication required', 401);
      }

      // Verify and get user from token
      const user = await getUserFromToken(token);
      if (!user) {
        return createErrorResponse('Invalid or expired token', 401);
      }

      // Add user context to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('user-id', user.id);
      requestHeaders.set('user-email', user.email);
      requestHeaders.set('user-role', user.role);
      requestHeaders.set('user-kyc-status', user.kycStatus);

      // Check KYC requirements for investment routes
      if (isKYCRequiredRoute(pathname)) {
        if (user.kycStatus !== 'APPROVED') {
          return createErrorResponse('KYC verification required to access this resource', 403, {
            code: 'KYC_REQUIRED',
            kycStatus: user.kycStatus,
            message: 'Please complete your identity verification before making investments.'
          });
        }
      }

      // Check admin route access
      if (isAdminRoute(pathname)) {
        if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
          return createErrorResponse('Administrative privileges required', 403, {
            code: 'ADMIN_REQUIRED',
            userRole: user.role,
            requiredRoles: ['ADMIN', 'MODERATOR']
          });
        }
      }

      // Check developer route access for project creation
      if (isDeveloperRoute(pathname) && request.method === 'POST') {
        if (!['DEVELOPER', 'ADMIN', 'MODERATOR'].includes(user.role)) {
          return createErrorResponse('Developer privileges required to create projects', 403, {
            code: 'DEVELOPER_REQUIRED',
            userRole: user.role,
            requiredRoles: ['DEVELOPER', 'ADMIN', 'MODERATOR']
          });
        }
      }

      // Check project ownership for modifications
      if (pathname.match(/\/api\/projects\/[^\/]+$/) && ['PUT', 'DELETE'].includes(request.method)) {
        const projectId = pathname.split('/').pop();
        const hasProjectAccess = await checkProjectAccess(projectId!, user.id, user.role);
        
        if (!hasProjectAccess) {
          return createErrorResponse('Access denied. You can only modify your own projects.', 403, {
            code: 'PROJECT_ACCESS_DENIED',
            projectId
          });
        }
      }

      // Rate limiting for sensitive operations
      const rateLimitResult = await checkRateLimit(request, user.id);
      if (!rateLimitResult.success) {
        return createErrorResponse('Rate limit exceeded', 429, {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // Create response with user context
      const response = NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });

      // Add security headers
      addSecurityHeaders(response);

      return response;
    }

    // Handle frontend auth routes (redirect if already authenticated)
    if (isAuthRoute(pathname)) {
      if (token) {
        const user = await getUserFromToken(token);
        if (user) {
          const redirectTo = request.nextUrl.searchParams.get('redirectTo');
          const redirectUrl = redirectTo && redirectTo.startsWith('/') 
            ? new URL(redirectTo, request.url)
            : new URL('/dashboard', request.url);
          
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    // For non-protected routes, just add security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return createErrorResponse('Authentication error', 500);
  }
}

// ==================== ROUTE CHECKERS ====================

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes('[')) {
      // Handle dynamic routes
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.includes('[')) {
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

function isKYCRequiredRoute(pathname: string): boolean {
  return KYC_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => {
    if (route.includes('[')) {
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

function isDeveloperRoute(pathname: string): boolean {
  return DEVELOPER_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') || 
         pathname.startsWith('/static') || 
         pathname.includes('.') && 
         !pathname.startsWith('/api');
}

// ==================== ACCESS CONTROL ====================

async function checkProjectAccess(projectId: string, userId: string, userRole: string): Promise<boolean> {
  // Admins and moderators have access to all projects
  if (['ADMIN', 'MODERATOR'].includes(userRole)) {
    return true;
  }

  try {
    // Dynamic import to avoid circular dependencies
    const { default: prisma } = await import('@/lib/prisma');
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    // Users can only access their own projects
    return project?.ownerId === userId;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
}

// ==================== RATE LIMITING ====================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(request: NextRequest, userId: string): Promise<{
  success: boolean;
  retryAfter?: number;
}> {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // Define rate limits for different operations
  const rateLimits: Record<string, { maxRequests: number; windowMs: number }> = {
    'POST:/api/investments': { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 investments per hour
    'POST:/api/projects': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 projects per hour
    'POST:/api/kyc/start': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 KYC attempts per hour
    'default': { maxRequests: 100, windowMs: 60 * 60 * 1000 } // 100 requests per hour default
  };

  const routeKey = `${method}:${pathname}`;
  const limit = rateLimits[routeKey] || rateLimits['default'];
  
  const key = `${userId}:${routeKey}`;
  const now = Date.now();
  const stored = rateLimitStore.get(key);

  if (!stored || now > stored.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    });
    return { success: true };
  }

  if (stored.count >= limit.maxRequests) {
    return {
      success: false,
      retryAfter: Math.ceil((stored.resetTime - now) / 1000)
    };
  }

  // Increment count
  stored.count++;
  rateLimitStore.set(key, stored);
  
  return { success: true };
}

// ==================== SECURITY HEADERS ====================

function addSecurityHeaders(response: NextResponse): void {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CORS headers for API routes
  if (response.url.includes('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // CSP header for enhanced security
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
}

// ==================== RESPONSE HELPERS ====================

function createErrorResponse(message: string, status: number, details?: any): NextResponse {
  const response = NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    },
    { status }
  );
  
  addSecurityHeaders(response);
  return response;
}

// ==================== MIDDLEWARE CONFIG ====================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};