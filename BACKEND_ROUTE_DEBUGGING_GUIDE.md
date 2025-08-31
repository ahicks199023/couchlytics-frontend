# 🔧 Backend Route Debugging Guide: Announcements 403 Error

## 🚨 **Current Issue:**
Your frontend is getting a **403 Forbidden** error when trying to create announcements, even after URL fixes.

## 🎯 **What We Need to Debug:**
1. **Verify the announcements endpoint exists** on your backend
2. **Check the exact route configuration**
3. **Verify authentication/authorization**
4. **Test the endpoint directly**

---

## 🔍 **Step 1: Check Your Backend Route Configuration**

### **A. Find Your Main Flask App File**
Look for files like:
- `app.py`
- `main.py`
- `server.py`
- `__init__.py` (in your main package)

### **B. Search for Announcements Routes**
In your backend code, search for these patterns:

```bash
# Search for announcement-related code
grep -r "announcements" .
grep -r "create_announcement" .
grep -r "POST.*announcements" .
grep -r "leagues.*announcements" .
```

### **C. Check Route Definitions**
Look for one of these patterns in your Flask app:

#### **Pattern 1: Direct Route (Most Likely)**
```python
@app.route('/leagues/<league_id>/announcements', methods=['POST'])
def create_announcement(league_id):
    # Your announcement creation logic
    pass
```

#### **Pattern 2: Blueprint with Prefix**
```python
# In a separate file (e.g., routes/announcements.py)
from flask import Blueprint

announcements_bp = Blueprint('announcements', __name__)

@announcements_bp.route('/leagues/<league_id>/announcements', methods=['POST'])
def create_announcement(league_id):
    pass

# In your main app file
app.register_blueprint(announcements_bp, url_prefix='/backend-api')
```

#### **Pattern 3: API Blueprint**
```python
api_bp = Blueprint('api', __name__)

@api_bp.route('/leagues/<league_id>/announcements', methods=['POST'])
def create_announcement(league_id):
    pass

app.register_blueprint(api_bp, url_prefix='/backend-api')
```

---

## 🔍 **Step 2: Check Your Backend File Structure**

### **Common Backend Structures:**
```
your-backend/
├── app.py                 # Main Flask app
├── routes/
│   ├── __init__.py
│   ├── announcements.py   # Announcement routes
│   ├── leagues.py         # League routes
│   └── auth.py           # Authentication routes
├── models/
│   └── announcement.py    # Announcement model
└── requirements.txt
```

### **Look for these files:**
- `routes/announcements.py`
- `routes/leagues.py`
- `api/announcements.py`
- `endpoints/announcements.py`

---

## 🔍 **Step 3: Check Route Registration**

### **In your main Flask app file, look for:**
```python
# Blueprint registrations
app.register_blueprint(announcements_bp)
app.register_blueprint(api_bp, url_prefix='/backend-api')
app.register_blueprint(leagues_bp)

# Or direct route registrations
@app.route('/leagues/<league_id>/announcements', methods=['POST'])
```

---

## 🔍 **Step 4: Check Authentication Middleware**

### **Look for authentication decorators:**
```python
# Common patterns
@login_required
@auth_required
@jwt_required
@token_required
@commissioner_required

# Example
@app.route('/leagues/<league_id>/announcements', methods=['POST'])
@login_required  # This might be causing the 403
def create_announcement(league_id):
    pass
```

---

## 🔍 **Step 5: Test Your Backend Endpoints**

### **A. Check if the endpoint exists:**
```bash
# Test basic connectivity
curl -X GET "https://api.couchlytics.com/health"
curl -X GET "https://api.couchlytics.com/"

# Test if the endpoint exists (should return 404 if not found, not 403)
curl -X GET "https://api.couchlytics.com/leagues/12335716/announcements"

# Test with /backend-api/ prefix
curl -X GET "https://api.couchlytics.com/backend-api/leagues/12335716/announcements"
```

### **B. Test with authentication:**
```bash
# Get your session cookie from browser
# Then test with authentication
curl -X POST "https://api.couchlytics.com/leagues/12335716/announcements" \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'
```

---

## 🔍 **Step 6: Check Backend Logs**

### **A. Railway Logs:**
1. Go to your Railway dashboard
2. Click on `couchlytics-backend`
3. Go to "Logs" tab
4. Try to create an announcement
5. Check what errors appear in the logs

### **B. Look for these log entries:**
```
# Route not found
404 Not Found: The requested URL was not found on this server

# Authentication error
401 Unauthorized: The request has not been applied because it lacks valid authentication credentials

# Permission error
403 Forbidden: The server understood the request but refuses to authorize it

# Route found but method not allowed
405 Method Not Allowed: The method is not allowed for the requested URL
```

---

## 🔍 **Step 7: Common Issues and Solutions**

### **Issue 1: Route Not Found (404)**
**Problem**: The endpoint doesn't exist
**Solution**: Add the route to your Flask app

### **Issue 2: Method Not Allowed (405)**
**Problem**: Route exists but doesn't accept POST
**Solution**: Add `methods=['POST']` to your route

### **Issue 3: Unauthorized (401)**
**Problem**: User not authenticated
**Solution**: Check authentication middleware

### **Issue 4: Forbidden (403)**
**Problem**: User authenticated but lacks permission
**Solution**: Check authorization logic

---

## 🔍 **Step 8: Quick Route Test**

### **Add this temporary route to test:**
```python
# Add this to your main Flask app file temporarily
@app.route('/test-announcements', methods=['GET', 'POST'])
def test_announcements():
    return jsonify({
        "message": "Announcements endpoint is working",
        "method": request.method,
        "timestamp": datetime.now().isoformat()
    })

# Test it
curl -X GET "https://api.couchlytics.com/test-announcements"
```

---

## 🚨 **Immediate Action Items:**

### **1. Check Your Backend Code:**
- Search for "announcements" in your backend files
- Look for route definitions
- Check blueprint registrations

### **2. Check Railway Logs:**
- Go to Railway dashboard
- Check logs when you try to create an announcement
- Look for 404, 401, 403, or 405 errors

### **3. Test Endpoints:**
- Use curl commands above to test
- Check if endpoints exist
- Verify authentication

### **4. Share Your Findings:**
- What routes you found
- What errors appear in logs
- What curl commands return

---

## 📋 **What to Report Back:**

1. **What files contain announcement routes?**
2. **What's the exact route definition?**
3. **What do Railway logs show?**
4. **What do curl commands return?**
5. **Are there any authentication decorators?**

---

## 🎯 **Expected Outcome:**

Once we identify the exact route configuration, we can:
- ✅ **Fix the frontend URL** to match your backend
- ✅ **Resolve the 403 error**
- ✅ **Get announcements working**

**Start with Step 1 and let me know what you find!** 🚀✨
