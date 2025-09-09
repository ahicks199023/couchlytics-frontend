# 🔧 Backend Login 500 Error Fix Guide

## 🚨 **Issue Summary**
The frontend is receiving a **500 Internal Server Error** when attempting to log in existing users via the invitation flow. This prevents users from joining leagues after successful authentication.

## 🔍 **Error Details**
- **Endpoint**: `POST /auth/login`
- **Status**: 500 (Internal Server Error)
- **Context**: User trying to login after invitation registration fails
- **Frontend Error**: `Request failed with status code 500`

## 🎯 **Root Cause Analysis**

### **Most Likely Causes:**

1. **Database Connection Issues**
   - Database server down or unreachable
   - Connection pool exhausted
   - Database credentials expired

2. **Session Management Problems**
   - Session store configuration issues
   - Redis/Memcached connection problems
   - Session cookie handling errors

3. **Authentication Logic Errors**
   - Password hashing/verification failures
   - User lookup database queries failing
   - JWT token generation issues

4. **Missing Dependencies**
   - Required packages not installed
   - Environment variables missing
   - Configuration files corrupted

5. **Backend Code Issues**
   - Unhandled exceptions in login route
   - Missing error handling
   - Type conversion errors

## 🔧 **Step-by-Step Fix Process**

### **Step 1: Check Backend Logs**
```bash
# Check application logs
tail -f /var/log/your-app/error.log

# Check system logs
journalctl -u your-app-service -f

# Check database logs
tail -f /var/log/postgresql/postgresql.log
```

### **Step 2: Verify Database Connection**
```python
# Test database connection
from your_app import db
try:
    db.session.execute('SELECT 1')
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

### **Step 3: Check Environment Variables**
```bash
# Verify all required environment variables are set
echo $DATABASE_URL
echo $SECRET_KEY
echo $SESSION_SECRET
echo $REDIS_URL
```

### **Step 4: Test Login Endpoint Directly**
```bash
# Test with curl
curl -X POST https://api.couchlytics.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
```

### **Step 5: Check Backend Code**

#### **A. Verify Login Route Implementation**
```python
@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create session
        session['user_id'] = user.id
        session['authenticated'] = True
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
        
    except Exception as e:
        # Log the error
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

#### **B. Check User Model**
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    
    def check_password(self, password):
        try:
            return bcrypt.check_password_hash(self.password_hash, password)
        except Exception as e:
            app.logger.error(f"Password check error: {str(e)}")
            return False
```

### **Step 6: Common Fixes**

#### **Fix 1: Database Connection**
```python
# Update database configuration
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_timeout': 20,
    'max_overflow': 0
}
```

#### **Fix 2: Session Configuration**
```python
# Update session configuration
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_REDIS'] = redis.from_url(os.environ.get('REDIS_URL'))
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'couchlytics:'
```

#### **Fix 3: Error Handling**
```python
# Add comprehensive error handling
@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    app.logger.error(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Unhandled exception: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500
```

#### **Fix 4: Password Hashing**
```python
# Ensure proper password hashing
import bcrypt

def hash_password(password):
    try:
        return bcrypt.generate_password_hash(password).decode('utf-8')
    except Exception as e:
        app.logger.error(f"Password hashing error: {str(e)}")
        raise

def check_password(password_hash, password):
    try:
        return bcrypt.check_password_hash(password_hash, password)
    except Exception as e:
        app.logger.error(f"Password check error: {str(e)}")
        return False
```

### **Step 7: Testing**

#### **A. Test Database Connection**
```python
# Create a test endpoint
@app.route('/test/db')
def test_db():
    try:
        result = db.session.execute('SELECT 1').scalar()
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
```

#### **B. Test Login Endpoint**
```python
# Create a test login endpoint
@app.route('/test/login', methods=['POST'])
def test_login():
    try:
        data = request.get_json()
        email = data.get('email')
        
        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({
                'status': 'success',
                'user_found': True,
                'user_id': user.id
            })
        else:
            return jsonify({
                'status': 'success',
                'user_found': False
            })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
```

## 🚀 **Quick Fix Checklist**

- [ ] Check backend logs for specific error messages
- [ ] Verify database connection is working
- [ ] Ensure all environment variables are set
- [ ] Test login endpoint with curl
- [ ] Check User model password verification
- [ ] Verify session configuration
- [ ] Add comprehensive error handling
- [ ] Test with a known working user account

## 🔍 **Debugging Commands**

```bash
# Check if backend is running
ps aux | grep python

# Check port availability
netstat -tlnp | grep :5000

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli ping

# Monitor logs in real-time
tail -f /var/log/your-app/error.log | grep -i error
```

## 📋 **Common Error Messages & Solutions**

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Connection refused` | Backend not running | Start backend service |
| `Database connection failed` | DB credentials/URL wrong | Check DATABASE_URL |
| `Module not found` | Missing dependencies | Run `pip install -r requirements.txt` |
| `Session store unavailable` | Redis/DB down | Check Redis/DB service |
| `Password verification failed` | Hash mismatch | Check password hashing logic |

## 🎯 **Expected Outcome**

After implementing these fixes:
- ✅ Login endpoint returns 200 status
- ✅ Users can authenticate successfully
- ✅ Sessions are created properly
- ✅ Users can join leagues via invitation
- ✅ No more 500 errors in logs

## 📞 **Next Steps**

1. **Implement the fixes** based on your specific error logs
2. **Test the login endpoint** with curl
3. **Verify the invitation flow** works end-to-end
4. **Monitor logs** for any remaining issues
5. **Update frontend** if needed based on backend changes

---

**Note**: This guide covers the most common causes of 500 errors in login endpoints. The specific fix will depend on your actual error logs and backend implementation.

