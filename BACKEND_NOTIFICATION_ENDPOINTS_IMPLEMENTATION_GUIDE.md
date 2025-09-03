# 🔔 Backend Notification Endpoints Implementation Guide

## 📋 **Overview**

This guide provides the backend implementation requirements for the Couchlytics notification system. The frontend is now ready and will gracefully handle missing endpoints, but implementing these endpoints will provide full notification functionality.

## 🚨 **Current Issues Identified**

Based on the frontend console errors, the following endpoints are missing or not working:

1. **404 Not Found**: `/api/notifications/unread-count`
2. **500 Internal Server Error**: Server-side errors on notification endpoints
3. **Invalid JSON Response**: Server returning HTML instead of JSON

## 🛠️ **Required Backend Endpoints**

### **Base URL**: `https://api.couchlytics.com` (or your configured API base URL)

### **1. Get Unread Notification Count**
```
GET /notifications/unread-count
```

**Response Format:**
```json
{
  "success": true,
  "unread_count": 5
}
```

**Implementation Notes:**
- Should return the count of unread notifications for the authenticated user
- Must be fast and lightweight (used for polling)
- Should handle authentication via session cookies

### **2. Get Notifications (Paginated)**
```
GET /notifications?page=1&per_page=10&unread_only=false
```

**Response Format:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "user_id": 123,
      "type": "trade_offer_created",
      "title": "New Trade Offer",
      "message": "You received a trade offer from John Doe",
      "data": {
        "trade_id": 456,
        "from_user": "John Doe"
      },
      "link": "/leagues/123/trades/456",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z",
      "read_at": null,
      "league_id": "123"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 3,
    "per_page": 10,
    "total": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

### **3. Mark Notification as Read**
```
PUT /notifications/{id}/read
```

**Response Format:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### **4. Mark All Notifications as Read**
```
PUT /notifications/read-all
```

**Response Format:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### **5. Delete Notification**
```
DELETE /notifications/{id}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

### **6. Update Notification Settings**
```
PUT /user/profile/notifications
```

**Request Body:**
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "trade_notifications": true,
  "league_announcements": true,
  "chat_notifications": false
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Notification settings updated",
  "notification_settings": {
    "email_notifications": true,
    "push_notifications": true,
    "trade_notifications": true,
    "league_announcements": true,
    "chat_notifications": false
  }
}
```

## 🗄️ **Database Schema Requirements**

### **Notifications Table**
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    league_id VARCHAR(50) REFERENCES leagues(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

### **Notification Settings Table**
```sql
CREATE TABLE user_notification_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    trade_notifications BOOLEAN DEFAULT TRUE,
    league_announcements BOOLEAN DEFAULT TRUE,
    chat_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 **Backend Implementation Examples**

### **Flask/Python Example**

```python
from flask import Blueprint, request, jsonify, session
from functools import wraps
import json

notifications_bp = Blueprint('notifications', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    try:
        user_id = session['user_id']
        
        # Query database for unread count
        unread_count = db.session.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query
        query = db.session.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'notifications': [notification.to_dict() for notification in notifications.items],
            'pagination': {
                'page': page,
                'pages': notifications.pages,
                'per_page': per_page,
                'total': total,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    try:
        user_id = session['user_id']
        
        notification = db.session.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read():
    try:
        user_id = session['user_id']
        
        db.session.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    try:
        user_id = session['user_id']
        
        notification = db.session.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/user/profile/notifications', methods=['PUT'])
@login_required
def update_notification_settings():
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        # Get or create notification settings
        settings = db.session.query(UserNotificationSettings).filter(
            UserNotificationSettings.user_id == user_id
        ).first()
        
        if not settings:
            settings = UserNotificationSettings(user_id=user_id)
            db.session.add(settings)
        
        # Update settings
        for key, value in data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        settings.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification settings updated',
            'notification_settings': settings.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🚀 **Notification Types to Implement**

### **Supported Notification Types:**
- `user_joined_league` - New user joined via invitation
- `invitation_created` - New league invitation created
- `trade_offer_created` - New trade offer received
- `trade_offer_accepted` - Trade offer was accepted
- `trade_offer_rejected` - Trade offer was rejected
- `trade_offer_countered` - Counter offer received
- `committee_decision` - Trade committee made decision
- `league_announcement` - New league announcement

### **Example Notification Creation:**
```python
def create_notification(user_id, notification_type, title, message, data=None, link=None, league_id=None):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {},
        link=link,
        league_id=league_id
    )
    db.session.add(notification)
    db.session.commit()
    return notification

# Example usage:
create_notification(
    user_id=123,
    notification_type='trade_offer_created',
    title='New Trade Offer',
    message='You received a trade offer from John Doe',
    data={'trade_id': 456, 'from_user': 'John Doe'},
    link='/leagues/123/trades/456',
    league_id='123'
)
```

## 🔍 **Testing the Endpoints**

### **Test Commands:**
```bash
# Test unread count
curl -X GET "https://api.couchlytics.com/notifications/unread-count" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"

# Test get notifications
curl -X GET "https://api.couchlytics.com/notifications?page=1&per_page=10" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"

# Test mark as read
curl -X PUT "https://api.couchlytics.com/notifications/1/read" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"
```

## 📝 **Implementation Checklist**

- [ ] **Database Schema**: Create notifications and notification_settings tables
- [ ] **Authentication**: Ensure all endpoints require valid session authentication
- [ ] **Unread Count Endpoint**: Implement fast, lightweight unread count endpoint
- [ ] **Notifications List**: Implement paginated notifications endpoint
- [ ] **Mark as Read**: Implement individual and bulk mark-as-read functionality
- [ ] **Delete Notifications**: Implement notification deletion
- [ ] **Settings Management**: Implement notification preferences
- [ ] **Error Handling**: Ensure proper JSON error responses
- [ ] **Performance**: Add database indexes for optimal performance
- [ ] **Testing**: Test all endpoints with proper authentication

## 🎯 **Priority Order**

1. **High Priority**: `/notifications/unread-count` (stops console errors)
2. **Medium Priority**: `/notifications` (enables notification panel)
3. **Low Priority**: Other endpoints (full functionality)

## 🚨 **Important Notes**

- **Authentication**: All endpoints must check for valid user session
- **JSON Responses**: Always return proper JSON, never HTML error pages
- **Error Handling**: Return appropriate HTTP status codes (404, 500, etc.)
- **Performance**: The unread count endpoint will be called frequently, optimize it
- **CORS**: Ensure CORS is properly configured for your frontend domain

Once these endpoints are implemented, the frontend notification system will work seamlessly with your backend! 🚀
