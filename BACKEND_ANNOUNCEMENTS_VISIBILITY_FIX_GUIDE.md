# 🔧 Backend Announcements Visibility Fix Guide

## 🚨 **CRITICAL ISSUE IDENTIFIED:**

League announcements created by developers/commissioners are **not visible to other league members** because the **GET endpoint for fetching announcements is missing or not working properly**.

## 🔍 **Root Cause:**

- ✅ **POST endpoint works** - You can create announcements (that's why you see them)
- ❌ **GET endpoint missing/failing** - Other users can't see announcements
- 🔧 **Frontend working correctly** - It's properly trying to fetch announcements

## 🚀 **IMMEDIATE FIX REQUIRED:**

Add this GET endpoint to your Flask backend:

```python
@app.route('/leagues/<int:league_id>/announcements', methods=['GET'])
@login_required
def get_league_announcements(league_id):
    """Get all announcements for a specific league"""
    try:
        # Check if user has access to this league
        # You can implement your own league access logic here
        # For now, we'll allow any authenticated user to see announcements
        
        # Query announcements from database
        announcements = db.session.query(Announcement).filter(
            Announcement.league_id == league_id,
            Announcement.is_active == True  # Only show active announcements
        ).order_by(
            Announcement.is_pinned.desc(),
            Announcement.created_at.desc()
        ).all()
        
        # Convert to JSON format expected by frontend
        announcements_data = []
        for announcement in announcements:
            announcements_data.append({
                'id': announcement.id,
                'title': announcement.title,
                'content': announcement.content,
                'createdBy': announcement.created_by,  # Frontend expects 'createdBy'
                'created_by': announcement.created_by,  # Also include 'created_by' for compatibility
                'created_at': announcement.created_at.isoformat(),
                'is_pinned': announcement.is_pinned,
                'pinned': announcement.is_pinned,  # Frontend also checks 'pinned'
                'coverPhoto': getattr(announcement, 'cover_photo', None),  # Optional cover photo
                'comment_count': 0  # You can implement comment counting later
            })
        
        return jsonify({'announcements': announcements_data})
        
    except Exception as e:
        print(f"Error fetching announcements: {str(e)}")
        return jsonify({'error': 'Failed to fetch announcements'}), 500
```

## 📋 **Required Database Model:**

Make sure your `Announcement` model has these fields:

```python
class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.String(100), nullable=False)  # Email or user identifier
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_pinned = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)  # For soft deletion
    cover_photo = db.Column(db.Text, nullable=True)  # Optional cover photo
    
    league = db.relationship('League', backref='announcements')
```

## 🧪 **Testing Steps:**

### **1. Test the Endpoint:**
```bash
curl -X GET "https://api.couchlytics.com/leagues/12335716/announcements" \
  -H "Cookie: clx_session=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "announcements": [
    {
      "id": 1,
      "title": "Testing the Timestamp",
      "content": "Please work",
      "createdBy": "antoinehickssales@gmail.com",
      "created_by": "antoinehickssales@gmail.com",
      "created_at": "2025-09-02T06:39:24.030350Z",
      "is_pinned": false,
      "pinned": false,
      "coverPhoto": null,
      "comment_count": 0
    }
  ]
}
```

### **2. Test with Different Users:**
- Log in as a different user
- Visit the league page
- Verify announcements are visible

### **3. Check Browser Console:**
Look for any errors when the frontend tries to fetch announcements.

## 🔧 **Additional Improvements:**

### **1. Add League Access Control:**
```python
def user_has_league_access(user_id, league_id):
    """Check if user has access to this league"""
    # Check if user is a member of this league
    membership = db.session.query(LeagueMember).filter_by(
        league_id=league_id,
        user_id=user_id
    ).first()
    
    return membership is not None
```

### **2. Add Error Handling:**
```python
@app.route('/leagues/<int:league_id>/announcements', methods=['GET'])
@login_required
def get_league_announcements(league_id):
    try:
        # Check league access
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied to this league'}), 403
        
        # Rest of the code...
        
    except Exception as e:
        logger.error(f"Error fetching announcements for league {league_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

### **3. Add Caching (Optional):**
```python
from flask_caching import Cache

@cache.memoize(timeout=300)  # Cache for 5 minutes
def get_league_announcements_cached(league_id):
    # Your announcement fetching logic here
    pass
```

## 🎯 **Priority Implementation:**

**HIGH PRIORITY** - This is blocking the core announcements feature from working for all users.

## ✅ **Verification Checklist:**

- [ ] GET endpoint implemented
- [ ] Database model has required fields
- [ ] Endpoint returns correct JSON format
- [ ] Other users can see announcements
- [ ] No console errors in browser
- [ ] Announcements display correctly on league page

## 🚨 **Common Issues & Solutions:**

### **Issue 1: 403 Forbidden**
- **Cause:** Missing authentication or league access check
- **Solution:** Ensure user is logged in and has league access

### **Issue 2: Empty announcements array**
- **Cause:** Database query not finding announcements
- **Solution:** Check database table name and column names

### **Issue 3: Frontend not displaying announcements**
- **Cause:** JSON format mismatch
- **Solution:** Ensure response matches frontend expectations

---

**Note:** This fix will immediately resolve the visibility issue. Once implemented, all league members will be able to see announcements created by commissioners and developers.
