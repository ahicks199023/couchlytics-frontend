-- SQL Scripts to Inspect Players Table Structure
-- Run these in your database to understand the exact field names

-- 1. Get table structure (column names, types, etc.)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- 2. Get just the column names (simpler view)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- 3. Get sample data for a specific player (replace 551029279 with actual player ID)
SELECT * 
FROM players 
WHERE player_id = 551029279 
LIMIT 1;

-- 4. Find all rating-related columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name LIKE '%rating%'
ORDER BY column_name;

-- 5. Find all throw-related columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name LIKE '%throw%'
ORDER BY column_name;

-- 6. Find all speed-related columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name LIKE '%speed%'
ORDER BY column_name;

-- 7. Get count of total columns
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'players';

-- 8. Show table info (PostgreSQL specific)
\d players;

-- 9. Get sample data with non-null values for a player
SELECT 
    player_id,
    name,
    position,
    team_name,
    player_best_ovr as overall
FROM players 
WHERE player_id = 551029279;

-- 10. Check if specific rating fields exist and have data
SELECT 
    player_id,
    name,
    rating_speed,
    rating_throw_power,
    rating_throw_accuracy_short,
    rating_throw_accuracy_medium,
    rating_throw_accuracy_deep
FROM players 
WHERE player_id = 551029279; 