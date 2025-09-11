# 🔔 Backend Notification System Implementation Guide

## Overview
This guide provides complete implementation details for the Couchlytics notification system. The frontend is already implemented and ready - you just need to implement the backend endpoints.

## 🎯 System Architecture

### Two Notification Systems
1. **Global Notifications** - App-wide notifications (system updates, general alerts)
2. **League-Specific Trade Notifications** - Trade-related notifications within specific leagues

## 📋 Required Endpoints

### 1. Global Notification System

#### GET `/notifications/unread-count`
**Purpose**: Get unread count for global notifications
**Method**: GET
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')

**Response Format**:
```json
{
  "success": true,
  "unread_count": 5
}
```

#### GET `/notifications`
**Purpose**: Get paginated list of global notifications
**Method**: GET
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10)
- `unread_only` (optional): Filter unread only (true/false)

**Response Format**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "message": "System maintenance scheduled for tonight",
      "link": "/maintenance",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z",
      "type": "system"
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

#### PUT `/notifications/{notificationId}/read`
**Purpose**: Mark a specific notification as read
**Method**: PUT
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')

**Response Format**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### PUT `/notifications/read-all`
**Purpose**: Mark all notifications as read
**Method**: PUT
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')

**Response Format**:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 2. League-Specific Trade Notification System

#### GET `/leagues/{leagueId}/notifications/trade/unread-count`
**Purpose**: Get unread count for trade notifications in a specific league
**Method**: GET
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')
**Authorization**: User must be a member of the league

**Response Format**:
```json
{
  "success": true,
  "unread_count": 3
}
```

#### GET `/leagues/{leagueId}/notifications/trade`
**Purpose**: Get trade notifications for a specific league
**Method**: GET
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')
**Authorization**: User must be a member of the league

**Response Format**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "trade_offer_created",
      "title": "New Trade Offer",
      "message": "Team A has sent you a trade offer",
      "data": {
        "trade_id": 123,
        "from_team": "Team A",
        "to_team": "Team B"
      },
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "type": "committee_vote_needed",
      "title": "Committee Vote Required",
      "message": "A trade requires committee review",
      "data": {
        "trade_id": 124,
        "trade_teams": ["Team A", "Team B"]
      },
      "is_read": false,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### PUT `/leagues/{leagueId}/notifications/trade/mark-all-read`
**Purpose**: Mark all trade notifications as read for a specific league
**Method**: PUT
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')
**Authorization**: User must be a member of the league

**Response Format**:
```json
{
  "success": true,
  "message": "All trade notifications marked as read"
}
```

#### PUT `/notifications/{notificationId}/read`
**Purpose**: Mark a specific trade notification as read
**Method**: PUT
**Headers**: `Content-Type: application/json`
**Authentication**: Session-based (credentials: 'include')

**Response Format**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

## 🗄️ Database Schema

### Global Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Trade Notifications Table
```sql
CREATE TABLE trade_notifications (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔧 Implementation Details

### Notification Types for Trade System
```python
TRADE_NOTIFICATION_TYPES = {
    'trade_offer_created': 'New Trade Offer',
    'trade_offer_accepted': 'Trade Offer Accepted',
    'trade_offer_rejected': 'Trade Offer Rejected',
    'committee_review': 'Committee Review Required',
    'committee_vote_needed': 'Committee Vote Needed',
    'committee_approved': 'Trade Approved by Committee',
    'committee_rejected': 'Trade Rejected by Committee',
    'trade_expired': 'Trade Offer Expired'
}
```

### Python Implementation Example

#### Global Notification Service
```python
from flask import Blueprint, request, jsonify
from functools import wraps
import json

notifications_bp = Blueprint('notifications', __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Implement your authentication logic here
        # Check session, JWT, etc.
        return f(*args, **kwargs)
    return decorated_function

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@require_auth
def get_unread_count():
    try:
        user_id = get_current_user_id()  # Implement this
        unread_count = db.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE",
            (user_id,)
        ).fetchone()[0]
        
        return jsonify({
            "success": True,
            "unread_count": unread_count
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@notifications_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications():
    try:
        user_id = get_current_user_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        offset = (page - 1) * per_page
        
        query = "SELECT * FROM notifications WHERE user_id = ?"
        params = [user_id]
        
        if unread_only:
            query += " AND is_read = FALSE"
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])
        
        notifications = db.execute(query, params).fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) FROM notifications WHERE user_id = ?"
        if unread_only:
            count_query += " AND is_read = FALSE"
        
        total = db.execute(count_query, params[:1]).fetchone()[0]
        
        return jsonify({
            "success": True,
            "notifications": [dict(notification) for notification in notifications],
            "pagination": {
                "page": page,
                "pages": (total + per_page - 1) // per_page,
                "per_page": per_page,
                "total": total,
                "has_next": page * per_page < total,
                "has_prev": page > 1
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

#### Trade Notification Service
```python
@notifications_bp.route('/leagues/<int:league_id>/notifications/trade/unread-count', methods=['GET'])
@require_auth
def get_trade_unread_count(league_id):
    try:
        user_id = get_current_user_id()
        
        # Check if user is member of league
        if not is_league_member(user_id, league_id):
            return jsonify({"error": "Not authorized"}), 403
        
        unread_count = db.execute(
            "SELECT COUNT(*) FROM trade_notifications WHERE league_id = ? AND user_id = ? AND is_read = FALSE",
            (league_id, user_id)
        ).fetchone()[0]
        
        return jsonify({
            "success": True,
            "unread_count": unread_count
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@notifications_bp.route('/leagues/<int:league_id>/notifications/trade', methods=['GET'])
@require_auth
def get_trade_notifications(league_id):
    try:
        user_id = get_current_user_id()
        
        # Check if user is member of league
        if not is_league_member(user_id, league_id):
            return jsonify({"error": "Not authorized"}), 403
        
        notifications = db.execute(
            "SELECT * FROM trade_notifications WHERE league_id = ? AND user_id = ? ORDER BY created_at DESC",
            (league_id, user_id)
        ).fetchall()
        
        return jsonify({
            "success": True,
            "notifications": [dict(notification) for notification in notifications]
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 🚀 Integration Points

### When to Send Trade Notifications
1. **Trade Offer Created**: When a user submits a trade offer
2. **Trade Offer Accepted**: When a trade offer is accepted
3. **Trade Offer Rejected**: When a trade offer is rejected
4. **Committee Review Required**: When a trade needs committee review
5. **Committee Vote Needed**: When committee members need to vote
6. **Committee Decision**: When committee approves/rejects a trade
7. **Trade Expired**: When a trade offer expires

### Notification Creation Example
```python
def create_trade_notification(league_id, user_id, notification_type, title, message, data=None):
    """Create a trade notification for a user"""
    try:
        db.execute(
            "INSERT INTO trade_notifications (league_id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)",
            (league_id, user_id, notification_type, title, message, json.dumps(data) if data else None)
        )
        db.commit()
    except Exception as e:
        print(f"Error creating trade notification: {e}")

# Example usage
create_trade_notification(
    league_id=12335716,
    user_id=1,
    notification_type='trade_offer_created',
    title='New Trade Offer',
    message='Team A has sent you a trade offer',
    data={'trade_id': 123, 'from_team': 'Team A', 'to_team': 'Team B'}
)
```

## 🧪 Testing

### Test Endpoints
```bash
# Test global notification unread count
curl -X GET "https://api.couchlytics.com/notifications/unread-count" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"

# Test league-specific trade notification unread count
curl -X GET "https://api.couchlytics.com/leagues/12335716/notifications/trade/unread-count" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"
```

## 📝 Notes

1. **Authentication**: All endpoints require session-based authentication
2. **Authorization**: League-specific endpoints require league membership
3. **Error Handling**: Return appropriate HTTP status codes (200, 400, 401, 403, 500)
4. **Data Format**: Use snake_case for database fields, camelCase for JSON responses
5. **Pagination**: Implement pagination for notification lists
6. **Performance**: Consider adding database indexes on frequently queried fields

## 🎯 Frontend Integration

The frontend is already implemented and will automatically work once these endpoints are available. No frontend changes are needed!

### Frontend Components Ready:
- ✅ Global notification bell in NavBar
- ✅ League-specific notification badge in sidebar
- ✅ Trade notification center page
- ✅ Error handling and graceful fallbacks
- ✅ Real-time polling (30-second intervals)

## 🚀 Deployment Checklist

- [ ] Create database tables
- [ ] Implement all required endpoints
- [ ] Add proper authentication/authorization
- [ ] Test all endpoints
- [ ] Deploy to production
- [ ] Verify frontend integration

---

**Frontend Status**: ✅ Ready and waiting for backend implementation
**Backend Status**: 🔄 Implementation needed
**Integration**: ✅ Seamless once endpoints are available
