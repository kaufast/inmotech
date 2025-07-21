import { useState, useEffect, useCallback } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  currency: string;
  expectedReturn: number;
  duration: number;
  riskLevel: string;
  propertyType: string;
  minimumInvestment: number;
  images: string[];
  status: string;
  createdAt: string;
}

interface WatchlistItem {
  id: string;
  addedAt: string;
  project: Project;
}

interface UseWatchlistReturn {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  addToWatchlist: (projectId: string) => Promise<boolean>;
  removeFromWatchlist: (projectId: string) => Promise<boolean>;
  isInWatchlist: (projectId: string) => boolean;
  refreshWatchlist: () => Promise<void>;
}

export const useWatchlist = (): UseWatchlistReturn => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/watchlist?limit=100', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      } else if (response.status === 401) {
        // User not authenticated, clear watchlist
        setWatchlist([]);
      } else {
        throw new Error('Failed to fetch watchlist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(prev => [data.watchlistItem, ...prev]);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add to watchlist');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to watchlist');
      return false;
    }
  }, []);

  const removeFromWatchlist = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user/watchlist?projectId=${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setWatchlist(prev => prev.filter(item => item.project.id !== projectId));
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove from watchlist');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from watchlist');
      return false;
    }
  }, []);

  const isInWatchlist = useCallback((projectId: string): boolean => {
    return watchlist.some(item => item.project.id === projectId);
  }, [watchlist]);

  const refreshWatchlist = useCallback(async () => {
    await fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refreshWatchlist,
  };
};