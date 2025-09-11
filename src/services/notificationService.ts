import { 
  NotificationResponse, 
  UnreadCountResponse, 
  NotificationActionResponse,
  NotificationSettings 
} from '../types/notification';
import { API_BASE_URL } from '../lib/http';

class NotificationService {
  private baseUrl = API_BASE_URL;

  // Get notifications with pagination
  async getNotifications(options: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  } = {}): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.unread_only) params.append('unread_only', 'true');

      const response = await fetch(`${this.baseUrl}/notifications?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          console.warn('Notification endpoint not available, returning empty list');
          return {
            success: true,
            notifications: [],
            pagination: {
              page: 1,
              pages: 1,
              per_page: 10,
              total: 0,
              has_next: false,
              has_prev: false
            }
          };
        }
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.warn('Notification service unavailable, returning empty list:', error);
      return {
        success: true,
        notifications: [],
        pagination: {
          page: 1,
          pages: 1,
          per_page: 10,
          total: 0,
          has_next: false,
          has_prev: false
        }
      };
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/unread-count`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist (404) or server error (500), return default
        if (response.status === 404 || response.status === 500) {
          console.warn('Global notification endpoint not available, returning default count');
          return { success: true, unread_count: 0 };
        }
        throw new Error(`Failed to fetch unread count: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // If network error or JSON parsing error, return default
      console.warn('Global notification service unavailable, returning default count:', error);
      return { success: true, unread_count: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<NotificationActionResponse> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<NotificationActionResponse> {
    const response = await fetch(`${this.baseUrl}/notifications/read-all`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<NotificationActionResponse> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }

    return response.json();
  }

  // Update notification preferences
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<{
    success: boolean;
    message: string;
    notification_settings: NotificationSettings;
  }> {
    const response = await fetch(`${this.baseUrl}/user/profile/notifications`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update notification settings: ${response.statusText}`);
    }

    return response.json();
  }
}

export const notificationService = new NotificationService();
