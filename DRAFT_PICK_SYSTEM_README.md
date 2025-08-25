# 🏈 Database-Driven Draft Pick System

## Overview

This new system replaces the complex mathematical formula with a **customizable table-based approach** where each league can set their own draft pick values directly. This gives leagues complete control over their draft pick valuations.

## 🎯 Key Features

### **1. League-Specific Customization**
- Each league has their own draft pick value table
- Values can be set individually for each round/pick combination
- No more complex formulas - just direct value assignment

### **2. Flexible Year Multipliers**
- **Current Season Year**: No discount (1.0x)
- **Next Year**: No discount (1.0x) 
- **Future Years**: Customizable multiplier (default: 0.25x)
- **Beyond Future**: Customizable multiplier (default: 0.25x)

### **3. Easy Management**
- Bulk update multiple values at once
- Reset to defaults when needed
- Simple API endpoints for frontend integration

## 🗄️ Database Schema

### **League Draft Pick Values Table**
```sql
CREATE TABLE league_draft_pick_values (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    round_num INTEGER NOT NULL,        -- 1-7
    pick_in_round INTEGER NOT NULL,    -- 1-32
    value DECIMAL(10,2) NOT NULL,      -- Custom value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, round_num, pick_in_round)
);
```

### **League Draft Settings Table**
```sql
CREATE TABLE league_draft_settings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL UNIQUE,
    current_season_year INTEGER NOT NULL DEFAULT 2025,
    future_year_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0.25,
    beyond_future_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0.25,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### **Get All Draft Pick Values**
```
GET /leagues/{league_id}/draft-picks/values
```
Returns all custom values for the league.

### **Get Round Values**
```
GET /leagues/{league_id}/draft-picks/round/{round_num}
```
Returns all values for a specific round.

### **Set Individual Value**
```
POST /leagues/{league_id}/draft-picks/value
Body: {"round": 1, "pickInRound": 1, "value": 1000.0}
```

### **Bulk Update Values**
```
POST /leagues/{league_id}/draft-picks/bulk-update
Body: {"values": [{"round": 1, "pickInRound": 1, "value": 1000.0}, ...]}
```

### **Get League Settings**
```
GET /leagues/{league_id}/draft-picks/settings
```

### **Update League Settings**
```
PUT /leagues/{league_id}/draft-picks/settings
Body: {"currentSeasonYear": 2025, "futureYearMultiplier": 0.25, "beyondFutureMultiplier": 0.25}
```

### **Reset to Defaults**
```
POST /leagues/{league_id}/draft-picks/reset
```

### **Calculate Value for Year**
```
POST /leagues/{league_id}/draft-picks/calculate
Body: {"round": 1, "pickInRound": 1, "draftYear": 2026}
```

## 🚀 Frontend Integration

### **1. Draft Pick Value Manager Component**
The new `DraftPickValueManager` component provides a complete interface for managing draft pick values:

- **Table View**: Edit all 224 draft pick values (7 rounds × 32 picks)
- **League Settings**: Configure year multipliers and current season
- **Bulk Updates**: Save multiple changes at once
- **Reset Functionality**: Return to default values

### **2. Integration in Trade Tool**
The draft pick value manager is now integrated into the trade tool:

- Click "Manage Draft Pick Values" button above the draft pick sections
- Make changes to values and settings
- Changes automatically update the trade calculations

### **3. Automatic Value Calculation**
The system automatically calculates draft pick values based on:

- Base value from the custom table
- Year multiplier based on league settings
- Applied to all draft picks in trades

## 📊 Default Values

When a league is first created, the system automatically populates default values:

- **R1P1**: 1000.0
- **R1P2**: 980.0
- **R1P3**: 960.0
- **R2P1**: 800.0
- **R2P2**: 784.0
- **R3P1**: 640.0
- And so on...

## 🔄 Migration from Old System

1. **Backend**: Implement the new database tables and API endpoints
2. **Frontend**: The new system is already integrated and ready to use
3. **Data**: Run the migration script to populate default values
4. **Testing**: Verify draft pick values are calculated correctly in trades

## 💡 Benefits of New System

✅ **Complete Customization**: Each league sets their own values
✅ **No Complex Math**: Direct value assignment
✅ **Easy Management**: Bulk updates and simple API
✅ **Flexible Multipliers**: Customizable year discounts
✅ **Better Performance**: No complex calculations
✅ **Frontend Friendly**: Simple table-based interface
✅ **Trade Integration**: Seamlessly works with existing trade tool

## 🎮 Example Usage

### **Setting Custom Values**
```javascript
// Update a single value
const response = await fetch(`/leagues/${leagueId}/draft-picks/value`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        round: 1,
        pickInRound: 1,
        value: 1200.0
    })
});
```

### **Bulk Update**
```javascript
// Update multiple values at once
const response = await fetch(`/leagues/${leagueId}/draft-picks/bulk-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        values: [
            { round: 1, pickInRound: 1, value: 1200.0 },
            { round: 1, pickInRound: 2, value: 1100.0 },
            { round: 1, pickInRound: 3, value: 1000.0 }
        ]
    })
});
```

### **Calculate Value for Specific Year**
```javascript
// Get value for a specific draft year with multipliers applied
const response = await fetch(`/leagues/${leagueId}/draft-picks/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        round: 1,
        pickInRound: 1,
        draftYear: 2027
    })
});
```

## 🎯 Next Steps

1. **Backend Implementation**: Create the database tables and API endpoints
2. **Testing**: Verify the frontend integration works correctly
3. **User Training**: Educate league commissioners on using the new system
4. **Migration**: Help existing leagues transition to the new system

This new system gives you exactly what you wanted - a customizable table where each league can set their own draft pick values without any complex mathematical formulas! 🎯
