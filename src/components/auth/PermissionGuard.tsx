'use client';

import React, { useState, useEffect } from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { PermissionCheck } from '@/lib/rbac';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: PermissionCheck;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export default function PermissionGuard({ 
  children, 
  permission, 
  fallback = null, 
  showLoading = false 
}: PermissionGuardProps) {
  const { user, token } = useSecureAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user || !token) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      if (user.isAdmin) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ permission })
        });

        if (response.ok) {
          const { hasPermission: allowed } = await response.json();
          setHasPermission(allowed);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, token, permission]);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (loading || hasPermission === null) {
    return null;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}