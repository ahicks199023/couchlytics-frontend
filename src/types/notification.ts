export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  league_id?: string;
}

export type NotificationType = 
  | 'user_joined_league'
  | 'invitation_created'
  | 'trade_offer_created'
  | 'trade_offer_accepted'
  | 'trade_offer_rejected'
  | 'trade_offer_countered'
  | 'committee_decision'
  | 'league_announcement';

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  trade_notifications: boolean;
  league_announcements: boolean;
  chat_notifications: boolean;
}

export interface NotificationPagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  success: boolean;
  unread_count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}
