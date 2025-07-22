'use client';

import React, { useState } from 'react';
import { Mail, AlertTriangle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSecureAuth } from '@/contexts/SecureAuthContext';

interface EmailVerificationStatusProps {
  variant?: 'banner' | 'card' | 'inline';
  showDismiss?: boolean;
  onDismiss?: () => void;
}

export default function EmailVerificationStatus({ 
  variant = 'banner', 
  showDismiss = false,
  onDismiss 
}: EmailVerificationStatusProps) {
  const { user, refreshUser } = useSecureAuth();
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);

  // Don't show if user is verified
  if (user?.isVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('Email address not found');
      return;
    }

    // Rate limiting check on client side
    if (lastSentTime) {
      const timeDiff = Date.now() - lastSentTime.getTime();
      const minutesLeft = Math.ceil((5 * 60 * 1000 - timeDiff) / (60 * 1000));
      
      if (timeDiff < 5 * 60 * 1000) {
        toast.error(`Please wait ${minutesLeft} more minute${minutesLeft > 1 ? 's' : ''} before resending`);
        return;
      }
    }

    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Verification email sent! Check your inbox.');
        setLastSentTime(new Date());
        
        // Refresh user data to get updated reminder count
        if (refreshUser) {
          await refreshUser();
        }
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

  // Banner variant (top of dashboard)
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Email verification required</p>
              <p className="text-sm text-gray-300">
                Please verify your email address to access all features and secure your account.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black rounded-lg font-medium text-sm transition-colors"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Resend Email</span>
                </>
              )}
            </button>
            {showDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant (in settings or profile)
  if (variant === 'card') {
    return (
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-yellow-500/20 rounded-lg flex-shrink-0">
            <Mail className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Email Verification</h3>
            <p className="text-gray-400 mb-4">
              Your email address <strong>{user?.email}</strong> is not verified. 
              Verify your email to enhance security and receive important notifications.
            </p>
            
            <div className="flex items-center justify-between">
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black rounded-lg font-medium text-sm transition-colors"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Verification Email</span>
                  </>
                )}
              </button>
              
              {lastSentTime && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Email sent {lastSentTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (small notification in forms)
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">Email not verified</span>
        </div>
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          className="text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50"
        >
          {isResending ? 'Sending...' : 'Resend'}
        </button>
      </div>
    );
  }

  return null;
}

// Helper component for verification status in user menus/profiles
export function EmailVerificationBadge() {
  const { user } = useSecureAuth();

  if (user?.isVerified) {
    return (
      <div className="flex items-center space-x-1 text-green-400 text-xs">
        <CheckCircle className="w-3 h-3" />
        <span>Verified</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-yellow-400 text-xs">
      <AlertTriangle className="w-3 h-3" />
      <span>Unverified</span>
    </div>
  );
}