'use client';

import React, { useEffect, useState } from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface SecureProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export default function SecureProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireVerified = false 
}: SecureProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, verifyToken } = useSecureAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en-GB";
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsVerifying(true);
      
      if (!isLoading && !isAuthenticated) {
        // Not authenticated, redirect to login
        router.push(`/${locale}/login`);
        return;
      }
      
      if (isAuthenticated && user) {
        // Verify the token is still valid
        const isTokenValid = await verifyToken();
        
        if (!isTokenValid) {
          // Token is invalid, redirect to login
          router.push(`/${locale}/login`);
          return;
        }
        
        // Check admin requirement
        if (requireAdmin && !user.isAdmin) {
          router.push(`/${locale}/dashboard`);
          return;
        }
        
        // Check verification requirement
        if (requireVerified && !user.isVerified) {
          router.push(`/${locale}/verify-email`);
          return;
        }
      }
      
      setIsVerifying(false);
    };

    if (!isLoading) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, requireVerified, router, locale, verifyToken]);

  // Show loading spinner while verifying
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-white mt-4">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}