-- 🔍 League Membership Inspection Queries
-- Run these queries to check the current state of league membership

-- 1. Check current league members for league 12335716
SELECT 
    lm.id as membership_id,
    lm.user_id,
    lm.league_id,
    lm.role,
    lm.joined_at,
    u.email,
    u.first_name,
    u.last_name,
    u.display_name
FROM league_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.league_id = 12335716
ORDER BY lm.joined_at;

-- 2. Count total members in this league
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN role = 'commissioner' THEN 1 END) as commissioners,
    COUNT(CASE WHEN role = 'member' THEN 1 END) as members
FROM league_members 
WHERE league_id = 12335716;

-- 3. Check all invitations for this league
SELECT 
    i.id as invitation_id,
    i.code,
    i.status,
    i.created_at,
    i.expires_at,
    i.accepted_by,
    i.accepted_at,
    u.email as inviter_email
FROM invitations i
LEFT JOIN users u ON i.invited_by = u.id
WHERE i.league_id = 12335716
ORDER BY i.created_at DESC;

-- 4. Check invitation acceptances
SELECT 
    ia.id,
    ia.user_id,
    ia.league_id,
    ia.invitation_id,
    ia.accepted_at,
    u.email as accepter_email
FROM invitation_acceptances ia
JOIN users u ON ia.user_id = u.id
WHERE ia.league_id = 12335716
ORDER BY ia.accepted_at DESC;

-- 5. Check if users exist but aren't league members
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at
FROM users u
WHERE u.email IN (
    'antoinehickssales@gmail.com',
    'antoinemariohickssales@gmail.com'
    -- Add other emails you expect to see
)
ORDER BY u.created_at;

-- 6. Check league_members table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'league_members'
ORDER BY ordinal_position;

-- 7. Check for any foreign key constraints
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
    AND tc.table_name = 'league_members';

-- 8. Check recent activity in league_members
SELECT 
    lm.*,
    u.email
FROM league_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.league_id = 12335716
    AND lm.joined_at >= NOW() - INTERVAL '7 days'
ORDER BY lm.joined_at DESC;

-- 9. Check if there are any duplicate memberships
SELECT 
    user_id,
    league_id,
    COUNT(*) as duplicate_count
FROM league_members
WHERE league_id = 12335716
GROUP BY user_id, league_id
HAVING COUNT(*) > 1;

-- 10. Check league table for this specific league
SELECT 
    id,
    name,
    description,
    created_at,
    updated_at
FROM leagues
WHERE id = 12335716;
