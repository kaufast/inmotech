'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailVerificationForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname?.split("/")[1] || "en-GB";
  const token = searchParams?.get('token');

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
      } else {
        setError(data.error || 'Verification failed');
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Verification email sent!');
        setEmail(''); // Clear email field
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-400">Verifying your email...</p>
        </div>
      </div>
    );
  }

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
            
            {/* Success State */}
            {isVerified && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                  <p className="text-gray-400 mb-6">
                    Your email has been successfully verified. You can now access all features of your account.
                  </p>
                </div>

                <div className="space-y-4">
                  <Link 
                    href={`/${locale}/login`}
                    className="block w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 text-center"
                  >
                    Sign In
                  </Link>
                  
                  <Link 
                    href={`/${locale}/dashboard`}
                    className="block w-full border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 text-center"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isVerified && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                  <p className="text-gray-400 mb-6">
                    {error}
                  </p>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handleResendEmail} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none relative block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your email to resend verification"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isResending}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="animate-spin w-5 h-5 mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </button>
                  </form>
                  
                  <Link 
                    href={`/${locale}/login`}
                    className="block text-center text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Manual Resend State */}
            {!token && !error && !isVerified && (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                  <p className="text-gray-400">
                    Enter your email address to receive a verification link.
                  </p>
                </div>

                <form onSubmit={handleResendEmail} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none relative block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="animate-spin w-5 h-5 mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Email'
                    )}
                  </button>

                  <div className="text-center">
                    <Link 
                      href={`/${locale}/login`}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}