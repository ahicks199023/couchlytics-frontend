import { 
  NotificationResponse, 
  UnreadCountResponse, 
  NotificationActionResponse,
  NotificationSettings 
} from '../types/notification';

class NotificationService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';

  // Get notifications with pagination
  async getNotifications(options: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  } = {}): Promise<NotificationResponse> {
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
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    return response.json();
  }

  // Get unread count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await fetch(`${this.baseUrl}/notifications/unread-count`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unread count: ${response.statusText}`);
    }

    return response.json();
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
