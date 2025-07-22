'use client';

import React, { useState } from 'react';
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { ModernDashboardLayout } from '@/components/layout/ModernDashboardLayout';
import { User, Lock, Shield, Mail, Eye, EyeOff, CheckCircle, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import SessionManagement from '@/components/auth/SessionManagement';

export default function UserSettings() {
  const { user, token } = useSecureAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailVerificationResend = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        toast.success('Verification email sent!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'password', label: 'Password', icon: Lock },
  ];

  return (
    <ModernDashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-white/10 mb-8">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={user?.firstName || ''}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={user?.lastName || ''}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-24"
                    disabled
                  />
                  {!user?.isVerified && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                      Unverified
                    </span>
                  )}
                  {user?.isVerified && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Verified
                    </span>
                  )}
                </div>
                {!user?.isVerified && (
                  <button
                    onClick={handleEmailVerificationResend}
                    className="mt-2 text-sm text-orange-400 hover:text-orange-300 underline"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Overview
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Email Verification</p>
                    <p className="text-sm text-gray-400">
                      {user?.isVerified ? 'Your email is verified' : 'Email not verified'}
                    </p>
                  </div>
                </div>
                <div className={`text-sm px-3 py-1 rounded-full ${
                  user?.isVerified 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {user?.isVerified ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Password Security</p>
                    <p className="text-sm text-gray-400">
                      Strong password with special characters
                    </p>
                  </div>
                </div>
                <div className="text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                  Strong
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Account Protection</p>
                    <p className="text-sm text-gray-400">
                      Account lockout after failed attempts
                    </p>
                  </div>
                </div>
                <div className="text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                  Enabled
                </div>
              </div>
              
              {/* Two-Factor Authentication */}
              <TwoFactorSetup user={user} token={token} />
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Session Management
            </h2>
            
            <SessionManagement token={token} />
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm">
                      {validatePassword(newPassword) ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span className={validatePassword(newPassword) ? "text-green-400" : "text-gray-400"}>
                        At least 8 characters
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm">
                      {newPassword === confirmPassword ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span className={newPassword === confirmPassword ? "text-green-400" : "text-gray-400"}>
                        Passwords match
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword || !validatePassword(newPassword) || newPassword !== confirmPassword}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ModernDashboardLayout>
  );
}