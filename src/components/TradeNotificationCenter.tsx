'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface TradeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function TradeNotificationCenter() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';

  const fetchTradeNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/notifications/trade`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 404) {
        // Backend notification system not implemented yet
        setNotifications([]);
        setError('Notification system not yet implemented on backend');
      } else {
        setError('Failed to load trade notifications');
      }
    } catch (error) {
      console.error('Error fetching trade notifications:', error);
      setError('Failed to load trade notifications');
    } finally {
      setLoading(false);
    }
  }, [leagueId, API_BASE]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/notifications/trade/unread-count`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      } else if (response.status === 404) {
        // Backend notification system not implemented yet
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [leagueId, API_BASE]);

  useEffect(() => {
    fetchTradeNotifications();
    fetchUnreadCount();
  }, [leagueId, fetchTradeNotifications, fetchUnreadCount]);

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/notifications/trade/mark-all-read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade_offer_created':
        return '📨';
      case 'trade_offer_accepted':
        return '✅';
      case 'trade_offer_rejected':
        return '❌';
      case 'trade_committee_review':
        return '👥';
      case 'trade_committee_vote_needed':
        return '🗳️';
      case 'trade_committee_approved':
        return '🎉';
      case 'trade_committee_rejected':
        return '🚫';
      case 'trade_expired':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trade_offer_created':
      case 'trade_committee_vote_needed':
        return 'border-blue-200 bg-blue-50';
      case 'trade_offer_accepted':
      case 'trade_committee_approved':
        return 'border-green-200 bg-green-50';
      case 'trade_offer_rejected':
      case 'trade_committee_rejected':
        return 'border-red-200 bg-red-50';
      case 'trade_expired':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const handleNotificationClick = (notification: TradeNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
        <button 
          onClick={fetchTradeNotifications}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Trade Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {error?.includes('not yet implemented') ? 'Notification system coming soon' : 'No trade notifications yet'}
          </div>
          <div className="text-gray-400 text-sm mt-2">
            {error?.includes('not yet implemented') 
              ? 'The notification system is being implemented by the backend team. You&apos;ll receive notifications when trade offers are created, accepted, or require committee review.'
              : 'You&apos;ll receive notifications when trade offers are created, accepted, or require committee review.'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${
                !notification.is_read ? 'ring-2 ring-blue-200' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-gray-700 mt-1">
                    {notification.message}
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                  {(notification.data as { trade_id?: number })?.trade_id && (
                    <div className="text-sm text-blue-600 mt-1">
                      Trade #{(notification.data as { trade_id: number }).trade_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
