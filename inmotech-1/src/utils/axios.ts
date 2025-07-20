import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Important for sending cookies
});

// Token storage
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

// Set access token
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Get access token
export const getAccessToken = () => accessToken;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Prevent multiple simultaneous refresh requests
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          // Update token and retry original request
          setAccessToken(newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear token
        setAccessToken(null);
        
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Function to refresh access token
async function refreshAccessToken(): Promise<string> {
  try {
    const response = await axios.post('/api/auth/refresh-token', {}, {
      withCredentials: true,
      timeout: 5000,
    });

    const { accessToken: newToken } = response.data;
    
    if (!newToken) {
      throw new Error('No access token received');
    }

    return newToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

// API methods
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string, rememberMe?: boolean) =>
      apiClient.post('/auth/login', { email, password, rememberMe }),
    
    register: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => apiClient.post('/auth/register', userData),
    
    logout: () => apiClient.post('/auth/logout'),
    
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, email: string, password: string, confirmPassword: string) =>
      apiClient.post('/auth/reset-password', { token, email, password, confirmPassword }),
    
    refreshToken: () => apiClient.post('/auth/refresh-token'),
  },

  // User endpoints
  user: {
    me: () => apiClient.get('/user/me'),
    
    updateProfile: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
    }) => apiClient.put('/user/profile', data),
    
    uploadKYC: (formData: FormData) =>
      apiClient.post('/user/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      
    getKYCStatus: () => apiClient.get('/user/kyc'),
  },

  // Investment endpoints
  investment: {
    create: (data: {
      propertyId: string;
      amount: number;
    }) => apiClient.post('/invest', data),
    
    getUserInvestments: () => apiClient.get('/user/investments'),
    
    getInvestmentDetails: (investmentId: string) =>
      apiClient.get(`/investments/${investmentId}`),
  },

  // Property endpoints
  property: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      location?: string;
      minValue?: number;
      maxValue?: number;
    }) => apiClient.get('/properties', { params }),
    
    getById: (id: string) => apiClient.get(`/properties/${id}`),
    
    getPublic: () => apiClient.get('/properties/public'),
  },
};

// Error handling utilities
export const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // Server responded with error status
    const message = (error.response.data as any)?.error || 'An error occurred';
    return { message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { message: 'Network error. Please check your connection.', status: 0 };
  } else {
    // Something else happened
    return { message: error.message || 'An unexpected error occurred', status: 0 };
  }
};

// Types for better TypeScript support
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export default apiClient;