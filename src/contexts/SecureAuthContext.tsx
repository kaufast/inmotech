'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifySecureJWT } from '@/lib/edge-crypto';
import toast from 'react-hot-toast';

export interface SecureUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  kycStatus?: string | null;
}

export interface SecureAuthContextType {
  user: SecureUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SecureUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        
        // Verify the token is still valid
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
          });
        } else {
          // Token is invalid, clear storage
          clearAuth();
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
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
        
        // Verify the token we just received
        await verifySecureJWT(accessToken);
        
        setToken(accessToken);
        setUser({
          userId: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          isVerified: data.user.isVerified,
          isAdmin: data.user.isAdmin,
          kycStatus: data.user.kycStatus,
        });
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', accessToken);
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

  const value: SecureAuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
    verifyToken,
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
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