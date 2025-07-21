'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Zap, Shield, TrendingDown, BarChart3, Users, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en-GB";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      // Error is handled in the context
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
        <div className="w-full max-w-6xl">
          <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              
              {/* Left Side - Your Door to Success */}
              <div className="p-12 lg:p-16 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex flex-col justify-center">
                <div className="max-w-lg">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                    Your Door to{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                      Success
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8">
                    Join thousands of investors building wealth through smart real estate investments.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Track Performance</h3>
                        <p className="text-gray-400 text-sm">Monitor your portfolio growth with real-time analytics and insights</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Secure Investments</h3>
                        <p className="text-gray-400 text-sm">Vetted opportunities with transparent risk assessment</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Community Driven</h3>
                        <p className="text-gray-400 text-sm">Connect with like-minded investors and share strategies</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Trusted by over <span className="text-white font-semibold">10,000+</span> investors worldwide
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Sign In Form */}
              <div className="p-12 lg:p-16 flex flex-col justify-center">
                <div className="max-w-sm mx-auto w-full">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                    <p className="text-gray-400">Sign in to continue to your dashboard</p>
                  </div>
                  
                  <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                      <div>
                        <input
                          {...register('email')}
                          type="text"
                          autoComplete="email"
                          className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Email address"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <input
                          {...register('password')}
                          type="password"
                          autoComplete="current-password"
                          className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Password"
                        />
                        {errors.password && (
                          <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                        )}
                      </div>
                    </div>

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
        </div>
      </div>
    </div>
  );
}