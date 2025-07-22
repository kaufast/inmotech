'use client';

import React, { useState, useEffect } from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export default function RoleGuard({ 
  children, 
  role, 
  roles, 
  requireAll = false,
  fallback = null, 
  showLoading = false 
}: RoleGuardProps) {
  const { user, token } = useSecureAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || !token) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      if (user.isAdmin) {
        setHasRole(true);
        setLoading(false);
        return;
      }

      try {
        const requestBody: any = {};
        if (role) requestBody.role = role;
        if (roles) requestBody.roles = roles;

        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          
          if (roles && requireAll) {
            const hasAllRoles = roles.every(r => result.userRoles.includes(r));
            setHasRole(hasAllRoles);
          } else {
            setHasRole(result.hasRole);
          }
        } else {
          setHasRole(false);
        }
      } catch (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, token, role, roles, requireAll]);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (loading || hasRole === null) {
    return null;
  }

  return hasRole ? <>{children}</> : <>{fallback}</>;
}