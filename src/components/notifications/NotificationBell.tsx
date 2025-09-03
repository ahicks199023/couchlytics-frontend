'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unread_count);
      setHasError(false);
    } catch {
      // Only log error once to avoid console spam
      if (!hasError) {
        console.warn('Notification service temporarily unavailable');
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasError]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds, or every 5 minutes if there's an error
    const interval = setInterval(fetchUnreadCount, hasError ? 300000 : 30000);
    
    return () => clearInterval(interval);
  }, [hasError, fetchUnreadCount]);

  if (isLoading) {
    return (
      <button onClick={onClick} className={`p-2 ${className}`}>
        <Bell className="h-6 w-6 text-gray-400" />
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`relative p-2 ${className}`}>
      {unreadCount > 0 ? (
        <BellRing className="h-6 w-6 text-blue-600" />
      ) : (
        <Bell className="h-6 w-6 text-gray-400" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
