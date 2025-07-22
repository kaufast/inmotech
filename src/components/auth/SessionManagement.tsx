'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Clock, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface SessionData {
  id: string;
  deviceInfo: {
    platform: string;
    browser: string;
    userAgent: string;
    loginMethod?: string;
  };
  ipAddress: string;
  location?: {
    city?: string;
    country?: string;
  };
  lastActivity: string;
  isActive: boolean;
  createdAt: string;
  isCurrent: boolean;
}

interface SessionManagementProps {
  token: string;
}

export default function SessionManagement({ token }: SessionManagementProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminating, setIsTerminating] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setIsTerminating(sessionId);
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to terminate session');
      }

      toast.success('Session terminated successfully');
      await fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    } finally {
      setIsTerminating(null);
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/sessions/terminate-others', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to terminate sessions');
      }

      toast.success('All other sessions terminated');
      await fetchSessions();
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast.error('Failed to terminate other sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getDeviceIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('mobile') || platformLower.includes('android') || platformLower.includes('ios')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (platformLower.includes('tablet') || platformLower.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
          <p className="text-sm text-gray-400">Manage your active sessions across all devices</p>
        </div>
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <button
            onClick={terminateAllOtherSessions}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Terminate All Others
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border transition-all ${
              session.isCurrent
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  session.isCurrent ? 'bg-green-500/20' : 'bg-white/10'
                }`}>
                  {getDeviceIcon(session.deviceInfo.platform)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-white">
                      {session.deviceInfo.platform} - {session.deviceInfo.browser}
                    </h4>
                    {session.isCurrent && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                    {session.deviceInfo.loginMethod === '2FA' && (
                      <div className="flex items-center space-x-1 text-blue-400">
                        <Shield className="w-3 h-3" />
                        <span className="text-xs">2FA</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {session.location?.city && session.location?.country
                          ? `${session.location.city}, ${session.location.country}`
                          : session.ipAddress}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastActivity(session.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => terminateSession(session.id)}
                  disabled={isTerminating === session.id}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isTerminating === session.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Terminate</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No active sessions found</p>
        </div>
      )}
    </div>
  );
}