# 🔧 Comprehensive Backend Guide: API Unification & Endpoint Implementation

## 🎯 **Overview**

This guide addresses the **API domain mismatch issue** that was causing 403 errors across multiple frontend features. The frontend has been updated to use a unified `API_BASE` configuration (`https://api.couchlytics.com`) instead of mixed `/backend-api/` relative URLs.

## 🚨 **Critical Issues Identified**

### **1. API Domain Mismatch (FIXED)**
- **Frontend was using**: Mixed API configurations
- **Trade Calculator**: ✅ `https://api.couchlytics.com/leagues/...`
- **Other Features**: ❌ `/backend-api/leagues/...` (relative URLs)
- **Result**: 403 Forbidden errors, requests never reaching backend

### **2. Missing Backend Endpoints**
Many frontend features are calling endpoints that don't exist on the backend, causing 404/403 errors.

## 🔧 **Frontend Fixes Implemented**

✅ **All files updated** to use `API_BASE` from `@/lib/config`  
✅ **Unified API configuration** across entire frontend  
✅ **Consistent domain usage** (`https://api.couchlytics.com`)  
✅ **Build successful** with no errors  

## 📋 **Required Backend Endpoints**

### **A. Admin System Management**

#### **1. System Statistics**
```
GET /admin/system/stats
```
**Purpose**: Get system-wide statistics for admin dashboard  
**Response**: 
```json
{
  "stats": {
    "total_users": 1250,
    "active_users": 890,
    "total_leagues": 156,
    "active_leagues": 142,
    "total_trades": 2340,
    "total_messages": 15600
  }
}
```

#### **2. System Users Management**
```
GET /admin/system/users?page={page}&search={search}
```
**Purpose**: Get paginated list of system users with search  
**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-20T14:22:00Z",
      "is_active": true,
      "leagues_count": 3,
      "leagues_as_commissioner": 1
    }
  ],
  "total_pages": 5,
  "current_page": 1
}
```

#### **3. Update User Role**
```
PUT /admin/system/users/{userId}/role
```
**Purpose**: Change user's system role  
**Body**:
```json
{
  "role": "admin"
}
```

#### **4. Toggle User Status**
```
POST /admin/system/users/{userId}/toggle-status
```
**Purpose**: Activate/deactivate user accounts  
**Response**: `{"success": true, "new_status": "inactive"}`

### **B. User Profile Management**

#### **1. Get User Profile**
```
GET /user/profile
```
**Purpose**: Get current user's profile information  
**Response**:
```json
{
  "profile": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "last_username_change": "2024-01-01T00:00:00Z",
    "notification_settings": {
      "email_notifications": true,
      "push_notifications": true,
      "trade_notifications": true,
      "league_announcements": true,
      "chat_notifications": true
    },
    "subscription": {
      "status": "premium",
      "expires_at": "2024-12-31T23:59:59Z",
      "auto_renew": true
    },
    "leagues_as_commissioner": [
      {
        "id": 123,
        "name": "Fantasy League 2024",
        "season_year": 2024,
        "member_count": 12
      }
    ]
  }
}
```

#### **2. Check Username Availability**
```
POST /user/username/check
```
**Purpose**: Verify if username is available  
**Body**: `{"username": "newusername"}`  
**Response**: `{"available": true}`

#### **3. Update Personal Information**
```
PUT /user/profile/personal
```
**Purpose**: Update user's personal details  
**Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "newusername"
}
```

#### **4. Update Notification Settings**
```
PUT /user/profile/notifications
```
**Purpose**: Update user's notification preferences  
**Body**:
```json
{
  "email_notifications": true,
  "push_notifications": false,
  "trade_notifications": true,
  "league_announcements": true,
  "chat_notifications": false
}
```

#### **5. Request Password Reset**
```
POST /user/password-reset-request
```
**Purpose**: Send password reset email  
**Body**: `{"email": "user@example.com"}`

### **C. League Commissioner Tools**

#### **1. League Users Management**
```
GET /leagues/{leagueId}/commissioner/users
```
**Purpose**: Get all users in a league with their roles  
**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "user_id": 123,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "commissioner",
      "joined_at": "2024-01-15T10:30:00Z",
      "team_id": 4,
      "is_active": true
    }
  ]
}
```

#### **2. League Teams Management**
```
GET /leagues/{leagueId}/commissioner/teams
```
**Purpose**: Get all teams in a league  
**Response**:
```json
{
  "teams": [
    {
      "id": 4,
      "name": "Bengals",
      "abbreviation": "CIN",
      "city": "Cincinnati",
      "conference": "AFC",
      "division": "North"
    }
  ]
}
```

#### **3. Update User Role in League**
```
PUT /leagues/{leagueId}/commissioner/users/{userId}/role
```
**Purpose**: Change user's role within a league  
**Body**: `{"role": "co-commissioner"}`

#### **4. Assign User to Team**
```
PUT /leagues/{leagueId}/commissioner/users/{userId}/team
```
**Purpose**: Assign user to a specific team  
**Body**: `{"team_id": 4}`

#### **5. League Trades Management**
```
GET /leagues/{leagueId}/commissioner/trades
```
**Purpose**: Get all trades in a league for commissioner review  
**Response**:
```json
{
  "trades": [
    {
      "id": 1,
      "team_a_id": 4,
      "team_b_id": 5,
      "team_a_name": "Bengals",
      "team_b_name": "Browns",
      "status": "pending",
      "created_at": "2024-01-20T10:30:00Z",
      "updated_at": "2024-01-20T10:30:00Z",
      "trade_value_a": 150,
      "trade_value_b": 145,
      "players_involved": 3,
      "draft_picks_involved": 0
    }
  ]
}
```

#### **6. League Invites Management**
```
GET /leagues/{leagueId}/invites
```
**Purpose**: Get all pending invites for a league  
**Response**:
```json
{
  "invites": [
    {
      "id": 1,
      "email": "newuser@example.com",
      "role": "user",
      "team_id": null,
      "invite_code": "ABC123",
      "created_at": "2024-01-20T10:30:00Z",
      "expires_at": "2024-01-27T10:30:00Z",
      "used_at": null,
      "is_active": true
    }
  ]
}
```

#### **7. Create League Invite**
```
POST /leagues/{leagueId}/invites
```
**Purpose**: Send new league invitation  
**Body**:
```json
{
  "email": "newuser@example.com",
  "role": "user",
  "team_id": null
}
```

#### **8. Revoke League Invite**
```
DELETE /leagues/{leagueId}/invites/{inviteId}
```
**Purpose**: Cancel pending invitation

#### **9. League Settings Management**
```
GET /leagues/{leagueId}/commissioner/settings
```
**Purpose**: Get league configuration settings  
**Response**:
```json
{
  "settings": {
    "league_id": "12335716",
    "name": "Fantasy League 2024",
    "season_year": 2024,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-20T10:30:00Z",
    "is_active": true,
    "max_teams": 12,
    "scoring_type": "PPR",
    "draft_type": "snake",
    "trade_deadline": "2024-11-15T23:59:59Z",
    "playoff_teams": 6,
    "regular_season_weeks": 14
  }
}
```

### **D. Trade Block Functionality**

#### **1. Get Trade Block Players**
```
GET /leagues/{leagueId}/trade-block?position={position}
```
**Purpose**: Get players listed on trade block  
**Response**:
```json
{
  "players": [
    {
      "id": 1,
      "player_id": 123,
      "player_name": "Joe Burrow",
      "position": "QB",
      "team": "Bengals",
      "owner_name": "John Doe",
      "owner_id": 1,
      "asking_price": "Looking for WR depth",
      "notes": "Open to offers",
      "listed_at": "2024-01-20T10:30:00Z",
      "position_rank": 5,
      "overall_rank": 12
    }
  ]
}
```

#### **2. Get Trade Block Comments**
```
GET /leagues/{leagueId}/trade-block/comments
```
**Purpose**: Get discussion comments for trade block  
**Response**:
```json
{
  "comments": [
    {
      "id": 1,
      "user_name": "John Doe",
      "comment": "Great player, what are you looking for?",
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

#### **3. Add Trade Block Comment**
```
POST /leagues/{leagueId}/trade-block/comments
```
**Purpose**: Add new comment to trade block discussion  
**Body**: `{"comment": "Interested in this player"}`

#### **4. Send Trade Offer from Trade Block**
```
POST /leagues/{leagueId}/trades/offer
```
**Purpose**: Send trade offer for player on trade block  
**Body**:
```json
{
  "to_user_id": 2,
  "players_wanted": [123],
  "message": "Trade offer from trade block"
}
```

### **E. League Announcements (Already Fixed)**

#### **1. Create League Announcement**
```
POST /leagues/{leagueId}/announcements
```
**Purpose**: Create new league announcement  
**Body**:
```json
{
  "title": "League Update",
  "content": "Important information for all members",
  "pinned": false
}
```

## 🗄️ **Database Schema Requirements**

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_username_change TIMESTAMP
);
```

### **User Notification Settings**
```sql
CREATE TABLE user_notification_settings (
  user_id INTEGER REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  trade_notifications BOOLEAN DEFAULT true,
  league_announcements BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id)
);
```

### **League Memberships**
```sql
CREATE TABLE league_memberships (
  id SERIAL PRIMARY KEY,
  league_id VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'user',
  team_id INTEGER,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### **League Invites**
```sql
CREATE TABLE league_invites (
  id SERIAL PRIMARY KEY,
  league_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  team_id INTEGER,
  invite_code VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### **Trade Block**
```sql
CREATE TABLE trade_block (
  id SERIAL PRIMARY KEY,
  league_id VARCHAR(50) NOT NULL,
  player_id INTEGER NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  asking_price TEXT,
  notes TEXT,
  listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### **Trade Block Comments**
```sql
CREATE TABLE trade_block_comments (
  id SERIAL PRIMARY KEY,
  trade_block_id INTEGER REFERENCES trade_block(id),
  user_id INTEGER REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 **Authentication & Authorization**

### **Required Middleware**
```python
from functools import wraps
from flask import request, jsonify, current_app
from flask_login import current_user, login_required

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
        if not current_user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

def commissioner_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
        league_id = kwargs.get('league_id')
        if not user_is_commissioner(current_user.id, league_id):
            return jsonify({"error": "Commissioner access required"}), 403
        return f(*args, **kwargs)
    return decorated_function
```

### **Authorization Functions**
```python
def user_is_commissioner(user_id, league_id):
    """Check if user is commissioner of the specified league"""
    membership = LeagueMembership.query.filter_by(
        user_id=user_id,
        league_id=league_id,
        role='commissioner'
    ).first()
    return membership is not None

def user_has_league_access(user_id, league_id):
    """Check if user has access to the specified league"""
    membership = LeagueMembership.query.filter_by(
        user_id=user_id,
        league_id=league_id
    ).first()
    return membership is not None
```

## 🧪 **Testing Commands**

### **Test Admin Endpoints**
```bash
# Test system stats
curl -X GET "https://api.couchlytics.com/admin/system/stats" \
  -H "Cookie: your-session-cookie"

# Test users list
curl -X GET "https://api.couchlytics.com/admin/system/users?page=1&search=" \
  -H "Cookie: your-session-cookie"
```

### **Test Profile Endpoints**
```bash
# Test profile fetch
curl -X GET "https://api.couchlytics.com/user/profile" \
  -H "Cookie: your-session-cookie"

# Test username check
curl -X POST "https://api.couchlytics.com/user/username/check" \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

### **Test Commissioner Endpoints**
```bash
# Test league users
curl -X GET "https://api.couchlytics.com/leagues/12335716/commissioner/users" \
  -H "Cookie: your-session-cookie"

# Test league teams
curl -X GET "https://api.couchlytics.com/leagues/12335716/commissioner/teams" \
  -H "Cookie: your-session-cookie"
```

## 🚀 **Implementation Priority**

### **High Priority (Fix First)**
1. **Admin System Endpoints** - System management functionality
2. **User Profile Endpoints** - Profile management and settings
3. **Commissioner Tools** - League management functionality

### **Medium Priority**
1. **Trade Block Endpoints** - Trade discovery functionality
2. **League Invites** - Member recruitment system

### **Low Priority**
1. **Advanced Features** - Additional commissioner tools
2. **Analytics Endpoints** - Data insights and reporting

## 📝 **Summary of Required Changes**

1. **Create missing database tables** for users, notifications, memberships, invites, trade block
2. **Implement all API endpoints** listed above with proper authentication
3. **Add authorization middleware** for admin and commissioner access
4. **Test all endpoints** to ensure 200 responses
5. **Update CORS configuration** to allow requests from `www.couchlytics.com`

## 🔧 **Quick Implementation Steps**

```bash
# 1. Create database migrations
flask db migrate -m "Add user management tables"
flask db migrate -m "Add league management tables"
flask db migrate -m "Add trade block tables"

# 2. Apply migrations
flask db upgrade

# 3. Implement API endpoints
# 4. Test with curl commands
# 5. Verify frontend functionality
```

Once these backend changes are implemented, the frontend should:
- ✅ **No more 403 errors** for any functionality
- ✅ **All API calls** go to correct backend domain
- ✅ **Complete functionality** for admin, profile, and commissioner tools
- ✅ **Unified API configuration** across entire application

---

**Priority**: 🔴 **HIGH** - This is blocking multiple frontend features  
**Estimated Implementation Time**: 2-3 days for full functionality  
**Impact**: Complete resolution of API domain mismatch issues
