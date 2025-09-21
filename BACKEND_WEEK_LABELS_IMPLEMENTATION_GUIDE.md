# Backend Week Labels Implementation Guide

## 🎯 **Overview**

This guide provides the backend implementation needed to support the frontend week labels feature. The frontend is designed to work with or without backend support, but providing `weekLabel` ensures consistency and better user experience.

## 📊 **Current Frontend Behavior**

### **With Backend weekLabel Support:**
- Uses backend-provided labels (e.g., "19 (Wild Card)", "23 (Super Bowl)")
- Consistent formatting across all teams
- Backend controls the exact label format

### **Without Backend weekLabel Support:**
- Falls back to frontend logic
- Still works but may have minor formatting differences
- Frontend generates labels based on week number

## 🔧 **Backend Implementation Required**

### **1. Database Schema Update**

#### **Option A: Add weekLabel to Existing Schedule Data**
```sql
-- Add weekLabel column to your schedule/games table
ALTER TABLE games ADD COLUMN week_label VARCHAR(50);

-- Or if using a separate schedule table
ALTER TABLE team_schedules ADD COLUMN week_label VARCHAR(50);
```

#### **Option B: Generate weekLabel Dynamically (Recommended)**
No database changes needed - generate labels in the API response.

### **2. API Response Update**

#### **Current Schedule Item Structure:**
```json
{
  "week": 19,
  "home": "Browns",
  "away": "Jets",
  "opponent": "Jets",
  "isHome": false,
  "score": "27-21",
  "result": "W",
  "gameId": "543031001"
}
```

#### **Updated Schedule Item Structure:**
```json
{
  "week": 19,
  "weekLabel": "19 (Wild Card)",
  "home": "Browns",
  "away": "Jets",
  "opponent": "Jets",
  "isHome": false,
  "score": "27-21",
  "result": "W",
  "gameId": "543031001"
}
```

### **3. Backend Logic Implementation**

#### **Python/Flask Implementation:**
```python
def get_week_label(week: int) -> str:
    """
    Generate week label based on week number
    """
    if week >= 19:
        if week == 19:
            return "19 (Wild Card)"
        elif week == 20:
            return "20 (Divisional)"
        elif week == 21:
            return "21 (Conference)"
        elif week == 22:
            return "22 (Pro Bowl)"
        elif week == 23:
            return "23 (Super Bowl)"
        else:
            return f"{week} (Playoff)"
    else:
        return str(week)

def add_week_labels_to_schedule(schedule_data):
    """
    Add weekLabel to each schedule item
    """
    for game in schedule_data:
        game['weekLabel'] = get_week_label(game['week'])
    return schedule_data
```

#### **Node.js/Express Implementation:**
```javascript
function getWeekLabel(week) {
    if (week >= 19) {
        switch (week) {
            case 19: return "19 (Wild Card)";
            case 20: return "20 (Divisional)";
            case 21: return "21 (Conference)";
            case 22: return "22 (Pro Bowl)";
            case 23: return "23 (Super Bowl)";
            default: return `${week} (Playoff)`;
        }
    }
    return week.toString();
}

function addWeekLabelsToSchedule(scheduleData) {
    return scheduleData.map(game => ({
        ...game,
        weekLabel: getWeekLabel(game.week)
    }));
}
```

### **4. API Endpoint Updates**

#### **Team Detail Endpoint:**
```python
@app.route('/leagues/<int:league_id>/teams/<int:team_id>/detail')
def get_team_detail(league_id, team_id):
    # ... existing logic ...
    
    # Get schedule data
    schedule = get_team_schedule(league_id, team_id)
    
    # Add week labels
    schedule_with_labels = add_week_labels_to_schedule(schedule)
    
    return jsonify({
        "success": True,
        "team": team_data,
        "schedule": schedule_with_labels,
        # ... other fields ...
    })
```

#### **Schedule Endpoint:**
```python
@app.route('/leagues/<int:league_id>/teams/<int:team_id>/schedule')
def get_team_schedule(league_id, team_id):
    # ... existing logic ...
    
    # Get schedule data
    schedule = get_schedule_from_database(league_id, team_id)
    
    # Add week labels
    schedule_with_labels = add_week_labels_to_schedule(schedule)
    
    return jsonify({
        "success": True,
        "schedule": schedule_with_labels
    })
```

### **5. Database Query Updates (If Using Database Storage)**

#### **SQL Query with weekLabel:**
```sql
SELECT 
    week,
    CASE 
        WHEN week = 19 THEN '19 (Wild Card)'
        WHEN week = 20 THEN '20 (Divisional)'
        WHEN week = 21 THEN '21 (Conference)'
        WHEN week = 22 THEN '22 (Pro Bowl)'
        WHEN week = 23 THEN '23 (Super Bowl)'
        WHEN week >= 19 THEN CONCAT(week, ' (Playoff)')
        ELSE CAST(week AS CHAR)
    END as week_label,
    home_team,
    away_team,
    home_score,
    away_score,
    result,
    game_id
FROM games 
WHERE league_id = ? AND (home_team_id = ? OR away_team_id = ?)
ORDER BY week;
```

### **6. Caching Considerations**

#### **Cache Key Updates:**
```python
# Update cache keys to include week labels
cache_key = f"team_detail_{league_id}_{team_id}_with_labels"
```

#### **Cache Invalidation:**
```python
# Clear cache when schedule data changes
def invalidate_team_schedule_cache(league_id, team_id):
    cache.delete(f"team_detail_{league_id}_{team_id}_with_labels")
```

## 🧪 **Testing Implementation**

### **1. Unit Tests**
```python
def test_get_week_label():
    assert get_week_label(1) == "1"
    assert get_week_label(18) == "18"
    assert get_week_label(19) == "19 (Wild Card)"
    assert get_week_label(20) == "20 (Divisional)"
    assert get_week_label(21) == "21 (Conference)"
    assert get_week_label(22) == "22 (Pro Bowl)"
    assert get_week_label(23) == "23 (Super Bowl)"
    assert get_week_label(24) == "24 (Playoff)"

def test_add_week_labels_to_schedule():
    schedule = [
        {"week": 1, "opponent": "Commanders"},
        {"week": 19, "opponent": "Jets"},
        {"week": 23, "opponent": "Chiefs"}
    ]
    
    result = add_week_labels_to_schedule(schedule)
    
    assert result[0]["weekLabel"] == "1"
    assert result[1]["weekLabel"] == "19 (Wild Card)"
    assert result[2]["weekLabel"] == "23 (Super Bowl)"
```

### **2. Integration Tests**
```python
def test_team_detail_api_with_week_labels():
    response = client.get('/leagues/12335716/teams/4/detail')
    
    assert response.status_code == 200
    data = response.get_json()
    
    # Check that schedule has weekLabel
    assert 'schedule' in data
    assert len(data['schedule']) > 0
    
    for game in data['schedule']:
        assert 'weekLabel' in game
        assert 'week' in game
        assert game['weekLabel'] is not None
```

### **3. API Response Validation**
```bash
# Test API response
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.couchlytics.com/leagues/12335716/teams/4/detail" | jq '.schedule[0]'

# Expected output:
{
  "week": 1,
  "weekLabel": "1",
  "home": "Browns",
  "away": "Commanders",
  "opponent": "Commanders",
  "isHome": true,
  "score": "28-27",
  "result": "W",
  "gameId": "543031001"
}
```

## 📋 **Implementation Checklist**

### **Phase 1: Core Implementation**
- [ ] Add `get_week_label()` function
- [ ] Add `add_week_labels_to_schedule()` function
- [ ] Update team detail endpoint
- [ ] Update schedule endpoint
- [ ] Add unit tests

### **Phase 2: Testing & Validation**
- [ ] Test with existing data
- [ ] Validate API responses
- [ ] Test frontend integration
- [ ] Performance testing

### **Phase 3: Deployment**
- [ ] Deploy to staging
- [ ] Test with real data
- [ ] Deploy to production
- [ ] Monitor for issues

## 🔄 **Backward Compatibility**

### **Frontend Fallback**
The frontend is designed to work with or without `weekLabel`:
- **With weekLabel**: Uses backend labels
- **Without weekLabel**: Falls back to frontend logic

### **Gradual Rollout**
You can deploy the backend changes gradually:
1. Deploy backend with `weekLabel` support
2. Frontend automatically uses backend labels
3. No frontend changes needed

## 🚀 **Performance Considerations**

### **Minimal Impact**
- **No database changes** required (if using dynamic generation)
- **Minimal CPU overhead** for label generation
- **No additional API calls** needed

### **Caching Strategy**
- **Cache generated labels** to avoid recalculation
- **Include weekLabel in cache keys**
- **Invalidate cache** when schedule changes

## 📊 **Expected Results**

### **Before Backend Update:**
```json
{
  "week": 19,
  "opponent": "Jets",
  "result": "W"
}
```

### **After Backend Update:**
```json
{
  "week": 19,
  "weekLabel": "19 (Wild Card)",
  "opponent": "Jets",
  "result": "W"
}
```

## 🎯 **Priority**

**MEDIUM** - The frontend works without backend changes, but providing `weekLabel` ensures:
- Consistent formatting across all teams
- Backend control over label format
- Better user experience
- Future-proofing for additional week types

## 📝 **Notes**

1. **No Breaking Changes**: Frontend is backward compatible
2. **Optional Implementation**: Backend can be updated gradually
3. **Performance Friendly**: Minimal impact on existing functionality
4. **Future Extensible**: Easy to add new week types or formats
