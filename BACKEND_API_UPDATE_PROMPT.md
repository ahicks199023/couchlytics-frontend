# Backend API Update Prompt

## Problem
The current API endpoint `/leagues/{leagueId}/players/{playerId}` is only returning basic player information (9 fields) instead of the full player profile with all rating attributes.

## Current API Response
```json
{
  "devTrait": "3",
  "id": 3387,
  "name": "C.J. Stroud", 
  "overall": 99,
  "playerId": 551029279,
  "position": "QB",
  "speed": 82,
  "teamName": "Buccaneers",
  "value": null
}
```

## Required API Response
The endpoint should return ALL rating fields from the Player model in your database, including:

### Core Attributes
- `rating_speed` → `speed`
- `rating_acceleration` → `acceleration` 
- `rating_agility` → `agility`
- `rating_strength` → `strength`
- `rating_awareness` → `awareness`
- `rating_jumping` → `jumping`
- `rating_stamina` → `stamina`
- `rating_toughness` → `toughness`
- `rating_injury` → `injury`

### Passing Attributes
- `rating_throw_power` → `throwPower`
- `rating_throw_accuracy_short` → `shortAccuracy`
- `rating_throw_accuracy_medium` → `midAccuracy`
- `rating_throw_accuracy_deep` → `deepAccuracy`
- `rating_throw_on_run` → `throwOnRun`
- `rating_play_action` → `playAction`
- `rating_break_sack` → `breakSack`
- `rating_throw_under_pressure` → `underPressure`

### Rushing Attributes
- `rating_carrying` → `carrying`
- `rating_change_of_direction` → `changeOfDirection`
- `rating_spin_move` → `spinMove`
- `rating_juke_move` → `jukeMove`
- `rating_break_tackle` → `breakTackle`
- `rating_ball_carrier_vision` → `ballCarrierVision`
- `rating_trucking` → `trucking`
- `rating_stiff_arm` → `stiffArm`

### Receiving Attributes
- `rating_catching` → `catching`
- `rating_spectacular_catch` → `spectacularCatch`
- `rating_release` → `release`
- `rating_catch_in_traffic` → `catchInTraffic`
- `rating_route_running_short` → `routeRunShort`
- `rating_route_running_medium` → `routeRunMedium`
- `rating_route_running_deep` → `routeRunDeep`
- `rating_kick_return` → `kickReturn`

### Blocking Attributes
- `rating_pass_block` → `passBlock`
- `rating_pass_block_power` → `passBlockPower`
- `rating_pass_block_finesse` → `passBlockFinesse`
- `rating_run_block` → `runBlock`
- `rating_run_block_power` → `runBlockPower`
- `rating_run_block_finesse` → `runBlockFinesse`
- `rating_lead_block` → `leadBlock`
- `rating_impact_block` → `impactBlock`

### Defense Attributes
- `rating_tackle` → `tackle`
- `rating_hit_power` → `hitPower`
- `rating_pursuit` → `pursuit`
- `rating_play_recognition` → `playRecognition`
- `rating_block_shedding` → `blockShedding`
- `rating_finesse_moves` → `finesseMoves`
- `rating_power_moves` → `powerMoves`
- `rating_man_coverage` → `manCoverage`
- `rating_zone_coverage` → `zoneCoverage`
- `rating_press` → `press`

### Kicking Attributes
- `rating_kick_power` → `kickPower`
- `rating_kick_accuracy` → `kickAccuracy`

### Contract & Financial
- `cap_hit` → `capHit`
- `contract_salary` → `salary`
- `contract_bonus` → `bonus`
- `contract_years_left` → `yearsLeft`
- `contract_length` → `contractLength`
- `cap_release_net_savings` → `releaseNetSavings`
- `cap_release_penalty` → `totalReleasePenalty`

### Additional Player Details
- `jersey_number` → `jerseyNumber`
- `years_pro` → `yearsPro`
- `rookie_year` → `rookieYear`
- `draft_round` → `draftRound`
- `draft_pick` → `draftPick`
- `college` → `college`
- `height` → `height`
- `weight` → `weight`
- `birth_day` → `birthDay`
- `birth_month` → `birthMonth`
- `birth_year` → `birthYear`
- `hometown` → `hometown`
- `home_state` → `homeState`
- `age` → `age`
- `dev_trait` → `devTrait`
- `durability_rating` → `durabilityRating`
- `experience_points` → `experiencePoints`
- `skill_points` → `skillPoints`
- `legacy_score` → `legacyScore`
- `is_free_agent` → `isFreeAgent`
- `is_on_ir` → `isOnIr`
- `is_on_practice_squad` → `isOnPracticeSquad`
- `is_active` → `isActive`
- `re_sign_status` → `reSignStatus`
- `desired_length` → `desiredLength`
- `headshot_url` → `headshotUrl`
- `headshot_source` → `headshotSource`
- `headshot_confidence` → `headshotConfidence`
- `full_name` → `fullName`
- `team_name` → `teamName`
- `player_best_ovr` → `overall`

## Implementation Request

Please update the `/leagues/{leagueId}/players/{playerId}` endpoint to:

1. **Query the full Player record** from the database using the player ID
2. **Return ALL fields** from the Player model, not just the basic ones
3. **Convert snake_case database fields to camelCase** for the API response
4. **Maintain backward compatibility** with existing fields like `speed`, `overall`, etc.

## Expected Response Format
```json
{
  "id": 3387,
  "name": "C.J. Stroud",
  "position": "QB",
  "teamName": "Buccaneers",
  "overall": 99,
  "speed": 82,
  "acceleration": 85,
  "agility": 78,
  "strength": 65,
  "awareness": 88,
  "jumping": 72,
  "stamina": 85,
  "toughness": 75,
  "injury": 82,
  "throwPower": 89,
  "shortAccuracy": 92,
  "midAccuracy": 88,
  "deepAccuracy": 85,
  "throwOnRun": 78,
  "playAction": 82,
  "breakSack": 65,
  "underPressure": 85,
  "carrying": 45,
  "changeOfDirection": 72,
  "spinMove": 35,
  "jukeMove": 38,
  "breakTackle": 42,
  "ballCarrierVision": 55,
  "trucking": 40,
  "stiffArm": 35,
  "catching": 45,
  "spectacularCatch": 40,
  "release": 35,
  "catchInTraffic": 42,
  "routeRunShort": 35,
  "routeRunMedium": 32,
  "routeRunDeep": 30,
  "kickReturn": 25,
  "passBlock": 25,
  "passBlockPower": 28,
  "passBlockFinesse": 25,
  "runBlock": 25,
  "runBlockPower": 28,
  "runBlockFinesse": 25,
  "leadBlock": 25,
  "impactBlock": 25,
  "tackle": 25,
  "hitPower": 25,
  "pursuit": 25,
  "playRecognition": 25,
  "blockShedding": 25,
  "finesseMoves": 25,
  "powerMoves": 25,
  "manCoverage": 25,
  "zoneCoverage": 25,
  "press": 25,
  "kickPower": 25,
  "kickAccuracy": 25,
  "capHit": 8500000,
  "salary": 8000000,
  "bonus": 500000,
  "yearsLeft": 3,
  "contractLength": 4,
  "releaseNetSavings": 2000000,
  "totalReleasePenalty": 1500000,
  "jerseyNumber": "7",
  "yearsPro": 2,
  "rookieYear": 2023,
  "draftRound": 1,
  "draftPick": 2,
  "college": "Ohio State",
  "height": 75,
  "weight": 218,
  "birthDay": 3,
  "birthMonth": 10,
  "birthYear": 2001,
  "hometown": "Rancho Cucamonga",
  "homeState": "CA",
  "age": 22,
  "devTrait": "3",
  "durabilityRating": 85,
  "experiencePoints": 1500,
  "skillPoints": 25,
  "legacyScore": 0,
  "isFreeAgent": false,
  "isOnIr": false,
  "isOnPracticeSquad": false,
  "isActive": true,
  "reSignStatus": 0,
  "desiredLength": 4,
  "headshotUrl": "https://example.com/headshot.jpg",
  "headshotSource": "api",
  "headshotConfidence": 0.95,
  "fullName": "C.J. Stroud"
}
```

## Notes
- Use the existing Player model from your `models.py`
- Convert all snake_case database fields to camelCase for the API response
- Ensure the endpoint handles cases where some fields might be null/empty
- Add proper error handling for invalid player IDs
- Consider adding pagination if needed for large datasets 