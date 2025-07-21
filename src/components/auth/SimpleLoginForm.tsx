'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function SimpleLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en-GB";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Try server-side authentication first
      const response = await fetch('/api/auth/db-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store auth data
        if (data.tokens) {
          localStorage.setItem('token', data.tokens.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        setError('✅ Login successful! Redirecting...');
        // Give a brief moment to show success message, then redirect
        setTimeout(() => {
          window.location.href = `/${locale}/dashboard`;
        }, 500);
        return;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Server-side auth error:', error);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50">
        <Link href={`/${locale}/`}>
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold text-white">inmotech</span>
          </div>
        </Link>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-gray-400">Sign in to continue to your dashboard</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Email address"
                  />
                </div>
                
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    pattern=".*"
                    className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-white/20 text-orange-500 focus:ring-orange-500" />
                  <span className="ml-2 text-gray-400">Remember me</span>
                </label>
                <Link href="#" className="text-orange-400 hover:text-orange-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 group"
                >
                  {isLoading ? 'Signing in...' : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link href={`/${locale}/register`} className="font-medium text-orange-400 hover:text-orange-300 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}