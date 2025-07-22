'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifySecureJWT } from '@/lib/edge-crypto';
import toast from 'react-hot-toast';

export interface UserPermission {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserRole {
  name: string;
  description?: string;
  permissions: UserPermission[];
}

export interface SecureUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  kycStatus?: string | null;
  roles?: UserRole[];
  permissions?: string[];
}

export interface SecureAuthContextType {
  user: SecureUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
  // RBAC utilities
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SecureUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Verify if the stored token is still valid
  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const payload = await verifySecureJWT(token);
      return !!payload.userId;
    } catch (error) {
      console.log('Token verification failed:', error);
      return false;
    }
  };

  // Load user data from localStorage and verify token
  const loadStoredAuth = async () => {
    if (typeof window === 'undefined') return;
    
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        const userData = JSON.parse(storedUser);
        
        // Verify the token is still valid
        try {
          const isValid = await verifySecureJWT(storedToken);
          if (isValid) {
            setUser({
              userId: userData.id || userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              isVerified: userData.isVerified,
              isAdmin: userData.isAdmin,
              kycStatus: userData.kycStatus,
              roles: userData.roles || [],
              permissions: userData.permissions || [],
            });
          } else {
            throw new Error('Token verification failed');
          }
        } catch (tokenError) {
          // Access token is invalid, try to refresh if we have a refresh token
          if (storedRefreshToken) {
            console.log('Access token expired, attempting refresh...');
            const refreshed = await attemptTokenRefresh(storedRefreshToken);
            if (!refreshed) {
              clearAuth();
            }
          } else {
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        clearAuth();
      }
    }
    setIsLoading(false);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  // Attempt to refresh the access token using refresh token
  const attemptTokenRefresh = async (currentRefreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log('Token refresh failed:', error.error);
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.tokens && data.user) {
        // Update state with new tokens and user data
        setToken(data.tokens.accessToken);
        setRefreshToken(data.tokens.refreshToken);
        setUser({
          userId: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          isVerified: data.user.isVerified,
          isAdmin: data.user.isAdmin,
          kycStatus: data.user.kycStatus,
          roles: data.user.roles || [],
          permissions: data.user.permissions || [],
        });
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        console.log('Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  // Public refresh function
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }
    
    return await attemptTokenRefresh(refreshToken);
  };

  useEffect(() => {
    setIsMounted(true);
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Use our secure db-login endpoint
      const response = await fetch('/api/auth/db-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.success && data.tokens && data.user) {
        const accessToken = data.tokens.accessToken;
        const newRefreshToken = data.tokens.refreshToken;
        
        // Verify the token we just received
        await verifySecureJWT(accessToken);
        
        setToken(accessToken);
        setRefreshToken(newRefreshToken);
        setUser({
          userId: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          isVerified: data.user.isVerified,
          isAdmin: data.user.isAdmin,
          kycStatus: data.user.kycStatus,
          roles: data.user.roles || [],
          permissions: data.user.permissions || [],
        });
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        toast.success('Login successful!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      // You could implement a /api/auth/me endpoint to refresh user data
      // For now, we'll verify the existing token
      await verifySecureJWT(token);
    } catch (error) {
      console.error('Error refreshing user:', error);
      clearAuth();
    }
  };

  // RBAC utility functions
  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some(role => role.name === roleName) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}`;
    return hasPermission(permission);
  };

  // Set up automatic token refresh (every 10 minutes)
  useEffect(() => {
    if (!user || !token || !refreshToken) return;

    const refreshInterval = setInterval(async () => {
      console.log('Attempting automatic token refresh...');
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        console.log('Automatic token refresh failed, clearing auth');
        clearAuth();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [user, token, refreshToken]);

  const value: SecureAuthContextType = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
    verifyToken,
    refreshAccessToken,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
}

export function useSecureAuth() {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}