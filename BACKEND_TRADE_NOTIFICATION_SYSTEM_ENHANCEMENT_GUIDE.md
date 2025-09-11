# 🔔 Trade Notification System Enhancement Guide

## 📋 **Overview**

This guide provides comprehensive instructions for implementing a robust trade notification system that notifies users and committee members about trade-related activities. The backend has basic notification infrastructure, but needs enhancement for trade-specific notifications.

---

## 🚨 **Current Status**

### **✅ What's Working**
- Basic notification system with endpoints
- Notification database model
- User notification preferences

### **❌ What's Missing**
- Trade-specific notification triggers
- Committee member notifications
- Real-time notification delivery
- Trade notification templates

---

## 🛠️ **Backend Enhancements Needed**

### **1. Enhanced Trade Notification System**

Create `utils/trade_notifications.py`:

```python
#!/usr/bin/env python3
"""
Enhanced Trade Notification System
Handles all trade-related notifications for users and committee members
"""

from models import db, Notification, User, LeagueMember, TradeOffer
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TradeNotificationManager:
    """Enhanced trade notification manager"""
    
    @staticmethod
    def send_trade_notification(notification_type, trade_offer, additional_data=None):
        """Send trade-related notifications to appropriate users"""
        try:
            notifications_config = {
                'offer_created': {
                    'title': 'New Trade Offer Received',
                    'message': f"You received a trade offer from {trade_offer.from_user.first_name} {trade_offer.from_user.last_name}",
                    'recipients': [trade_offer.to_user_id],
                    'type': 'trade_offer_created',
                    'data': {
                        'trade_id': trade_offer.id,
                        'from_user_id': trade_offer.from_user_id,
                        'from_team_id': trade_offer.from_team_id,
                        'to_team_id': trade_offer.to_team_id,
                        'fairness_score': trade_offer.fairness_score
                    }
                },
                'offer_accepted': {
                    'title': 'Trade Offer Accepted',
                    'message': f"Your trade offer was accepted by {trade_offer.to_user.first_name} {trade_offer.to_user.last_name}",
                    'recipients': [trade_offer.from_user_id],
                    'type': 'trade_offer_accepted',
                    'data': {
                        'trade_id': trade_offer.id,
                        'to_user_id': trade_offer.to_user_id,
                        'status': 'accepted'
                    }
                },
                'offer_rejected': {
                    'title': 'Trade Offer Rejected',
                    'message': f"Your trade offer was rejected by {trade_offer.to_user.first_name} {trade_offer.to_user.last_name}",
                    'recipients': [trade_offer.from_user_id],
                    'type': 'trade_offer_rejected',
                    'data': {
                        'trade_id': trade_offer.id,
                        'to_user_id': trade_offer.to_user_id,
                        'status': 'rejected'
                    }
                },
                'offer_countered': {
                    'title': 'Counter Offer Received',
                    'message': f"You received a counter offer from {trade_offer.from_user.first_name} {trade_offer.from_user.last_name}",
                    'recipients': [trade_offer.to_user_id],
                    'type': 'trade_offer_countered',
                    'data': {
                        'trade_id': trade_offer.id,
                        'from_user_id': trade_offer.from_user_id
                    }
                },
                'committee_review': {
                    'title': 'Trade Under Committee Review',
                    'message': 'Your trade has been accepted and is now under committee review',
                    'recipients': [trade_offer.from_user_id, trade_offer.to_user_id],
                    'type': 'trade_committee_review',
                    'data': {
                        'trade_id': trade_offer.id,
                        'fairness_score': trade_offer.fairness_score,
                        'status': 'committee_review'
                    }
                },
                'committee_vote_needed': {
                    'title': 'Trade Committee Vote Required',
                    'message': f'A new trade requires committee review: {trade_offer.from_team.name} ↔ {trade_offer.to_team.name}',
                    'recipients': [],  # Will be populated with committee members
                    'type': 'trade_committee_vote_needed',
                    'data': {
                        'trade_id': trade_offer.id,
                        'from_team_id': trade_offer.from_team_id,
                        'to_team_id': trade_offer.to_team_id,
                        'fairness_score': trade_offer.fairness_score
                    }
                },
                'committee_approved': {
                    'title': 'Trade Approved by Committee',
                    'message': 'Your trade has been approved by the trade committee and is now final',
                    'recipients': [trade_offer.from_user_id, trade_offer.to_user_id],
                    'type': 'trade_committee_approved',
                    'data': {
                        'trade_id': trade_offer.id,
                        'status': 'approved',
                        'approved_by': 'committee'
                    }
                },
                'committee_rejected': {
                    'title': 'Trade Rejected by Committee',
                    'message': 'Your trade has been rejected by the trade committee',
                    'recipients': [trade_offer.from_user_id, trade_offer.to_user_id],
                    'type': 'trade_committee_rejected',
                    'data': {
                        'trade_id': trade_offer.id,
                        'status': 'rejected',
                        'rejected_by': 'committee'
                    }
                },
                'trade_expired': {
                    'title': 'Trade Offer Expired',
                    'message': 'Your trade offer has expired without a response',
                    'recipients': [trade_offer.from_user_id, trade_offer.to_user_id],
                    'type': 'trade_expired',
                    'data': {
                        'trade_id': trade_offer.id,
                        'status': 'expired'
                    }
                }
            }
            
            config = notifications_config.get(notification_type)
            if not config:
                logger.warning(f"Unknown notification type: {notification_type}")
                return
            
            # Get recipients
            recipients = config['recipients'].copy()
            
            # For committee vote needed, get all committee members
            if notification_type == 'committee_vote_needed':
                committee_members = TradeNotificationManager.get_trade_committee_members(trade_offer.league_id)
                recipients.extend(committee_members)
            
            # Create notifications for each recipient
            for user_id in recipients:
                if user_id:  # Skip None/empty user IDs
                    notification = Notification(
                        userid=user_id,
                        league_id=str(trade_offer.league_id),
                        type=config['type'],
                        title=config['title'],
                        message=config['message'],
                        data=config['data'],
                        link=f"/leagues/{trade_offer.league_id}/trades/{trade_offer.id}",
                        is_read=False,
                        created_at=datetime.utcnow()
                    )
                    db.session.add(notification)
            
            # Mark trade notifications as sent
            trade_offer.notifications_sent = True
            
            db.session.commit()
            logger.info(f"📧 Sent {notification_type} notifications to {len(recipients)} users for trade {trade_offer.id}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error sending trade notifications: {e}")
    
    @staticmethod
    def get_trade_committee_members(league_id):
        """Get all trade committee members for a league"""
        try:
            committee_members = db.session.query(LeagueMember.user_id).filter(
                LeagueMember.league_id == str(league_id),
                LeagueMember.role.in_(['trade_committee_member', 'Trade Committee Member', 'commissioner', 'Commissioner']),
                LeagueMember.is_active == True
            ).all()
            
            return [member.user_id for member in committee_members]
        except Exception as e:
            logger.error(f"Error getting trade committee members: {e}")
            return []
    
    @staticmethod
    def send_bulk_notifications(notifications_data):
        """Send multiple notifications efficiently"""
        try:
            notifications = []
            for data in notifications_data:
                notification = Notification(
                    userid=data['user_id'],
                    league_id=data.get('league_id'),
                    type=data['type'],
                    title=data['title'],
                    message=data['message'],
                    data=data.get('data', {}),
                    link=data.get('link'),
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                notifications.append(notification)
            
            db.session.add_all(notifications)
            db.session.commit()
            
            logger.info(f"📧 Sent {len(notifications)} bulk notifications")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error sending bulk notifications: {e}")
```

### **2. Update Trade System to Use Enhanced Notifications**

Update `routes/enhanced_trade_system.py`:

```python
# Add import at the top
from utils.trade_notifications import TradeNotificationManager

# Update the send_trade_notification function
def send_trade_notification(notification_type, trade_offer):
    """Send trade-related notifications using enhanced system"""
    try:
        TradeNotificationManager.send_trade_notification(notification_type, trade_offer)
    except Exception as e:
        logger.warning(f"Could not send notification: {e}")

# Update trade acceptance to send committee notifications
@enhanced_trade_bp.route('/leagues/<int:league_id>/trade-offers/<int:trade_id>/accept', methods=['POST'])
@login_required
def accept_trade_offer(league_id, trade_id):
    """Accept a trade offer"""
    try:
        # ... existing code ...
        
        # Check if trade requires committee approval or auto-approval
        if trade_offer.requires_committee_vote(league_settings):
            trade_offer.status = 'committee_review'
            trade_offer.committee_vote_needed = True
            message = 'Trade accepted and sent to committee for review'
            logger.info(f"📋 Trade {trade_id} sent to committee review")
            
            # Send notifications
            send_trade_notification('committee_review', trade_offer)
            send_trade_notification('committee_vote_needed', trade_offer)
        else:
            # Auto-approve trade
            trade_offer.auto_approved = True
            trade_offer.final_status = 'approved'
            trade_offer.approved_at = datetime.utcnow()
            trade_offer.approved_by = 'auto'
            
            # Process the trade (update rosters, etc.)
            process_approved_trade(trade_offer)
            message = 'Trade accepted and automatically approved'
            logger.info(f"✅ Trade {trade_id} auto-approved")
            
            # Send approval notification
            send_trade_notification('committee_approved', trade_offer)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'trade': trade_offer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error accepting trade offer: {str(e)}")
        return jsonify({'error': 'Failed to accept trade offer'}), 500

# Update committee voting to send decision notifications
@enhanced_trade_bp.route('/leagues/<int:league_id>/committee/vote', methods=['POST'])
@login_required
def submit_committee_vote(league_id):
    """Submit a committee vote on a trade"""
    try:
        # ... existing code ...
        
        if approve_votes >= votes_needed:
            # Trade approved by committee
            trade_offer.final_status = 'approved'
            trade_offer.approved_at = datetime.utcnow()
            trade_offer.approved_by = 'committee'
            trade_offer.status = 'approved'
            
            # Process the trade
            process_approved_trade(trade_offer)
            decision_made = True
            
            logger.info(f"✅ Trade {trade_offer_id} approved by committee")
            
            # Send approval notification
            send_trade_notification('committee_approved', trade_offer)
            
        elif reject_votes >= votes_needed:
            # Trade rejected by committee
            trade_offer.final_status = 'rejected'
            trade_offer.status = 'rejected'
            decision_made = True
            
            logger.info(f"❌ Trade {trade_offer_id} rejected by committee")
            
            # Send rejection notification
            send_trade_notification('committee_rejected', trade_offer)
        
        db.session.commit()
        
        # Send vote cast notification if decision not made
        if not decision_made:
            send_trade_notification('committee_vote_cast', trade_offer)
        
        return jsonify({
            'message': 'Vote submitted successfully',
            'vote': vote.to_dict(),
            'votes_summary': {
                'approve_count': approve_votes,
                'reject_count': reject_votes,
                'total_votes': total_votes,
                'votes_needed': votes_needed,
                'decision_made': decision_made,
                'final_status': trade_offer.final_status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error submitting committee vote: {str(e)}")
        return jsonify({'error': 'Failed to submit vote'}), 500
```

### **3. Add Trade Notification Endpoints**

Create `routes/trade_notifications.py`:

```python
#!/usr/bin/env python3
"""
Trade-specific notification endpoints
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Notification, TradeOffer
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
trade_notifications_bp = Blueprint('trade_notifications', __name__)

@trade_notifications_bp.route('/leagues/<int:league_id>/notifications/trade', methods=['GET'])
@login_required
def get_trade_notifications(league_id):
    """Get trade-related notifications for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query for trade notifications
        query = Notification.query.filter_by(
            userid=current_user.id,
            league_id=str(league_id)
        ).filter(
            Notification.type.like('trade_%')
        )
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        # Order by newest first
        query = query.order_by(Notification.created_at.desc())
        
        # Paginate
        notifications = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'notifications': [notification.to_dict() for notification in notifications.items],
            'pagination': {
                'page': notifications.page,
                'pages': notifications.pages,
                'per_page': notifications.per_page,
                'total': notifications.total,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting trade notifications: {e}")
        return jsonify({'error': 'Failed to get trade notifications'}), 500

@trade_notifications_bp.route('/leagues/<int:league_id>/notifications/trade/unread-count', methods=['GET'])
@login_required
def get_trade_notifications_unread_count(league_id):
    """Get count of unread trade notifications"""
    try:
        count = Notification.query.filter_by(
            userid=current_user.id,
            league_id=str(league_id),
            is_read=False
        ).filter(
            Notification.type.like('trade_%')
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': count
        })
        
    except Exception as e:
        logger.error(f"Error getting trade notification count: {e}")
        return jsonify({'error': 'Failed to get notification count'}), 500

@trade_notifications_bp.route('/leagues/<int:league_id>/notifications/trade/mark-all-read', methods=['PUT'])
@login_required
def mark_all_trade_notifications_read(league_id):
    """Mark all trade notifications as read for the current user"""
    try:
        updated_count = Notification.query.filter_by(
            userid=current_user.id,
            league_id=str(league_id),
            is_read=False
        ).filter(
            Notification.type.like('trade_%')
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Marked {updated_count} notifications as read'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error marking trade notifications as read: {e}")
        return jsonify({'error': 'Failed to mark notifications as read'}), 500
```

---

## 📱 **Frontend Implementation Guide**

### **1. Trade Notification Component**

Create `src/components/TradeNotificationCenter.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TradeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
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

  useEffect(() => {
    fetchTradeNotifications();
    fetchUnreadCount();
  }, [leagueId]);

  const fetchTradeNotifications = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/notifications/trade`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching trade notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/notifications/trade/unread-count`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
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
      const response = await fetch(`/api/leagues/${leagueId}/notifications/trade/mark-all-read`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading notifications...</div>
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
            No trade notifications yet
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                !notification.is_read ? 'ring-2 ring-blue-200' : ''
              }`}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
                if (notification.link) {
                  window.location.href = notification.link;
                }
              }}
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
                  {notification.data?.trade_id && (
                    <div className="text-sm text-blue-600 mt-1">
                      Trade #{notification.data.trade_id}
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
```

### **2. Notification Badge Component**

Create `src/components/NotificationBadge.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [leagueId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/notifications/trade/unread-count`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
```

---

## 📋 **Implementation Checklist**

### **Backend (⏳ Pending)**
- [ ] Create enhanced trade notification system
- [ ] Update trade endpoints to send notifications
- [ ] Add trade-specific notification endpoints
- [ ] Test notification delivery
- [ ] Add notification templates
- [ ] Implement real-time notification updates

### **Frontend (⏳ Pending)**
- [ ] Create trade notification center component
- [ ] Add notification badge to navigation
- [ ] Implement notification polling/real-time updates
- [ ] Add notification sound/visual alerts
- [ ] Test notification flow end-to-end
- [ ] Add notification preferences

---

## 🚀 **Features Included**

### **✅ Notification Types**
- **Trade Offer Created** - Notify recipient of new trade offer
- **Trade Offer Accepted** - Notify sender of acceptance
- **Trade Offer Rejected** - Notify sender of rejection
- **Committee Review** - Notify both parties of committee review
- **Committee Vote Needed** - Notify committee members of pending vote
- **Committee Decision** - Notify both parties of committee decision
- **Trade Expired** - Notify both parties of expiration

### **✅ User Experience**
- **Real-time Updates** - Notifications appear as they happen
- **Unread Count Badge** - Shows number of unread notifications
- **Notification Center** - Centralized view of all trade notifications
- **Click to Navigate** - Notifications link to relevant trade details
- **Mark as Read** - Individual and bulk read functionality

---

## 📞 **Support**

If you encounter issues during implementation:

1. **Check notification endpoints** - Verify backend endpoints are working
2. **Test notification triggers** - Ensure notifications are sent on trade events
3. **Check database** - Verify notifications are being stored correctly
4. **Test frontend integration** - Ensure notifications display properly

**Status**: Backend enhancement needed ⏳ | Frontend implementation needed ⏳
