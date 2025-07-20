'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setAccessToken, getAccessToken } from '@/utils/axios';
// import { useToast } from '@/hooks/useToast'; // Disabled for build

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_STARTED';
  isEmailVerified: boolean;
  investmentLimit: number | null;
  totalInvested: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, password: string, confirmPassword: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  // const { showToast } = useToast(); // Disabled for build

  // Query to fetch current user
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await api.user.me();
        return response.data.user;
      } catch (error: any) {
        if (error.response?.status === 401) {
          // User is not authenticated
          return null;
        }
        throw error;
      }
    },
    enabled: isInitialized,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to refresh token on app start
        const response = await api.auth.refreshToken();
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken);
        }
      } catch (error) {
        // No valid refresh token, user needs to login
        setAccessToken(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await api.auth.login(email, password, rememberMe);
      const { user: userData, accessToken } = response.data;

      setAccessToken(accessToken);
      
      // Update query cache
      queryClient.setQueryData(['auth', 'user'], userData);
      
      // showToast('Login successful!', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      // showToast(errorMessage, 'error');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.auth.register(userData);
      // showToast('Registration successful! Please check your email to verify your account.', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      // showToast(errorMessage, 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Logout endpoint failed, but we'll still clear local state
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless
      setAccessToken(null);
      queryClient.clear();
      // showToast('Logged out successfully', 'success');
    }
  };

  const refreshUser = async () => {
    await refetchUser();
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.auth.forgotPassword(email);
      // showToast('Password reset link sent to your email', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email';
      // showToast(errorMessage, 'error');
      throw error;
    }
  };

  const resetPassword = async (
    token: string, 
    email: string, 
    password: string, 
    confirmPassword: string
  ) => {
    try {
      await api.auth.resetPassword(token, email, password, confirmPassword);
      // showToast('Password reset successful! Please log in with your new password.', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Password reset failed';
      // showToast(errorMessage, 'error');
      throw error;
    }
  };

  const isAuthenticated = !!user && !!getAccessToken();
  const isLoadingAuth = !isInitialized || isLoading;

  // Handle auth errors
  useEffect(() => {
    if (error && !isLoadingAuth) {
      console.error('Auth error:', error);
    }
  }, [error, isLoadingAuth]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoadingAuth,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireKYC?: boolean;
    redirectTo?: string;
  }
) {
  return function AuthProtectedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    // const { showToast } = useToast(); // Disabled for build

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        const redirectUrl = options?.redirectTo || '/login';
        window.location.href = redirectUrl;
        return;
      }

      if (options?.requireKYC && user && user.kycStatus !== 'APPROVED') {
        // showToast('KYC verification required to access this feature', 'error');
        window.location.href = '/dashboard/kyc';
        return;
      }
    }, [isLoading, isAuthenticated, user]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    if (options?.requireKYC && user?.kycStatus !== 'APPROVED') {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
}

// Hook for checking specific permissions
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    canInvest: user?.kycStatus === 'APPROVED' && user?.isEmailVerified,
    canAccessAdminPanel: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
    isKYCApproved: user?.kycStatus === 'APPROVED',
    isEmailVerified: user?.isEmailVerified || false,
    investmentLimit: user?.investmentLimit || 0,
    totalInvested: user?.totalInvested || 0,
    availableInvestment: (user?.investmentLimit || 0) - (user?.totalInvested || 0),
  };
};