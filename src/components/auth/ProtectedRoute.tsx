'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en-GB";
  const [isMounted, setIsMounted] = useState(false);
  const [hasLocalAuth, setHasLocalAuth] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check localStorage for client-side authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      setHasLocalAuth(!!(token && userData));
    }
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !user && !hasLocalAuth) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, hasLocalAuth, router, isMounted, locale]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Allow access if user exists OR localStorage has auth data
  if (!user && !hasLocalAuth) {
    return null;
  }

  return <>{children}</>;
}