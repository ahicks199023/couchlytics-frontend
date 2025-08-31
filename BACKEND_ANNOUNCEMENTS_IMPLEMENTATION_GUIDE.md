# 🚨 BACKEND IMPLEMENTATION GUIDE: Missing Announcements GET Endpoint

## 🎯 **CRITICAL ISSUE IDENTIFIED:**

Your frontend is getting a **403 Forbidden** error when trying to fetch announcements because the **GET endpoint for announcements doesn't exist** on your backend.

**Current Status:**
- ✅ **POST endpoint exists** - You can create announcements
- ❌ **GET endpoint missing** - Can't retrieve announcements  
- 🔧 **Frontend working perfectly** - Just needs the backend endpoint

## 🚨 **IMMEDIATE ACTION REQUIRED:**

Add this missing endpoint to your Flask backend:

```python
@app.route('/leagues/<league_id>/announcements', methods=['GET'])
@login_required
def get_league_announcements(league_id):
    """Get all announcements for a specific league"""
    try:
        # Check if user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Query announcements from database
        announcements = db.session.query(Announcement).filter(
            Announcement.league_id == league_id
        ).order_by(
            Announcement.is_pinned.desc(),
            Announcement.created_at.desc()
        ).all()
        
        # Convert to JSON
        announcements_data = []
        for announcement in announcements:
            announcements_data.append({
                'id': announcement.id,
                'title': announcement.title,
                'content': announcement.content,
                'created_by': announcement.created_by,
                'created_at': announcement.created_at.isoformat(),
                'is_pinned': announcement.is_pinned
            })
        
        return jsonify({'announcements': announcements_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 📋 **REQUIRED COMPONENTS:**

### **1. Route Registration:**
Make sure this route is registered in your main Flask app or blueprint.

### **2. Database Model (if not exists):**
```python
class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_pinned = db.Column(db.Boolean, default=False)
    
    league = db.relationship('League', backref='announcements')
```

### **3. Helper Function (if not exists):**
```python
def user_has_league_access(user_id, league_id):
    """Check if user has access to this league"""
    # Implement your league access logic here
    # This could check if user is in the league, is commissioner, etc.
    return True  # Placeholder - implement your logic
```

## 🔍 **TESTING STEPS:**

### **1. Test with curl:**
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
      "title": "Welcome to the League!",
      "content": "Welcome everyone to the new season...",
      "created_by": "Commissioner Name",
      "created_at": "2025-08-31T09:00:00Z",
      "is_pinned": true
    }
  ]
}
```

### **2. Check Railway Logs:**
Look for any errors when the endpoint is called.

### **3. Verify Frontend:**
After implementing, refresh the League Home page - announcements should appear.

## 🎯 **IMPLEMENTATION PRIORITY:**

**HIGH PRIORITY** - This is blocking the announcements feature from working.

## 🔧 **COMMON ISSUES & SOLUTIONS:**

### **Issue 1: 403 Forbidden**
- **Cause:** Missing route or authentication failure
- **Solution:** Ensure route exists and authentication middleware is working

### **Issue 2: Empty Response**
- **Cause:** Database query returning no results
- **Solution:** Check if announcements exist in database and league_id matches

### **Issue 3: Database Errors**
- **Cause:** Missing table or model
- **Solution:** Create Announcement model and run migrations

## 📱 **FRONTEND INTEGRATION:**

The frontend is already implemented and working. It expects:

**Endpoint:** `GET /leagues/{leagueId}/announcements`
**Response Format:** `{announcements: [...]}`
**Authentication:** `credentials: 'include'` (session cookies)

## 🚀 **AFTER IMPLEMENTATION:**

1. **Test the endpoint** with curl
2. **Refresh the League Home page**
3. **Verify announcements appear**
4. **Test creating new announcements**

## 📞 **SUPPORT:**

If you encounter issues:
1. Check Railway logs for specific error messages
2. Verify the route is registered correctly
3. Test authentication and league access logic
4. Ensure database model exists and has data

---

**This endpoint is the missing piece that will make your announcements feature fully functional!** 🎯✨
