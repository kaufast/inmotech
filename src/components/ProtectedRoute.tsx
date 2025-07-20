'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  requireKYC?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requireKYC = false,
  requireAdmin = false,
  redirectTo = '/login',
  fallback = <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Requires email verification
      if (!user.isVerified) {
        router.push('/verify-email');
        return;
      }

      // Requires KYC approval
      if (requireKYC && user.kycStatus !== 'approved') {
        router.push('/kyc');
        return;
      }

      // Requires admin privileges
      if (requireAdmin && !user.isAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, requireKYC, requireAdmin, redirectTo, router]);

  // Show loading state
  if (loading) {
    return <>{fallback}</>;
  }

  // Show loading while redirecting
  if (!user || 
      !user.isVerified || 
      (requireKYC && user.kycStatus !== 'approved') ||
      (requireAdmin && !user.isAdmin)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// HOC for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireKYC?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking specific permissions
export function usePermissions() {
  const { user } = useAuth();

  return {
    canInvest: user?.isVerified && user?.kycStatus === 'approved',
    canCreateProject: user?.isAdmin,
    canManageUsers: user?.isAdmin,
    isKYCRequired: !user?.kycStatus || user?.kycStatus === 'pending',
    isEmailVerified: user?.isVerified,
  };
}