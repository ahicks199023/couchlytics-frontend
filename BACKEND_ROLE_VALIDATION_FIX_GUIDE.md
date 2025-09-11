# 🔧 Backend Role Validation Fix Guide

## 🚨 Issue Description

**Problem**: Frontend is getting 400 Bad Request errors when trying to update user roles to "trade_committee_member".

**Error**: `PUT /leagues/{leagueId}/commissioner/users/{userId}/role` returns 400 with "Invalid role value"

**Root Cause**: Mismatch between frontend role options and backend validation.

---

## 🔍 Analysis

### Frontend Role Options (Before Fix)
```javascript
const ROLE_OPTIONS = [
  'commissioner',
  'co-commissioner', 
  'trade_committee_member',  // ❌ NOT ACCEPTED BY BACKEND
  'user'
];
```

### Backend Valid Roles (Current Implementation)
```python
valid_roles = ['commissioner', 'co-commissioner', 'owner', 'member', 'viewer']
```

### Documentation Inconsistency
- **COMPREHENSIVE_BACKEND_GUIDE.md** mentions: `trade_committee_member` as valid
- **BACKEND_IMPLEMENTATION_GUIDE.md** shows: `['commissioner', 'co-commissioner', 'owner', 'member', 'viewer']`
- **Actual Backend Code**: Uses the implementation guide values

---

## ✅ Frontend Fix Applied

Updated `src/app/leagues/[leagueId]/commissioner/users/page.tsx`:

```javascript
const ROLE_OPTIONS = [
  'commissioner',
  'co-commissioner',
  'owner',        // ✅ Now matches backend
  'member',       // ✅ Now matches backend  
  'viewer'        // ✅ Now matches backend
];
```

---

## 🛠️ Backend Fix Options

### Option 1: Update Backend to Accept All Roles
```python
# In the role update endpoint
valid_roles = [
    'commissioner', 
    'co-commissioner', 
    'owner', 
    'member', 
    'viewer',
    'trade_committee_member',  # Add this
    'user'                     # Add this
]
```

### Option 2: Standardize Role Names
```python
# Map frontend roles to backend roles
role_mapping = {
    'trade_committee_member': 'member',  # Map to existing role
    'user': 'viewer'                     # Map to existing role
}
```

### Option 3: Update Database Schema
```sql
-- Add new role values to the database
ALTER TABLE users ADD CONSTRAINT valid_roles 
CHECK (role IN ('commissioner', 'co-commissioner', 'owner', 'member', 'viewer', 'trade_committee_member', 'user'));
```

---

## 🎯 Recommended Solution

**Use Option 1** - Update the backend validation to accept all documented roles:

```python
@app.route('/leagues/<int:league_id>/commissioner/users/<int:user_id>/role', methods=['PUT'])
@require_authentication
@require_commissioner_access
def update_user_role(league_id, user_id):
    try:
        data = request.get_json()
        new_role = data.get('role')
        
        # Updated validation to include all documented roles
        valid_roles = [
            'commissioner', 
            'co-commissioner', 
            'owner', 
            'member', 
            'viewer',
            'trade_committee_member',  # Add this
            'user'                     # Add this
        ]
        
        if new_role not in valid_roles:
            return jsonify({
                'error': 'Invalid role value',
                'valid_roles': valid_roles
            }), 400
        
        # Rest of the function remains the same...
```

---

## 🧪 Testing

### Test Cases
1. **Valid Role Updates**:
   - `commissioner` → `co-commissioner` ✅
   - `member` → `owner` ✅
   - `viewer` → `trade_committee_member` ✅ (after backend fix)

2. **Invalid Role Updates**:
   - `invalid_role` → Should return 400 ❌
   - `admin` → Should return 400 ❌

### Test Commands
```bash
# Test valid role update
curl -X PUT "https://api.couchlytics.com/leagues/12335716/commissioner/users/16/role" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"role": "member"}'

# Test invalid role update  
curl -X PUT "https://api.couchlytics.com/leagues/12335716/commissioner/users/16/role" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"role": "invalid_role"}'
```

---

## 📋 Implementation Checklist

### Frontend (✅ Completed)
- [x] Update `ROLE_OPTIONS` in commissioner users page
- [x] Remove `trade_committee_member` from frontend options
- [x] Add `owner`, `member`, `viewer` to frontend options

### Backend (⏳ Pending)
- [ ] Update role validation in `/leagues/{leagueId}/commissioner/users/{userId}/role` endpoint
- [ ] Add `trade_committee_member` and `user` to valid roles list
- [ ] Update database constraints if needed
- [ ] Test all role transitions
- [ ] Update API documentation

### Documentation (⏳ Pending)
- [ ] Update `COMPREHENSIVE_BACKEND_GUIDE.md` to match implementation
- [ ] Update `BACKEND_IMPLEMENTATION_GUIDE.md` with complete role list
- [ ] Document role hierarchy and permissions

---

## 🚀 Deployment Notes

1. **Frontend**: Already deployed with fix
2. **Backend**: Needs deployment after role validation update
3. **Database**: May need migration if adding new role constraints
4. **Testing**: Verify all role changes work in production

---

## 🔗 Related Files

- **Frontend**: `src/app/leagues/[leagueId]/commissioner/users/page.tsx`
- **Backend**: Role update endpoint in Flask app
- **Documentation**: `COMPREHENSIVE_BACKEND_GUIDE.md`, `BACKEND_IMPLEMENTATION_GUIDE.md`
- **Database**: `users` table role column

---

## 📞 Support

If you encounter issues after implementing this fix:

1. Check browser console for 400 errors
2. Verify backend logs for role validation errors  
3. Test with different role combinations
4. Ensure database constraints are updated

**Status**: Frontend fix applied ✅ | Backend fix pending ⏳
