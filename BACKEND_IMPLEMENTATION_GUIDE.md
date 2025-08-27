# 🚀 Couchlytics Backend Implementation Guide

## 📋 Overview

This guide provides comprehensive instructions for implementing the Flask backend that supports your Couchlytics frontend. The backend handles authentication, user management, league data, and team assignments.

## 🏗️ Architecture

```
Frontend (Next.js/Vercel) ↔ Backend (Flask/Railway) ↔ Database (PostgreSQL)
                ↕
           Firebase Auth (Authentication)
```

---

## 🔧 Required Backend Endpoints

### 1. Authentication Endpoints

#### **GET /auth/status**
**Purpose**: Check current authentication status
```python
@app.route('/auth/status', methods=['GET'])
def auth_status():
    try:
        # Check session cookie for authentication
        user_id = session.get('user_id')
        if user_id:
            return jsonify({
                'authenticated': True,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            return jsonify({
                'authenticated': False,
                'reason': 'No session found'
            })
    except Exception as e:
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500
```

#### **POST /auth/sync-firebase**
**Purpose**: Sync Firebase user with backend session
```python
@app.route('/auth/sync-firebase', methods=['POST'])
def sync_firebase():
    try:
        data = request.get_json()
        firebase_uid = data.get('firebase_uid')
        email = data.get('email')
        display_name = data.get('display_name')
        
        # Find or create user in database
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                firebase_uid=firebase_uid,
                display_name=display_name,
                created_at=datetime.utcnow()
            )
            db.session.add(user)
            db.session.commit()
        
        # Create session
        session['user_id'] = user.id
        session['firebase_uid'] = firebase_uid
        session.permanent = True
        
        return jsonify({
            'success': True,
            'user_id': user.id,
            'message': 'Firebase session synchronized'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Session sync failed',
            'details': str(e)
        }), 500
```

#### **POST /auth/logout**
**Purpose**: Clear backend session and coordinate logout
```python
@app.route('/auth/logout', methods=['POST'])
def logout():
    try:
        user_id = session.get('user_id')
        
        # Log logout for debugging
        if user_id:
            print(f"User {user_id} logging out at {datetime.utcnow()}")
        
        # Clear session
        session.clear()
        
        # Clear session cookie
        response = jsonify({
            'success': True,
            'message': 'Logout successful',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Remove session cookie
        response.set_cookie(
            'session', 
            '', 
            expires=0, 
            domain='couchlytics.com',
            secure=True,
            httponly=True,
            samesite='Lax'
        )
        
        return response
        
    except Exception as e:
        return jsonify({
            'error': 'Logout failed',
            'details': str(e)
        }), 500
```

---

### 2. User Management Endpoints

#### **GET /leagues/{league_id}/commissioner/users**
**Purpose**: Get all users in a league
```python
@app.route('/leagues/<int:league_id>/commissioner/users', methods=['GET'])
@require_authentication
@require_commissioner_access
def get_league_users(league_id):
    try:
        # Get all users in the league
        users = db.session.query(
            User.id,
            User.user_id,
            User.first_name,
            User.last_name,
            User.email,
            User.name,
            User.role,
            User.joined_at,
            User.team_id,
            User.is_active
        ).filter(
            User.league_id == league_id
        ).all()
        
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'user_id': user.user_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'joined_at': user.joined_at.isoformat() if user.joined_at else None,
                'team_id': user.team_id,
                'is_active': user.is_active
            })
        
        return jsonify({
            'users': users_data,
            'total': len(users_data)
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch users',
            'details': str(e)
        }), 500
```

#### **PUT /leagues/{league_id}/commissioner/users/{user_id}/role**
**Purpose**: Update user role
```python
@app.route('/leagues/<int:league_id>/commissioner/users/<int:user_id>/role', methods=['PUT'])
@require_authentication
@require_commissioner_access
def update_user_role(league_id, user_id):
    try:
        data = request.get_json()
        new_role = data.get('role')
        
        # Validate role
        valid_roles = ['commissioner', 'co-commissioner', 'owner', 'member', 'viewer']
        if new_role not in valid_roles:
            return jsonify({
                'error': 'Invalid role value',
                'valid_roles': valid_roles
            }), 400
        
        # Check permissions
        current_user_id = session.get('user_id')
        if not can_modify_user(current_user_id, user_id, league_id):
            return jsonify({
                'error': 'Insufficient permissions to modify this user'
            }), 403
        
        # Update user role
        user = User.query.filter_by(id=user_id, league_id=league_id).first()
        if not user:
            return jsonify({
                'error': 'User not found in this league'
            }), 404
        
        user.role = new_role
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User role updated successfully',
            'user': {
                'id': user.id,
                'role': user.role,
                'updated_at': user.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to update user role',
            'details': str(e)
        }), 500
```

#### **PUT /leagues/{league_id}/commissioner/users/{user_id}/team**
**Purpose**: Update user team assignment
```python
@app.route('/leagues/<int:league_id>/commissioner/users/<int:user_id>/team', methods=['PUT'])
@require_authentication
@require_commissioner_access
def update_user_team(league_id, user_id):
    try:
        data = request.get_json()
        new_team_id = data.get('team_id')  # Can be None for unassigned
        
        # Validate team exists if provided
        if new_team_id is not None:
            team = Team.query.filter_by(id=new_team_id, league_id=league_id).first()
            if not team:
                return jsonify({
                    'error': 'Team not found in this league'
                }), 404
        
        # Check permissions
        current_user_id = session.get('user_id')
        if not can_modify_user(current_user_id, user_id, league_id):
            return jsonify({
                'error': 'Insufficient permissions to modify this user'
            }), 403
        
        # Update user team
        user = User.query.filter_by(id=user_id, league_id=league_id).first()
        if not user:
            return jsonify({
                'error': 'User not found in this league'
            }), 404
        
        user.team_id = new_team_id
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User team assignment updated successfully',
            'user': {
                'id': user.id,
                'team_id': user.team_id,
                'updated_at': user.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to update user team',
            'details': str(e)
        }), 500
```

---

### 3. Team Management Endpoints

#### **GET /leagues/{league_id}/commissioner/teams**
**Purpose**: Get all teams in a league (32 NFL teams)
```python
@app.route('/leagues/<int:league_id>/commissioner/teams', methods=['GET'])
@require_authentication
def get_league_teams(league_id):
    try:
        # Get all teams for this league
        teams = Team.query.filter_by(league_id=league_id).all()
        
        teams_data = []
        for team in teams:
            teams_data.append({
                'id': team.id,
                'name': team.name,
                'abbreviation': team.abbreviation,
                'city': team.city,
                'conference': team.conference,
                'division': team.division
            })
        
        return jsonify({
            'teams': teams_data,
            'total': len(teams_data)
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch teams',
            'details': str(e)
        }), 500
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    firebase_uid VARCHAR(255),
    display_name VARCHAR(255),
    league_id INTEGER,
    team_id INTEGER REFERENCES teams(id),
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_league_id ON users(league_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

### Teams Table
```sql
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    conference VARCHAR(10) NOT NULL,
    division VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample NFL teams data
INSERT INTO teams (league_id, name, abbreviation, city, conference, division) VALUES
(1, 'Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
(1, 'Raiders', 'LV', 'Las Vegas', 'AFC', 'West'),
(1, 'Chargers', 'LAC', 'Los Angeles', 'AFC', 'West'),
(1, 'Broncos', 'DEN', 'Denver', 'AFC', 'West'),
(1, 'Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
(1, 'Dolphins', 'MIA', 'Miami', 'AFC', 'East'),
(1, 'Patriots', 'NE', 'New England', 'AFC', 'East'),
(1, 'Jets', 'NYJ', 'New York', 'AFC', 'East'),
(1, 'Ravens', 'BAL', 'Baltimore', 'AFC', 'North'),
(1, 'Bengals', 'CIN', 'Cincinnati', 'AFC', 'North'),
(1, 'Browns', 'CLE', 'Cleveland', 'AFC', 'North'),
(1, 'Steelers', 'PIT', 'Pittsburgh', 'AFC', 'North'),
(1, 'Titans', 'TEN', 'Tennessee', 'AFC', 'South'),
(1, 'Colts', 'IND', 'Indianapolis', 'AFC', 'South'),
(1, 'Jaguars', 'JAX', 'Jacksonville', 'AFC', 'South'),
(1, 'Texans', 'HOU', 'Houston', 'AFC', 'South'),
(1, 'Cowboys', 'DAL', 'Dallas', 'NFC', 'East'),
(1, 'Giants', 'NYG', 'New York', 'NFC', 'East'),
(1, 'Eagles', 'PHI', 'Philadelphia', 'NFC', 'East'),
(1, 'Commanders', 'WAS', 'Washington', 'NFC', 'East'),
(1, 'Packers', 'GB', 'Green Bay', 'NFC', 'North'),
(1, 'Bears', 'CHI', 'Chicago', 'NFC', 'North'),
(1, 'Lions', 'DET', 'Detroit', 'NFC', 'North'),
(1, 'Vikings', 'MIN', 'Minnesota', 'NFC', 'North'),
(1, 'Falcons', 'ATL', 'Atlanta', 'NFC', 'South'),
(1, 'Panthers', 'CAR', 'Carolina', 'NFC', 'South'),
(1, 'Saints', 'NO', 'New Orleans', 'NFC', 'South'),
(1, 'Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'South'),
(1, '49ers', 'SF', 'San Francisco', 'NFC', 'West'),
(1, 'Seahawks', 'SEA', 'Seattle', 'NFC', 'West'),
(1, 'Rams', 'LAR', 'Los Angeles', 'NFC', 'West'),
(1, 'Cardinals', 'ARI', 'Arizona', 'NFC', 'West');
```

---

## 🔒 Security & Authentication

### Authentication Decorators
```python
from functools import wraps
from flask import session, jsonify

def require_authentication(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_commissioner_access(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        league_id = kwargs.get('league_id')
        user_id = session.get('user_id')
        
        if not has_commissioner_access(user_id, league_id):
            return jsonify({'error': 'Commissioner access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def has_commissioner_access(user_id, league_id):
    user = User.query.filter_by(id=user_id, league_id=league_id).first()
    if not user:
        return False
    return user.role in ['commissioner', 'co-commissioner']

def can_modify_user(commissioner_user_id, target_user_id, league_id):
    commissioner = User.query.filter_by(id=commissioner_user_id, league_id=league_id).first()
    target = User.query.filter_by(id=target_user_id, league_id=league_id).first()
    
    if not commissioner or not target:
        return False
    
    # Commissioner can modify any user in their league
    if commissioner.role == "commissioner":
        return True
    
    # Co-commissioner can modify members/viewers but not other co-commissioners
    if commissioner.role == "co-commissioner":
        return target.role in ["member", "viewer"]
    
    # Regular users cannot modify other users
    return False
```

---

## 🚀 Deployment Configuration

### Flask App Configuration
```python
import os
from flask import Flask, session
from flask_cors import CORS
from datetime import timedelta

app = Flask(__name__)

# Session configuration
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key')
app.permanent_session_lifetime = timedelta(days=30)

# CORS configuration
CORS(app, 
     origins=['https://www.couchlytics.com', 'https://couchlytics.vercel.app'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Authorization', 'Content-Type'])

# Session cookie configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_DOMAIN='couchlytics.com'
)
```

### Environment Variables
```bash
# Required Environment Variables
SECRET_KEY=your-flask-secret-key
DATABASE_URL=postgresql://user:password@host:port/database
FIREBASE_PROJECT_ID=your-firebase-project-id
CORS_ORIGINS=https://www.couchlytics.com,https://couchlytics.vercel.app
ENVIRONMENT=production
```

---

## 🧪 Testing Endpoints

### Test Authentication Flow
```bash
# 1. Check auth status (should return false)
curl -X GET https://api.couchlytics.com/auth/status \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt

# 2. Sync Firebase user
curl -X POST https://api.couchlytics.com/auth/sync-firebase \
  -H "Content-Type: application/json" \
  -d '{"firebase_uid":"test-uid","email":"test@example.com","display_name":"Test User"}' \
  --cookie-jar cookies.txt

# 3. Check auth status (should return true)
curl -X GET https://api.couchlytics.com/auth/status \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt
```

### Test User Management
```bash
# Get league users
curl -X GET https://api.couchlytics.com/leagues/12335716/commissioner/users \
  -H "Content-Type: application/json" \
  --cookie cookies.txt

# Update user role
curl -X PUT https://api.couchlytics.com/leagues/12335716/commissioner/users/123/role \
  -H "Content-Type: application/json" \
  -d '{"role":"co-commissioner"}' \
  --cookie cookies.txt

# Update user team
curl -X PUT https://api.couchlytics.com/leagues/12335716/commissioner/users/123/team \
  -H "Content-Type: application/json" \
  -d '{"team_id":5}' \
  --cookie cookies.txt
```

---

## 📊 Monitoring & Logging

### Request Logging
```python
import logging
from datetime import datetime

@app.before_request
def log_request():
    logging.info(f"{datetime.utcnow()}: {request.method} {request.path} from {request.remote_addr}")

@app.after_request
def log_response(response):
    logging.info(f"Response: {response.status_code}")
    return response
```

### Error Handling
```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'code': 'RESOURCE_NOT_FOUND',
        'error': 'Not Found',
        'message': 'Resource not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'code': 'INTERNAL_SERVER_ERROR',
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500
```

---

## 🎯 Implementation Checklist

### Phase 1: Authentication ✅
- [ ] Implement `/auth/status` endpoint
- [ ] Implement `/auth/sync-firebase` endpoint  
- [ ] Implement `/auth/logout` endpoint
- [ ] Set up session management
- [ ] Configure CORS properly

### Phase 2: User Management ✅
- [ ] Implement `/leagues/{id}/commissioner/users` endpoint
- [ ] Implement `/leagues/{id}/commissioner/users/{user_id}/role` endpoint
- [ ] Implement `/leagues/{id}/commissioner/users/{user_id}/team` endpoint
- [ ] Set up user permission system
- [ ] Add role validation

### Phase 3: Team Management ✅
- [ ] Implement `/leagues/{id}/commissioner/teams` endpoint
- [ ] Populate teams table with 32 NFL teams
- [ ] Add team assignment validation

### Phase 4: Security & Testing ✅
- [ ] Add authentication decorators
- [ ] Implement permission checks
- [ ] Add comprehensive error handling
- [ ] Test all endpoints thoroughly
- [ ] Monitor logs for issues

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `supports_credentials=True` in CORS config
- Verify origins include your frontend domain
- Check that cookies are being sent with requests

**2. Session Issues**
- Verify session cookie configuration
- Check that `SECRET_KEY` is set
- Ensure session is being cleared properly on logout

**3. Permission Errors**
- Verify user roles are correctly set in database
- Check permission decorator logic
- Ensure league_id is being passed correctly

**4. Database Errors**
- Check database connection string
- Verify table schemas match expected structure
- Ensure foreign key constraints are properly set

---

## 📞 Support

For additional help implementing these endpoints:

1. **Check logs** for specific error messages
2. **Test endpoints** individually using curl
3. **Verify database** schemas and data
4. **Review CORS** and session configuration

**Remember**: Test all endpoints locally before deploying to production!

---

## 🎉 Success Indicators

When properly implemented, you should see:

✅ **Login redirects** to main dashboard
✅ **Logout works** without infinite loops
✅ **Role dropdowns** update in real-time
✅ **Team assignments** work correctly
✅ **No Firestore permission** errors
✅ **Clean console logs** without authentication errors

Your backend will be ready to support the full Couchlytics frontend experience! 🚀
