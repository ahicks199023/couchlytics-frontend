'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/notifications/trade/unread-count`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [leagueId, API_BASE]);

  useEffect(() => {
    if (leagueId) {
      fetchUnreadCount();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [leagueId, fetchUnreadCount]);

  if (loading || !leagueId) {
    return null;
  }

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
