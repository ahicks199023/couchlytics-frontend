# 🚨 Backend Missing Endpoints Implementation Guide

## 📋 **Overview**

This guide addresses the missing backend endpoints that are causing 404 errors in the frontend console. These endpoints are separate from the notification system and need to be implemented to provide full functionality.

## 🚨 **Missing Endpoints Identified**

Based on the frontend console errors, the following endpoints are missing:

1. **Leaderboard System**: `/leaderboard/top-users`
2. **Commissioner Tools**: `/commissioner/create-league`
3. **Admin Panel**: `/admin/leagues`
4. **Additional Admin Routes**: Various admin-related endpoints

## 🛠️ **Required Backend Endpoints**

### **Base URL**: `https://api.couchlytics.com` (or your configured API base URL)

### **🔑 CRITICAL: Authentication Method**
All endpoints must use **session-based authentication** with `credentials: 'include'`. The frontend sends cookies automatically - do NOT use Bearer tokens or API keys.

---

## 1. **Leaderboard System**

### **Get Top Users Leaderboard**
```
GET /leaderboard/top-users?limit=100
```

**Response Format:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "player1",
      "email": "player1@example.com",
      "total_points": 1250,
      "rank": 1,
      "leagues_count": 3,
      "wins": 15,
      "losses": 5,
      "win_percentage": 75.0,
      "profile_picture": "https://example.com/avatar1.jpg",
      "last_active": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "total": 150,
    "page": 1
  }
}
```

**Implementation Notes:**
- Calculate user rankings based on total points across all leagues
- Include win/loss records and win percentage
- Support pagination with limit parameter
- Cache results for better performance (update every 5 minutes)

---

## 2. **Commissioner Tools**

### **Create League Page**
```
GET /commissioner/create-league
```

**Response Format:**
```json
{
  "success": true,
  "page_data": {
    "title": "Create New League",
    "description": "Set up a new fantasy league",
    "form_fields": [
      {
        "name": "league_name",
        "type": "text",
        "label": "League Name",
        "required": true,
        "placeholder": "Enter league name"
      },
      {
        "name": "max_teams",
        "type": "number",
        "label": "Maximum Teams",
        "required": true,
        "min": 4,
        "max": 20,
        "default": 10
      }
    ],
    "permissions": {
      "can_create": true,
      "max_leagues": 5,
      "current_leagues": 2
    }
  }
}
```

**Implementation Notes:**
- Check if user has commissioner permissions
- Return form configuration and validation rules
- Include user's current league count and limits

---

## 3. **Admin Panel System**

### **Admin Leagues Management**
```
GET /admin/leagues
```

**Response Format:**
```json
{
  "success": true,
  "admin_data": {
    "title": "League Administration",
    "leagues": [
      {
        "id": 1,
        "name": "Fantasy League 1",
        "commissioner": "admin@example.com",
        "team_count": 10,
        "max_teams": 12,
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "last_activity": "2024-01-15T10:30:00Z",
        "issues": []
      }
    ],
    "statistics": {
      "total_leagues": 25,
      "active_leagues": 20,
      "inactive_leagues": 5,
      "total_users": 150
    },
    "permissions": {
      "can_manage_leagues": true,
      "can_view_analytics": true,
      "can_manage_users": true
    }
  }
}
```

**Implementation Notes:**
- Check if user has admin permissions
- Return comprehensive league management data
- Include system statistics and health metrics
- Support filtering and search functionality

---

## 4. **Additional Admin Endpoints**

### **Admin Dashboard**
```
GET /admin/dashboard
```

**Response Format:**
```json
{
  "success": true,
  "dashboard_data": {
    "title": "Admin Dashboard",
    "metrics": {
      "total_users": 150,
      "active_leagues": 20,
      "total_trades": 45,
      "system_health": "healthy"
    },
    "recent_activity": [
      {
        "type": "league_created",
        "description": "New league 'Fantasy League 3' created",
        "timestamp": "2024-01-15T10:30:00Z",
        "user": "user@example.com"
      }
    ],
    "alerts": []
  }
}
```

### **User Management**
```
GET /admin/users
```

**Response Format:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "role": "user",
      "status": "active",
      "leagues_count": 2,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

---

## 🗄️ **Database Schema Requirements**

### **Leaderboard View**
```sql
CREATE VIEW user_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.email,
    COALESCE(SUM(lt.points), 0) as total_points,
    COUNT(DISTINCT l.id) as leagues_count,
    COALESCE(SUM(lt.wins), 0) as wins,
    COALESCE(SUM(lt.losses), 0) as losses,
    CASE 
        WHEN COALESCE(SUM(lt.wins + lt.losses), 0) > 0 
        THEN ROUND((SUM(lt.wins)::float / (SUM(lt.wins + lt.losses)::float)) * 100, 2)
        ELSE 0 
    END as win_percentage,
    u.profile_picture,
    u.last_active
FROM users u
LEFT JOIN league_teams lt ON u.id = lt.user_id
LEFT JOIN leagues l ON lt.league_id = l.id
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email, u.profile_picture, u.last_active
ORDER BY total_points DESC;
```

### **Admin Permissions Table**
```sql
CREATE TABLE admin_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, permission_type)
);

-- Insert admin permissions
INSERT INTO admin_permissions (user_id, permission_type) 
SELECT id, 'admin_access' 
FROM users 
WHERE email = 'antoinehickssales@gmail.com';
```

---

## 🔧 **Implementation Priority**

### **Phase 1: Critical Endpoints (Immediate)**
1. **Leaderboard System** - `/leaderboard/top-users`
   - High user visibility
   - Relatively simple to implement
   - Good for user engagement

### **Phase 2: Commissioner Tools (Week 1)**
2. **Commissioner Pages** - `/commissioner/create-league`
   - Essential for league management
   - Moderate complexity
   - Core functionality

### **Phase 3: Admin Panel (Week 2)**
3. **Admin System** - `/admin/leagues`, `/admin/dashboard`
   - Administrative functionality
   - Higher complexity
   - Lower user impact

---

## 🧪 **Testing & Validation**

### **Test Each Endpoint:**
1. **Leaderboard Test**: Visit homepage - should load leaderboard data
2. **Commissioner Test**: Access commissioner tools - should show create league form
3. **Admin Test**: Access admin panel - should show league management interface
4. **Console Check**: No more 404 errors for these endpoints

### **Validation Checklist:**
- [ ] All endpoints return proper JSON (never HTML error pages)
- [ ] Authentication works with session cookies
- [ ] Admin endpoints check proper permissions
- [ ] Leaderboard data is accurate and up-to-date
- [ ] Error responses include proper HTTP status codes
- [ ] CORS is configured for your frontend domain

### **Performance Notes:**
- Leaderboard endpoint should be cached (5-minute TTL)
- Admin endpoints should be optimized for large datasets
- Consider pagination for user management endpoints

---

## 🚀 **Quick Implementation Template**

### **Flask Route Example:**
```python
@app.route('/leaderboard/top-users')
@login_required
def get_leaderboard():
    try:
        limit = request.args.get('limit', 100, type=int)
        
        # Get leaderboard data from database
        leaderboard_data = get_leaderboard_data(limit)
        
        return jsonify({
            "success": True,
            "users": leaderboard_data,
            "pagination": {
                "limit": limit,
                "total": len(leaderboard_data),
                "page": 1
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### **Permission Check Helper:**
```python
def check_admin_permission(user_id):
    """Check if user has admin permissions"""
    permission = AdminPermission.query.filter_by(
        user_id=user_id,
        permission_type='admin_access'
    ).first()
    return permission is not None

def check_commissioner_permission(user_id):
    """Check if user has commissioner permissions"""
    # Check if user is commissioner of any league
    commissioner_leagues = League.query.filter_by(commissioner_id=user_id).count()
    return commissioner_leagues > 0
```

---

## 📝 **Summary**

**Missing Endpoints to Implement:**
1. ✅ **Leaderboard System** - `/leaderboard/top-users`
2. ✅ **Commissioner Tools** - `/commissioner/create-league`
3. ✅ **Admin Panel** - `/admin/leagues`, `/admin/dashboard`
4. ✅ **User Management** - `/admin/users`

**Implementation Order:**
1. **Start with Leaderboard** (highest user impact)
2. **Add Commissioner Tools** (core functionality)
3. **Implement Admin Panel** (administrative features)

Once these endpoints are implemented, all 404 errors will be resolved and your frontend will have full functionality! 🚀
