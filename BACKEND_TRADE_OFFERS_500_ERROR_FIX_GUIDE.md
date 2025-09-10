# 🛠️ Backend Trade Offers 500 Internal Server Error Fix Guide

## Problem
- **Frontend**: User tries to send a trade offer
- **Backend**: `/leagues/12335716/trade-offers` endpoint returns **500 Internal Server Error**
- **Error**: "Failed to create trade offer"

## Root Cause Analysis
The 500 error indicates a server-side exception. Common causes:
1. **Database constraint violation** (foreign key, unique constraint)
2. **Missing required fields** in the request payload
3. **Invalid data types** or malformed JSON
4. **Database connection issues**
5. **Missing database tables** or columns
6. **Permission/authorization errors** in the backend code

---

## Step-by-Step Backend Investigation

### 1. **Check Backend Logs**

Look for the specific error in your backend logs:

```bash
# Search for trade offer errors
grep -i "trade.*offer.*error" /path/to/backend/logs/app.log
grep -i "500.*trade" /path/to/backend/logs/app.log
grep -i "exception.*trade" /path/to/backend/logs/app.log

# Look for the specific request
grep -A 10 -B 5 "12335716.*trade-offers" /path/to/backend/logs/app.log
```

### 2. **Check Database Schema**

Verify the trade_offers table exists and has the correct structure:

```sql
-- Check if trade_offers table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'trade_offers';

-- Check table structure
DESCRIBE trade_offers;
-- or
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'trade_offers'
ORDER BY ordinal_position;

-- Check for foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'trade_offers';
```

### 3. **Check Required Tables Exist**

```sql
-- Check if all related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
    'trade_offers',
    'trade_offer_players',
    'trade_offer_draft_picks',
    'users',
    'teams',
    'players',
    'leagues'
);
```

### 4. **Test the Endpoint with Minimal Data**

Create a test script to isolate the issue:

```python
# test_trade_offer.py
import requests
import json

# Test data from the console output
test_payload = {
    "league_id": "12335716",
    "to_team_id": 4,
    "from_players": [{"id": 1, "name": "Lamar Jackson"}],  # Replace with actual player data
    "to_players": [{"id": 2, "name": "Kaidon Salter"}],    # Replace with actual player data
    "message": "This is a sweet deal",
    "expiration_hours": 168
}

# Test the endpoint
response = requests.post(
    "https://api.couchlytics.com/leagues/12335716/trade-offers",
    json=test_payload,
    headers={"Content-Type": "application/json"},
    cookies={"your-session-cookie": "value"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

### 5. **Check Backend Code Implementation**

Look for the trade offers endpoint in your backend:

```python
# Search for this endpoint
@app.route('/leagues/<int:league_id>/trade-offers', methods=['POST'])
def create_trade_offer(league_id):
    try:
        # Check what validation is happening
        # Check what database operations are being performed
        # Look for any try/catch blocks that might be swallowing errors
    except Exception as e:
        # Check if errors are being logged properly
        print(f"Trade offer error: {e}")
        return jsonify({'error': 'Failed to create trade offer'}), 500
```

---

## Common Fixes

### Fix 1: **Create Missing Database Tables**

If the trade_offers table doesn't exist:

```sql
-- Create trade_offers table
CREATE TABLE trade_offers (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    from_team_id INTEGER NOT NULL,
    to_team_id INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id),
    FOREIGN KEY (from_team_id) REFERENCES teams(id),
    FOREIGN KEY (to_team_id) REFERENCES teams(id)
);

-- Create trade_offer_players table
CREATE TABLE trade_offer_players (
    id SERIAL PRIMARY KEY,
    trade_offer_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    is_from_team BOOLEAN NOT NULL,
    FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Create trade_offer_draft_picks table
CREATE TABLE trade_offer_draft_picks (
    id SERIAL PRIMARY KEY,
    trade_offer_id INTEGER NOT NULL,
    pick_round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    is_from_team BOOLEAN NOT NULL,
    FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

### Fix 2: **Fix Data Validation Issues**

```python
# Add proper validation
@app.route('/leagues/<int:league_id>/trade-offers', methods=['POST'])
def create_trade_offer(league_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['to_team_id', 'from_players', 'to_players']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate team exists
        to_team = Team.query.filter_by(id=data['to_team_id'], league_id=league_id).first()
        if not to_team:
            return jsonify({'error': 'Invalid team ID'}), 400
        
        # Validate players exist
        for player in data.get('from_players', []):
            if not Player.query.filter_by(id=player['id']).first():
                return jsonify({'error': f'Player not found: {player["id"]}'}), 400
        
        # Create trade offer
        trade_offer = TradeOffer(
            league_id=league_id,
            from_team_id=current_user.team_id,  # Get from session
            to_team_id=data['to_team_id'],
            message=data.get('message', ''),
            expires_at=datetime.utcnow() + timedelta(hours=data.get('expiration_hours', 168))
        )
        
        db.session.add(trade_offer)
        db.session.commit()
        
        return jsonify({'success': True, 'trade_offer_id': trade_offer.id}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Trade offer creation error: {e}")
        return jsonify({'error': 'Failed to create trade offer'}), 500
```

### Fix 3: **Fix Foreign Key Issues**

```sql
-- Check for orphaned records
SELECT * FROM trade_offers 
WHERE from_team_id NOT IN (SELECT id FROM teams);

SELECT * FROM trade_offers 
WHERE to_team_id NOT IN (SELECT id FROM teams);

-- Fix orphaned records
DELETE FROM trade_offers 
WHERE from_team_id NOT IN (SELECT id FROM teams);

DELETE FROM trade_offers 
WHERE to_team_id NOT IN (SELECT id FROM teams);
```

### Fix 4: **Add Proper Error Logging**

```python
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/leagues/<int:league_id>/trade-offers', methods=['POST'])
def create_trade_offer(league_id):
    try:
        data = request.get_json()
        logger.info(f"Creating trade offer for league {league_id}: {data}")
        
        # Your trade offer creation logic here
        
    except Exception as e:
        logger.error(f"Trade offer creation failed: {e}", exc_info=True)
        return jsonify({'error': 'Failed to create trade offer'}), 500
```

---

## Debugging Commands

### 1. **Check Database Connection**
```python
# Test database connection
from your_app import db
try:
    db.session.execute('SELECT 1')
    print("Database connection OK")
except Exception as e:
    print(f"Database connection failed: {e}")
```

### 2. **Check Session Data**
```python
# Check what's in the session
print(f"Session data: {session}")
print(f"Current user: {current_user}")
print(f"User team ID: {current_user.team_id if current_user else 'No user'}")
```

### 3. **Test with curl**
```bash
# Test with minimal data
curl -X POST "https://api.couchlytics.com/leagues/12335716/trade-offers" \
  -H "Content-Type: application/json" \
  -b "your-session-cookie" \
  -d '{
    "to_team_id": 4,
    "from_players": [],
    "to_players": [],
    "message": "Test trade"
  }' \
  -v
```

---

## Verification Steps

### 1. **Check Logs After Fix**
```bash
# Look for successful trade offer creation
grep -i "trade.*offer.*created" /path/to/backend/logs/app.log
grep -i "trade.*offer.*success" /path/to/backend/logs/app.log
```

### 2. **Test API Endpoint**
```bash
# Test the endpoint
curl -X POST "https://api.couchlytics.com/leagues/12335716/trade-offers" \
  -H "Content-Type: application/json" \
  -b "your-session-cookie" \
  -d '{"to_team_id": 4, "from_players": [], "to_players": [], "message": "Test"}'
```

### 3. **Check Database**
```sql
-- Verify trade offer was created
SELECT * FROM trade_offers 
WHERE league_id = 12335716 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Summary Checklist

- [ ] Check backend logs for specific error details
- [ ] Verify trade_offers table exists and has correct structure
- [ ] Check all related tables exist
- [ ] Test endpoint with minimal data
- [ ] Fix any database schema issues
- [ ] Add proper error logging
- [ ] Test the fix with a real trade offer
- [ ] Verify trade offers are created in database

---

## Expected Result

After fixing the 500 error:
- Trade offers should be created successfully
- No more 500 Internal Server Error
- Trade offers should appear in the database
- Frontend should show success message
- Trade offers should be visible in the trades page

