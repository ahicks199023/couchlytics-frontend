# 🎯 Backend Fix: Missing Game Data Endpoint

## 🚨 Issue Identified

The Game Comments page is showing "Game data not found" because the backend endpoint `GET /leagues/{league_id}/games/{game_id}` is **missing**.

**Frontend Error**: "Game data not found"  
**Missing Endpoint**: `GET /leagues/12335716/games/54303140`  
**Expected**: Game data with teams, scores, and week information

## 🔍 Root Cause

The frontend is trying to fetch game data from:
```
GET /leagues/{league_id}/games/{game_id}
```

But this endpoint doesn't exist on the backend yet. This is the **5th endpoint** from the Game Comments implementation guide.

## 🗄️ Expected Database Schema

### Games Table (if not exists)
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    league_id INTEGER NOT NULL,
    week INTEGER NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score INTEGER NULL,
    away_score INTEGER NULL,
    game_date TIMESTAMP NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_games_league_id ON games(league_id);
CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_games_week ON games(week);
```

## 🐍 Python Model (if needed)

### Game Model
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Game(Base):
    __tablename__ = 'games'
    
    id = Column(Integer, primary_key=True)
    game_id = Column(String(255), unique=True, nullable=False)
    league_id = Column(Integer, ForeignKey('leagues.id'), nullable=False)
    week = Column(Integer, nullable=False)
    home_team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    away_team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    game_date = Column(DateTime, nullable=True)
    is_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    league = relationship("League", back_populates="games")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
```

## 🔌 Missing API Endpoint

### Required Endpoint Implementation
```python
@app.route('/leagues/<int:league_id>/games/<game_id>', methods=['GET'])
@login_required
def get_game_data(league_id, game_id):
    """
    Get basic game information for the comments page
    """
    try:
        # Verify user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get game data from your existing games table
        game = db.session.query(Game).filter(
            Game.league_id == league_id,
            Game.game_id == game_id
        ).first()
        
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        return jsonify({
            'game': {
                'game_id': game.game_id,
                'week': game.week,
                'home_team': {
                    'name': game.home_team.name,
                    'abbreviation': game.home_team.abbreviation
                },
                'away_team': {
                    'name': game.away_team.name,
                    'abbreviation': game.away_team.abbreviation
                },
                'score': {
                    'home_score': game.home_score,
                    'away_score': game.away_score
                } if game.home_score is not None else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔧 Alternative Implementations

### Option 1: If using different table structure
```python
@app.route('/leagues/<int:league_id>/games/<game_id>', methods=['GET'])
@login_required
def get_game_data(league_id, game_id):
    try:
        # If games are stored in a different table or structure
        # Adjust the query based on your actual schema
        
        # Example: If games are in a 'schedule' table
        game = db.session.query(Schedule).filter(
            Schedule.league_id == league_id,
            Schedule.game_id == game_id
        ).first()
        
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        return jsonify({
            'game': {
                'game_id': game.game_id,
                'week': game.week,
                'home_team': {
                    'name': game.home_team_name,
                    'abbreviation': game.home_team_abbreviation
                },
                'away_team': {
                    'name': game.away_team_name,
                    'abbreviation': game.away_team_abbreviation
                },
                'score': {
                    'home_score': game.home_score,
                    'away_score': game.away_score
                } if game.home_score is not None else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Option 2: If games are generated dynamically
```python
@app.route('/leagues/<int:league_id>/games/<game_id>', methods=['GET'])
@login_required
def get_game_data(league_id, game_id):
    try:
        # If games are generated from schedule data
        # Parse game_id to extract week and team information
        
        # Example: game_id format "week_1_home_away"
        parts = game_id.split('_')
        if len(parts) >= 4:
            week = int(parts[1])
            home_team_id = int(parts[2])
            away_team_id = int(parts[3])
            
            # Get team data
            home_team = db.session.query(Team).filter(Team.id == home_team_id).first()
            away_team = db.session.query(Team).filter(Team.id == away_team_id).first()
            
            if not home_team or not away_team:
                return jsonify({'error': 'Teams not found'}), 404
            
            return jsonify({
                'game': {
                    'game_id': game_id,
                    'week': week,
                    'home_team': {
                        'name': home_team.name,
                        'abbreviation': home_team.abbreviation
                    },
                    'away_team': {
                        'name': away_team.name,
                        'abbreviation': away_team.abbreviation
                    },
                    'score': None  # No score data available
                }
            })
        else:
            return jsonify({'error': 'Invalid game ID format'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🚀 Implementation Steps

### 1. Check Current Database Schema
```sql
-- Check if games table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'games';

-- Check what tables contain game data
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%game%' OR table_name LIKE '%schedule%';
```

### 2. Check Existing Game Data
```sql
-- Check if game 54303140 exists
SELECT * FROM games WHERE game_id = '54303140';

-- Check all games for league 12335716
SELECT * FROM games WHERE league_id = 12335716 LIMIT 5;
```

### 3. Add the Missing Endpoint
Add the endpoint implementation above to your Flask app.

### 4. Test the Endpoint
```bash
# Test with curl
curl -X GET "https://api.couchlytics.com/leagues/12335716/games/54303140" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session_cookie"
```

## 🔍 Debugging Commands

### Add Debug Logging
```python
@app.route('/leagues/<int:league_id>/games/<game_id>', methods=['GET'])
@login_required
def get_game_data(league_id, game_id):
    try:
        print(f"🔍 Getting game data for league {league_id}, game {game_id}")
        
        # Check if league exists
        league = db.session.query(League).filter(League.id == league_id).first()
        print(f"🔍 League found: {league is not None}")
        
        # Check if game exists
        game = db.session.query(Game).filter(
            Game.league_id == league_id,
            Game.game_id == game_id
        ).first()
        print(f"🔍 Game found: {game is not None}")
        
        if game:
            print(f"🔍 Game details: Week {game.week}, {game.away_team.name} vs {game.home_team.name}")
        
        # Your existing implementation here...
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
```

## ✅ Expected Response Format

After implementing, the endpoint should return:
```json
{
  "game": {
    "game_id": "54303140",
    "week": 1,
    "home_team": {
      "name": "Cincinnati Bengals",
      "abbreviation": "CIN"
    },
    "away_team": {
      "name": "Buffalo Bills", 
      "abbreviation": "BUF"
    },
    "score": {
      "home_score": 24,
      "away_score": 21
    }
  }
}
```

## 🎯 Key Points

1. **Check Database Schema** - Verify how games are stored
2. **Find Game Data** - Locate where game 54303140 is stored
3. **Implement Endpoint** - Add the missing GET endpoint
4. **Test Response** - Ensure it returns the expected format
5. **Add Debug Logging** - To identify any remaining issues

## 🔧 Quick Fix Options

### If games are in a different table:
- Check your `schedule` table or similar
- Adjust the query to match your actual schema
- Update the response format accordingly

### If game IDs are generated differently:
- Parse the game_id to extract week/team information
- Query teams directly instead of a games table
- Return basic game information without scores

**This should fix the "Game data not found" error and allow the Game Comments page to load properly!** 🎉

