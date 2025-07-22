'use client';

import React, { useState } from 'react';
import { Shield, QrCode, Key, Copy, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TwoFactorSetupProps {
  user: any;
  token: string;
  onSetupComplete?: () => void;
}

export default function TwoFactorSetup({ user, token, onSetupComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'overview' | 'setup' | 'verify' | 'complete'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate 2FA setup');
      }

      setQrCode(data.qrCode);
      setManualEntryKey(data.manualEntryKey);
      setStep('setup');
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast.error(error.message || 'Failed to initiate 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify 2FA setup');
      }

      setBackupCodes(data.backupCodes);
      setStep('complete');
      toast.success('2FA has been successfully enabled!');
      
      if (onSetupComplete) {
        onSetupComplete();
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const content = `InmoTech 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleDateString()}\nAccount: ${user?.email}\n\nBackup Codes (use these if you lose access to your authenticator app):\n\n${backupCodes.join('\n')}\n\nIMPORTANT: Store these codes in a safe place. Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inmotech-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'overview') {
    return (
      <div className="space-y-6">
        {/* 2FA Status */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-400">
                {user?.twoFactorEnabled ? 'Protect your account with 2FA' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`text-sm px-3 py-1 rounded-full ${
              user?.twoFactorEnabled 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </div>
            {!user?.twoFactorEnabled && (
              <button
                onClick={startSetup}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>

        {user?.twoFactorEnabled && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium mb-1">2FA is Active</p>
                <p className="text-sm text-gray-300">
                  Your account is protected with two-factor authentication. You'll need your authenticator app or backup codes to sign in.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Set up Two-Factor Authentication</h3>
          <p className="text-gray-400">Scan the QR code with your authenticator app</p>
        </div>

        <div className="bg-white/5 rounded-lg p-6 text-center">
          <div className="mb-4">
            <QrCode className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-2">Scan QR Code</p>
          </div>
          
          {qrCode && (
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-gray-400 mb-3">Can't scan? Enter this code manually:</p>
            <div className="flex items-center justify-center space-x-2">
              <code className="bg-gray-800 text-green-400 px-3 py-2 rounded font-mono text-sm">
                {manualEntryKey}
              </code>
              <button
                onClick={() => copyToClipboard(manualEntryKey)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={verifySetup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Enter 6-digit code from your authenticator app
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-lg text-center tracking-wider"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('overview')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">2FA Successfully Enabled!</h3>
          <p className="text-gray-400">Your account is now protected with two-factor authentication</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium mb-1">Save Your Backup Codes</p>
              <p className="text-sm text-gray-300">
                Store these backup codes in a safe place. You'll need them if you lose access to your authenticator app.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Backup Codes</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showBackupCodes ? 'Hide' : 'Show'} Codes
              </button>
              {showBackupCodes && (
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {showBackupCodes && (
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <code className="text-green-400 font-mono text-sm">{code}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setStep('overview')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Complete Setup
        </button>
      </div>
    );
  }

  return null;
}