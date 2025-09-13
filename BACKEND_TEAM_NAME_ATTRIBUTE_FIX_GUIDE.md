# 🔧 Backend Team Name Attribute Fix Guide

## 🚨 **Critical Error**

**Error**: `'Team' object has no attribute 'team_name'`
**Location**: Trade Calculator endpoints
**Status**: 500 Internal Server Error

## 📍 **Affected Endpoints**

- `GET /leagues/{league_id}/trade-calculator/players`
- `GET /leagues/{league_id}/trade-calculator/teams`

## 🔍 **Root Cause Analysis**

The Trade Calculator endpoints are trying to access `team.team_name` but the Team model/object uses a different attribute name.

## 🛠️ **Backend Fix Required**

### **1. Check Team Model Structure**

```python
# Check your Team model/class
class Team:
    # Current attributes (likely):
    name: str
    city: str
    abbreviation: str
    
    # NOT team_name (this is the issue)
```

### **2. Fix Trade Calculator Endpoints**

**File**: `routes/trade_calculator.py` (or similar)

**Before (Broken)**:
```python
@trade_calculator_bp.route('/leagues/<int:league_id>/trade-calculator/players', methods=['GET'])
def get_trade_calculator_players(league_id):
    # ... existing code ...
    
    # ❌ This is causing the error:
    team_name = team.team_name  # AttributeError: 'Team' object has no attribute 'team_name'
    
    # ... rest of code ...
```

**After (Fixed)**:
```python
@trade_calculator_bp.route('/leagues/<int:league_id>/trade-calculator/players', methods=['GET'])
def get_trade_calculator_players(league_id):
    # ... existing code ...
    
    # ✅ Use the correct attribute name:
    team_name = team.name  # or team.city + " " + team.name
    
    # ... rest of code ...
```

### **3. Fix Teams Endpoint**

**Before (Broken)**:
```python
@trade_calculator_bp.route('/leagues/<int:league_id>/trade-calculator/teams', methods=['GET'])
def get_trade_calculator_teams(league_id):
    # ... existing code ...
    
    # ❌ This is causing the error:
    team_name = team.team_name  # AttributeError
    
    # ... rest of code ...
```

**After (Fixed)**:
```python
@trade_calculator_bp.route('/leagues/<int:league_id>/trade-calculator/teams', methods=['GET'])
def get_trade_calculator_teams(league_id):
    # ... existing code ...
    
    # ✅ Use the correct attribute name:
    team_name = team.name  # or team.city + " " + team.name
    
    # ... rest of code ...
```

## 🔍 **Debugging Steps**

### **1. Check Team Object Structure**

```python
# Add this debug code to see what attributes are available:
print("Team object attributes:", dir(team))
print("Team object dict:", team.__dict__)
print("Team name:", getattr(team, 'name', 'NOT_FOUND'))
print("Team city:", getattr(team, 'city', 'NOT_FOUND'))
```

### **2. Common Team Attribute Names**

The Team object likely has these attributes:
- `name` - Team name (e.g., "Browns")
- `city` - City name (e.g., "Cleveland")
- `abbreviation` - Team abbreviation (e.g., "BRO")
- `id` - Team ID

### **3. Expected Response Format**

The frontend expects teams in this format:
```json
{
  "success": true,
  "teams": [
    {
      "id": 4,
      "name": "Browns",
      "city": "Cleveland",
      "abbreviation": "BRO"
    }
  ]
}
```

## 🚀 **Quick Fix**

If you need a quick fix, you can create a property or method:

```python
# Option 1: Add a property to Team model
class Team:
    # ... existing attributes ...
    
    @property
    def team_name(self):
        return f"{self.city} {self.name}"
    
    # Or just return name:
    @property
    def team_name(self):
        return self.name

# Option 2: Use getattr with fallback
team_name = getattr(team, 'name', getattr(team, 'team_name', 'Unknown Team'))
```

## 🧪 **Testing**

After fixing, test these endpoints:

```bash
# Test players endpoint
curl -X GET "https://api.couchlytics.com/leagues/12335716/trade-calculator/players?page=1&per_page=100&fast_mode=false" \
  -H "Cookie: session=your_session_cookie"

# Test teams endpoint  
curl -X GET "https://api.couchlytics.com/leagues/12335716/trade-calculator/teams" \
  -H "Cookie: session=your_session_cookie"
```

## ✅ **Expected Results**

After fixing:
- ✅ No more 500 errors on trade calculator endpoints
- ✅ Players load successfully in Trade Tool
- ✅ Teams load successfully in Trade Tool
- ✅ Trade analysis works properly

## 📋 **Files to Check**

1. `routes/trade_calculator.py` - Main trade calculator routes
2. `models/team.py` - Team model definition
3. `services/trade_calculator_service.py` - Trade calculator business logic
4. Any other files that reference `team.team_name`

The fix should be simple - just change `team.team_name` to `team.name` (or the correct attribute name) in the trade calculator endpoints.
