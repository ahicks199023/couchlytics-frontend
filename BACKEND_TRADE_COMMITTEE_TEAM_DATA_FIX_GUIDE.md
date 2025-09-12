# 🔧 Backend Trade Committee Team Data Fix Guide

## 🚨 **Issue Identified**

The Trade Committee Review page is showing **"Unknown City Unknown Team"** instead of proper team names because the backend API is not providing complete team data in the expected format.

## 📊 **Current Problem**

### **Frontend Expectation:**
```typescript
interface PendingTrade {
  from_team: {
    id: number;
    name: string;      // ❌ Missing or null
    city: string;      // ❌ Missing or null
  };
  to_team: {
    id: number;
    name: string;      // ❌ Missing or null  
    city: string;      // ❌ Missing or null
  };
  // Player data shows correct team names, but team objects don't
}
```

### **Current Backend Response:**
```json
{
  "from_team": {
    "id": 123,
    "name": null,      // ❌ Should be "Colts"
    "city": null       // ❌ Should be "Indianapolis"
  },
  "to_team": {
    "id": 456,
    "name": null,      // ❌ Should be "Browns"  
    "city": null       // ❌ Should be "Cleveland"
  },
  "fromPlayers": [
    {
      "playerName": "Cam Coleman",
      // Player data is correct
    }
  ],
  "toPlayers": [
    {
      "playerName": "Anthony Richardson",
      // Player data is correct
    }
  ]
}
```

## 🎯 **Required Fix**

### **Expected Backend Response:**
```json
{
  "from_team": {
    "id": 123,
    "name": "Colts",           // ✅ Proper team name
    "city": "Indianapolis"     // ✅ Proper city name
  },
  "to_team": {
    "id": 456,
    "name": "Browns",          // ✅ Proper team name
    "city": "Cleveland"        // ✅ Proper city name
  },
  "fromPlayers": [...],
  "toPlayers": [...]
}
```

## 🔧 **Backend Implementation Guide**

### **1. Database Query Enhancement**

#### **Current Query (Likely):**
```sql
SELECT 
  t.id,
  t.from_user_id,
  t.to_user_id,
  -- Missing team data joins
FROM trades t
WHERE t.league_id = ? AND t.status = 'pending_committee_review'
```

#### **Required Query (Fixed):**
```sql
SELECT 
  t.id,
  t.from_user_id,
  t.to_user_id,
  t.created_at,
  t.expires_at,
  t.message,
  t.fairness_score,
  
  -- From Team Data
  ft.id as from_team_id,
  ft.name as from_team_name,
  ft.city as from_team_city,
  
  -- To Team Data  
  tt.id as to_team_id,
  tt.name as to_team_name,
  tt.city as to_team_city,
  
  -- User Data
  fu.first_name as from_user_first_name,
  fu.last_name as from_user_last_name,
  fu.email as from_user_email,
  
  tu.first_name as to_user_first_name,
  tu.last_name as to_user_last_name,
  tu.email as to_user_email

FROM trades t
LEFT JOIN teams ft ON t.from_team_id = ft.id
LEFT JOIN teams tt ON t.to_team_id = tt.id  
LEFT JOIN users fu ON t.from_user_id = fu.id
LEFT JOIN users tu ON t.to_user_id = tu.id
WHERE t.league_id = ? AND t.status = 'pending_committee_review'
```

### **2. Python/Flask Implementation**

#### **Enhanced Endpoint:**
```python
@trade_routes.route('/leagues/<int:league_id>/trades/committee/pending', methods=['GET'])
@require_auth
def get_pending_trades(league_id):
    try:
        user_id = get_current_user_id()
        
        # Check if user has committee access
        if not has_committee_access(user_id, league_id):
            return jsonify({"error": "Not authorized"}), 403
        
        # Enhanced query with proper joins
        query = """
        SELECT 
            t.id,
            t.from_user_id,
            t.to_user_id,
            t.created_at,
            t.expires_at,
            t.message,
            t.fairness_score,
            
            -- From Team Data
            ft.id as from_team_id,
            ft.name as from_team_name,
            ft.city as from_team_city,
            
            -- To Team Data  
            tt.id as to_team_id,
            tt.name as to_team_name,
            tt.city as to_team_city,
            
            -- User Data
            fu.first_name as from_user_first_name,
            fu.last_name as from_user_last_name,
            fu.email as from_user_email,
            
            tu.first_name as to_user_first_name,
            tu.last_name as to_user_last_name,
            tu.email as to_user_email

        FROM trades t
        LEFT JOIN teams ft ON t.from_team_id = ft.id
        LEFT JOIN teams tt ON t.to_team_id = tt.id  
        LEFT JOIN users fu ON t.from_user_id = fu.id
        LEFT JOIN users tu ON t.to_user_id = tu.id
        WHERE t.league_id = ? AND t.status = 'pending_committee_review'
        ORDER BY t.created_at DESC
        """
        
        trades = db.execute(query, (league_id,)).fetchall()
        
        # Process trades with proper team data
        processed_trades = []
        for trade in trades:
            # Get players for this trade
            from_players = get_trade_players(trade.id, 'from')
            to_players = get_trade_players(trade.id, 'to')
            
            # Get committee votes
            votes = get_trade_votes(trade.id)
            votes_summary = calculate_votes_summary(votes, league_id)
            
            processed_trade = {
                "id": trade.id,
                "from_user": {
                    "id": trade.from_user_id,
                    "first_name": trade.from_user_first_name,
                    "last_name": trade.from_user_last_name,
                    "email": trade.from_user_email
                },
                "to_user": {
                    "id": trade.to_user_id,
                    "first_name": trade.to_user_first_name,
                    "last_name": trade.to_user_last_name,
                    "email": trade.to_user_email
                },
                "from_team": {
                    "id": trade.from_team_id,
                    "name": trade.from_team_name,      # ✅ Now populated
                    "city": trade.from_team_city       # ✅ Now populated
                },
                "to_team": {
                    "id": trade.to_team_id,
                    "name": trade.to_team_name,        # ✅ Now populated
                    "city": trade.to_team_city         # ✅ Now populated
                },
                "fromPlayers": from_players,
                "toPlayers": to_players,
                "trade_analysis": get_trade_analysis(trade.id),
                "fairness_score": trade.fairness_score,
                "created_at": trade.created_at.isoformat(),
                "expires_at": trade.expires_at.isoformat() if trade.expires_at else None,
                "message": trade.message,
                "committee_votes": votes,
                "votes_summary": votes_summary
            }
            
            processed_trades.append(processed_trade)
        
        return jsonify({
            "success": True,
            "total_pending": len(processed_trades),
            "trades": processed_trades
        })
        
    except Exception as e:
        print(f"Error fetching pending trades: {e}")
        return jsonify({"error": "Failed to fetch pending trades"}), 500

def get_trade_players(trade_id, team_type):
    """Get players involved in a trade"""
    query = """
    SELECT 
        p.id,
        p.player_name,
        p.position,
        p.overall_rating,
        p.player_value,
        p.dev_trait
    FROM trade_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.trade_id = ? AND tp.team_type = ?
    """
    
    players = db.execute(query, (trade_id, team_type)).fetchall()
    
    return [{
        "id": player.id,
        "playerName": player.player_name,
        "position": player.position,
        "overall_rating": player.overall_rating,
        "player_value": player.player_value,
        "devTrait": player.dev_trait
    } for player in players]

def get_trade_votes(trade_id):
    """Get committee votes for a trade"""
    query = """
    SELECT 
        cv.id,
        cv.user_id,
        cv.vote,
        cv.reasoning,
        cv.created_at,
        u.first_name,
        u.last_name
    FROM committee_votes cv
    JOIN users u ON cv.user_id = u.id
    WHERE cv.trade_id = ?
    ORDER BY cv.created_at DESC
    """
    
    votes = db.execute(query, (trade_id,)).fetchall()
    
    return [{
        "id": vote.id,
        "user_id": vote.user_id,
        "vote": vote.vote,
        "reasoning": vote.reasoning,
        "created_at": vote.created_at.isoformat(),
        "user": {
            "first_name": vote.first_name,
            "last_name": vote.last_name
        }
    } for vote in votes]

def calculate_votes_summary(votes, league_id):
    """Calculate voting summary"""
    approve_count = len([v for v in votes if v["vote"] == "approve"])
    reject_count = len([v for v in votes if v["vote"] == "reject"])
    total_votes = approve_count + reject_count
    
    # Get required votes for this league
    required_votes = get_required_committee_votes(league_id)
    
    return {
        "approve_count": approve_count,
        "reject_count": reject_count,
        "total_votes": total_votes,
        "votes_needed": required_votes
    }

def get_trade_analysis(trade_id):
    """Get trade analysis data"""
    query = "SELECT fairness_score, recommendation, analysis FROM trade_analysis WHERE trade_id = ?"
    analysis = db.execute(query, (trade_id,)).fetchone()
    
    if analysis:
        return {
            "fairness_score": analysis.fairness_score,
            "recommendation": analysis.recommendation,
            "analysis": analysis.analysis
        }
    
    return {
        "fairness_score": 0,
        "recommendation": "Pending Analysis",
        "analysis": "Trade analysis is being processed..."
    }
```

### **3. Database Schema Verification**

#### **Ensure Teams Table Structure:**
```sql
-- Verify teams table has proper columns
DESCRIBE teams;

-- Expected structure:
-- id (INT PRIMARY KEY)
-- name (VARCHAR) - e.g., "Colts", "Browns"
-- city (VARCHAR) - e.g., "Indianapolis", "Cleveland"
-- league_id (INT)
-- created_at (TIMESTAMP)
-- updated_at (TIMESTAMP)
```

#### **Verify Trade-Team Relationships:**
```sql
-- Check if trades table has proper team references
DESCRIBE trades;

-- Expected structure:
-- id (INT PRIMARY KEY)
-- from_team_id (INT FOREIGN KEY to teams.id)
-- to_team_id (INT FOREIGN KEY to teams.id)
-- from_user_id (INT FOREIGN KEY to users.id)
-- to_user_id (INT FOREIGN KEY to users.id)
-- league_id (INT)
-- status (VARCHAR)
-- created_at (TIMESTAMP)
-- expires_at (TIMESTAMP)
-- message (TEXT)
-- fairness_score (INT)
```

### **4. Data Population Script**

#### **If Team Data is Missing:**
```sql
-- Update teams table with proper data
UPDATE teams 
SET 
    name = CASE 
        WHEN city = 'Indianapolis' THEN 'Colts'
        WHEN city = 'Cleveland' THEN 'Browns'
        WHEN city = 'New England' THEN 'Patriots'
        WHEN city = 'Miami' THEN 'Dolphins'
        WHEN city = 'Buffalo' THEN 'Bills'
        -- Add more team mappings as needed
        ELSE name
    END,
    city = CASE 
        WHEN name = 'Colts' THEN 'Indianapolis'
        WHEN name = 'Browns' THEN 'Cleveland'
        WHEN name = 'Patriots' THEN 'New England'
        WHEN name = 'Dolphins' THEN 'Miami'
        WHEN name = 'Bills' THEN 'Buffalo'
        -- Add more city mappings as needed
        ELSE city
    END
WHERE league_id = ?;
```

## 🧪 **Testing Guide**

### **1. Test the Endpoint:**
```bash
curl -X GET "https://api.couchlytics.com/leagues/12335716/trades/committee/pending" \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie"
```

### **2. Expected Response Structure:**
```json
{
  "success": true,
  "total_pending": 2,
  "trades": [
    {
      "id": 5,
      "from_team": {
        "id": 123,
        "name": "Colts",           // ✅ Should show proper team name
        "city": "Indianapolis"     // ✅ Should show proper city
      },
      "to_team": {
        "id": 456,
        "name": "Browns",          // ✅ Should show proper team name
        "city": "Cleveland"        // ✅ Should show proper city
      },
      "fromPlayers": [...],
      "toPlayers": [...],
      "fairness_score": 105,
      "message": "I need a quarterback gang!",
      "votes_summary": {
        "approve_count": 0,
        "reject_count": 0,
        "total_votes": 0,
        "votes_needed": 3
      }
    }
  ]
}
```

### **3. Frontend Verification:**
After implementing the backend fix, the frontend should display:
- ✅ **"Indianapolis Colts"** instead of "Unknown City Unknown Team"
- ✅ **"Cleveland Browns"** instead of "Team TBD"
- ✅ **Proper team logos** (once logo assets are added)

## 🚨 **Additional Issues to Address**

### **1. Committee Voting Authorization (403 Error):**
The console shows a `403 (Forbidden)` error when trying to vote. This suggests:

```python
# Check authorization logic in voting endpoint
@trade_routes.route('/leagues/<int:league_id>/committee/vote', methods=['POST'])
@require_auth
def submit_committee_vote(league_id):
    user_id = get_current_user_id()
    
    # Verify user has committee voting rights
    if not has_committee_voting_access(user_id, league_id):
        return jsonify({"error": "Not authorized for committee voting"}), 403
    
    # Rest of voting logic...
```

### **2. Committee Access Check:**
```python
def has_committee_voting_access(user_id, league_id):
    """Check if user can vote on committee decisions"""
    query = """
    SELECT role FROM league_members 
    WHERE user_id = ? AND league_id = ? AND is_active = true
    """
    
    result = db.execute(query, (user_id, league_id)).fetchone()
    
    if not result:
        return False
    
    # Allow these roles to vote
    voting_roles = ['commissioner', 'co-commissioner', 'trade_committee_member']
    return result.role.lower() in [role.lower() for role in voting_roles]
```

## 📋 **Implementation Checklist**

- [ ] **Update database query** to include team data joins
- [ ] **Modify API endpoint** to return complete team information
- [ ] **Verify teams table** has proper name/city data
- [ ] **Test endpoint response** matches expected structure
- [ ] **Fix committee voting authorization** (403 error)
- [ ] **Update team data** if missing in database
- [ ] **Verify frontend displays** correct team names
- [ ] **Test voting functionality** works properly

## 🎯 **Expected Results**

After implementing this fix:

1. **Frontend will display**: "Indianapolis Colts ↔ Cleveland Browns"
2. **Team logos will load**: Once assets are added to `/public/assets/team-logos/`
3. **Voting will work**: No more 403 authorization errors
4. **Complete trade data**: All team information properly populated

---

**Priority**: 🔴 **High** - This affects the core functionality of the Trade Committee Review system

**Estimated Time**: 2-4 hours for backend team to implement and test

**Frontend Status**: ✅ Ready and waiting for proper backend data structure
