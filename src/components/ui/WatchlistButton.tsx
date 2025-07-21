'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface WatchlistButtonProps {
  projectId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  className?: string;
  showTooltip?: boolean;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  projectId,
  size = 'md',
  variant = 'default',
  className = '',
  showTooltip = true
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [isLoading, setIsLoading] = useState(false);
  
  const isLiked = isInWatchlist(projectId);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        await removeFromWatchlist(projectId);
      } else {
        await addToWatchlist(projectId);
      }
    } catch (error) {
      console.error('Watchlist action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          relative transition-all duration-200 ${sizeClasses[size]}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
          ${className}
        `}
        title={showTooltip ? (isLiked ? 'Remove from watchlist' : 'Add to watchlist') : undefined}
      >
        <Heart
          className={`
            ${iconSizes[size]} transition-all duration-200
            ${isLiked 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-400 hover:text-red-400'
            }
          `}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        group relative flex items-center justify-center rounded-xl
        transition-all duration-200 border
        ${sizeClasses[size]}
        ${isLiked
          ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
          : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-700/50 hover:border-gray-600/50 hover:text-red-400'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={showTooltip ? (isLiked ? 'Remove from watchlist' : 'Add to watchlist') : undefined}
    >
      <Heart
        className={`
          ${iconSizes[size]} transition-all duration-200
          ${isLiked ? 'fill-current' : 'group-hover:scale-110'}
        `}
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`} />
        </div>
      )}
    </button>
  );
};