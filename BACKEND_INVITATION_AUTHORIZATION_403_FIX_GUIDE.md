# 🚨 Backend Invitation Authorization 403 Fix Guide

## 📋 **Problem Summary**

The frontend is correctly calling `/leagues/{leagueId}/invitations` endpoints, but the backend is returning 403 Forbidden errors even for authenticated commissioner users. The user `antoinehickssales@gmail.com` (ID: 1) has `isCommissioner: true` but is being denied access to invitation management.

## 🔍 **Root Cause Analysis**

The issue is in the backend authorization logic for the `/leagues/{leagueId}/invitations` endpoints. The backend is not properly recognizing that the authenticated user is a commissioner for the specific league.

## 🛠️ **Backend Fix Steps**

### **Step 1: Locate the Invitation Endpoints**

Find your backend code that handles these routes:
- `GET /leagues/{leagueId}/invitations`
- `POST /leagues/{leagueId}/invitations`
- `PUT /leagues/{leagueId}/invitations/{invitationId}`
- `DELETE /leagues/{leagueId}/invitations/{invitationId}`

These are likely in files like:
- `routes/invitations.py`
- `routes/leagues.py`
- `app.py`
- `views/invitations.py`

### **Step 2: Check Authorization Decorators**

Look for the authorization logic. It should look something like this:

```python
@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['GET'])
@login_required
@commissioner_required  # This decorator is likely the problem
def get_invitations(league_id):
    # ... existing logic ...
```

### **Step 3: Fix the Commissioner Authorization**

The `@commissioner_required` decorator (or equivalent logic) needs to be fixed. Here's what it should look like:

```python
from functools import wraps
from flask import abort, g, current_app
import logging

logger = logging.getLogger(__name__)

def commissioner_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        league_id = kwargs.get('league_id')
        if not league_id:
            logger.error("League ID not provided to commissioner_required decorator")
            abort(500, description="League ID not provided")

        # Get current user from session/context
        user = g.get('user') or getattr(g, 'current_user', None)
        if not user:
            logger.error("No authenticated user found")
            abort(401, description="Authentication required")

        logger.info(f"Checking commissioner status for user {user.id} in league {league_id}")

        # Check if user is commissioner for this specific league
        is_commissioner = check_if_user_is_commissioner_for_league(user.id, league_id)
        
        if not is_commissioner:
            logger.warning(f"User {user.id} is not a commissioner for league {league_id}")
            abort(403, description="User is not a commissioner for this league")

        logger.info(f"User {user.id} authorized as commissioner for league {league_id}")
        return f(*args, **kwargs)
    return decorated_function

def check_if_user_is_commissioner_for_league(user_id, league_id):
    """Check if user is a commissioner for the specific league"""
    try:
        # Method 1: Check league_members table
        from app.models import LeagueMember  # Adjust import as needed
        
        member = LeagueMember.query.filter_by(
            user_id=user_id, 
            league_id=league_id
        ).first()
        
        if member and member.role in ['commissioner', 'Commissioner']:
            logger.info(f"User {user_id} found as commissioner in league_members table")
            return True
            
        # Method 2: Check user_leagues table (if you have one)
        from app.models import UserLeague  # Adjust import as needed
        
        user_league = UserLeague.query.filter_by(
            user_id=user_id, 
            league_id=league_id
        ).first()
        
        if user_league and user_league.role in ['commissioner', 'Commissioner']:
            logger.info(f"User {user_id} found as commissioner in user_leagues table")
            return True
            
        # Method 3: Check if user has is_commissioner flag (global check)
        from app.models import User  # Adjust import as needed
        
        user = User.query.get(user_id)
        if user and getattr(user, 'is_commissioner', False):
            logger.info(f"User {user_id} has global is_commissioner flag")
            return True
            
        logger.warning(f"User {user_id} not found as commissioner for league {league_id}")
        return False
        
    except Exception as e:
        logger.error(f"Error checking commissioner status: {str(e)}")
        return False
```

### **Step 4: Alternative - Manual Authorization Check**

If you don't have a decorator, add manual checks in each endpoint:

```python
@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['GET'])
@login_required
def get_invitations(league_id):
    try:
        # Manual authorization check
        user = g.get('user') or getattr(g, 'current_user', None)
        if not user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
            
        # Check if user is commissioner for this league
        if not check_if_user_is_commissioner_for_league(user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
            
        # ... rest of your existing logic ...
        
    except Exception as e:
        logger.error(f"Error in get_invitations: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **Step 5: Database Verification**

Run these SQL queries to verify the user's commissioner status:

```sql
-- Check league_members table
SELECT * FROM league_members 
WHERE user_id = 1 AND league_id = 12335716;

-- Check user_leagues table (if exists)
SELECT * FROM user_leagues 
WHERE user_id = 1 AND league_id = 12335716;

-- Check users table for global commissioner flag
SELECT id, email, is_commissioner, is_admin 
FROM users 
WHERE id = 1;
```

### **Step 6: Add Debugging Logs**

Add comprehensive logging to understand what's happening:

```python
@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['GET'])
@login_required
def get_invitations(league_id):
    try:
        user = g.get('user') or getattr(g, 'current_user', None)
        
        logger.info(f"=== INVITATION DEBUG ===")
        logger.info(f"League ID: {league_id}")
        logger.info(f"User ID: {user.id if user else 'None'}")
        logger.info(f"User email: {user.email if user else 'None'}")
        logger.info(f"User is_commissioner: {getattr(user, 'is_commissioner', 'N/A') if user else 'N/A'}")
        logger.info(f"User is_admin: {getattr(user, 'is_admin', 'N/A') if user else 'N/A'}")
        
        # Check commissioner status
        is_commissioner = check_if_user_is_commissioner_for_league(user.id, league_id)
        logger.info(f"Is commissioner for league: {is_commissioner}")
        
        if not is_commissioner:
            logger.error(f"Authorization failed for user {user.id} in league {league_id}")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
            
        # ... rest of your logic ...
        
    except Exception as e:
        logger.error(f"Error in get_invitations: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **Step 7: Test the Fix**

1. **Deploy the backend changes**
2. **Test the invitation creation** from the frontend
3. **Check the backend logs** for the debug information
4. **Verify the SQL queries** show the correct data

## 🔧 **Quick Fix (Temporary)**

If you need a quick fix for testing, you can temporarily bypass the authorization check:

```python
@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['GET'])
@login_required
def get_invitations(league_id):
    try:
        user = g.get('user') or getattr(g, 'current_user', None)
        if not user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
            
        # TEMPORARY: Skip authorization check for testing
        logger.warning("TEMPORARILY SKIPPING AUTHORIZATION CHECK FOR TESTING")
        
        # ... rest of your existing logic ...
        
    except Exception as e:
        logger.error(f"Error in get_invitations: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

**⚠️ IMPORTANT: Remove this temporary fix after testing!**

## 📝 **Expected Results**

After implementing the fix:

1. **GET /leagues/12335716/invitations** should return 200 with invitation list
2. **POST /leagues/12335716/invitations** should return 200 with created invitation
3. **Frontend should be able to create and manage invitations**
4. **Backend logs should show successful authorization**

## 🚨 **Security Note**

Make sure to:
- Remove any temporary bypasses after testing
- Test with non-commissioner users to ensure they're still blocked
- Verify the authorization logic works for all league operations
- Add proper error handling and logging

## 📞 **Next Steps**

1. Implement the authorization fix on your backend
2. Deploy the changes
3. Test the invitation functionality
4. Let me know if you need help with any specific part of the implementation

The frontend is working correctly - this is definitely a backend authorization issue that needs to be resolved on the server side.

