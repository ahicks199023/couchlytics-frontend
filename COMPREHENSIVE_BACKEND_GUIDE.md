# 🚀 Comprehensive Couchlytics Backend Implementation Guide

## 📋 Overview

This comprehensive guide covers all backend endpoints and functionality needed to support the complete Couchlytics frontend system, including user management, leagues, trades, messaging, and advanced features.

## 🏗️ System Architecture

```
Frontend (Next.js/Vercel) ↔ Backend (Flask/Railway) ↔ Database (PostgreSQL)
                ↕                                    ↕
           Firebase Auth                         Redis (Sessions/Cache)
                ↕
           Firestore (Chat/Real-time)
```

---

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    firebase_uid VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- user, trade_committee_member, co-commissioner, commissioner, developer
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    last_username_change TIMESTAMP,
    
    -- Profile settings
    notification_settings JSONB DEFAULT '{"email_notifications": true, "push_notifications": true, "trade_notifications": true, "league_announcements": true, "chat_notifications": true}',
    subscription_status VARCHAR(20) DEFAULT 'free', -- free, premium, pro
    subscription_expires_at TIMESTAMP,
    subscription_auto_renew BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Leagues Table
```sql
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    season_year INTEGER NOT NULL,
    week INTEGER DEFAULT 1,
    commissioner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- League settings
    auto_approve_trades BOOLEAN DEFAULT FALSE,
    auto_approve_threshold DECIMAL(3,1) DEFAULT 0.0,
    trade_committee_votes_needed INTEGER DEFAULT 3,
    max_roster_size INTEGER DEFAULT 16,
    league_type VARCHAR(50) DEFAULT 'fantasy', -- fantasy, dynasty, redraft
    scoring_system VARCHAR(50) DEFAULT 'standard',
    
    -- Import settings
    import_instructions TEXT,
    companion_app_connected BOOLEAN DEFAULT FALSE,
    last_import_date TIMESTAMP
);

-- Indexes
CREATE INDEX idx_leagues_commissioner ON leagues(commissioner_id);
CREATE INDEX idx_leagues_active ON leagues(is_active);
CREATE INDEX idx_leagues_season ON leagues(season_year);
```

#### League Memberships Table
```sql
CREATE TABLE league_memberships (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user', -- user, trade_committee_member, co-commissioner, commissioner
    team_id INTEGER REFERENCES teams(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(league_id, user_id)
);

-- Indexes
CREATE INDEX idx_memberships_league ON league_memberships(league_id);
CREATE INDEX idx_memberships_user ON league_memberships(user_id);
CREATE INDEX idx_memberships_role ON league_memberships(role);
```

#### Teams Table
```sql
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    conference VARCHAR(10) NOT NULL, -- AFC, NFC
    division VARCHAR(10) NOT NULL,   -- North, South, East, West
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample NFL teams data (32 teams)
INSERT INTO teams (league_id, name, abbreviation, city, conference, division) VALUES
-- AFC East
(1, 'Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
(1, 'Dolphins', 'MIA', 'Miami', 'AFC', 'East'),
(1, 'Patriots', 'NE', 'New England', 'AFC', 'East'),
(1, 'Jets', 'NYJ', 'New York', 'AFC', 'East'),
-- AFC North
(1, 'Ravens', 'BAL', 'Baltimore', 'AFC', 'North'),
(1, 'Bengals', 'CIN', 'Cincinnati', 'AFC', 'North'),
(1, 'Browns', 'CLE', 'Cleveland', 'AFC', 'North'),
(1, 'Steelers', 'PIT', 'Pittsburgh', 'AFC', 'North'),
-- AFC South
(1, 'Texans', 'HOU', 'Houston', 'AFC', 'South'),
(1, 'Colts', 'IND', 'Indianapolis', 'AFC', 'South'),
(1, 'Jaguars', 'JAX', 'Jacksonville', 'AFC', 'South'),
(1, 'Titans', 'TEN', 'Tennessee', 'AFC', 'South'),
-- AFC West
(1, 'Broncos', 'DEN', 'Denver', 'AFC', 'West'),
(1, 'Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
(1, 'Raiders', 'LV', 'Las Vegas', 'AFC', 'West'),
(1, 'Chargers', 'LAC', 'Los Angeles', 'AFC', 'West'),
-- NFC East
(1, 'Cowboys', 'DAL', 'Dallas', 'NFC', 'East'),
(1, 'Giants', 'NYG', 'New York', 'NFC', 'East'),
(1, 'Eagles', 'PHI', 'Philadelphia', 'NFC', 'East'),
(1, 'Commanders', 'WAS', 'Washington', 'NFC', 'East'),
-- NFC North
(1, 'Bears', 'CHI', 'Chicago', 'NFC', 'North'),
(1, 'Lions', 'DET', 'Detroit', 'NFC', 'North'),
(1, 'Packers', 'GB', 'Green Bay', 'NFC', 'North'),
(1, 'Vikings', 'MIN', 'Minnesota', 'NFC', 'North'),
-- NFC South
(1, 'Falcons', 'ATL', 'Atlanta', 'NFC', 'South'),
(1, 'Panthers', 'CAR', 'Carolina', 'NFC', 'South'),
(1, 'Saints', 'NO', 'New Orleans', 'NFC', 'South'),
(1, 'Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'South'),
-- NFC West
(1, 'Cardinals', 'ARI', 'Arizona', 'NFC', 'West'),
(1, 'Rams', 'LAR', 'Los Angeles', 'NFC', 'West'),
(1, '49ers', 'SF', 'San Francisco', 'NFC', 'West'),
(1, 'Seahawks', 'SEA', 'Seattle', 'NFC', 'West');
```

#### Trade System Tables
```sql
-- Trade Offers
CREATE TABLE trade_offers (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, countered, expired
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Auto-approval tracking
    auto_approved BOOLEAN DEFAULT FALSE,
    committee_vote_needed BOOLEAN DEFAULT FALSE,
    final_status VARCHAR(20), -- approved, rejected, pending_committee
    
    -- Notification tracking
    notifications_sent BOOLEAN DEFAULT FALSE
);

-- Trade Offer Players
CREATE TABLE trade_offer_players (
    id SERIAL PRIMARY KEY,
    trade_offer_id INTEGER REFERENCES trade_offers(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    from_user BOOLEAN NOT NULL, -- true if player is from offer sender
    position VARCHAR(10),
    team VARCHAR(10)
);

-- Trade Committee Votes
CREATE TABLE trade_committee_votes (
    id SERIAL PRIMARY KEY,
    trade_offer_id INTEGER REFERENCES trade_offers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    vote VARCHAR(10) NOT NULL, -- approve, reject
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(trade_offer_id, user_id)
);

-- Trade Block
CREATE TABLE trade_block (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    team VARCHAR(10),
    asking_price TEXT,
    notes TEXT,
    listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Player ranking data
    position_rank INTEGER,
    overall_rank INTEGER
);

-- Trade Block Comments
CREATE TABLE trade_block_comments (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade History
CREATE TABLE trade_history (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    trade_offer_id INTEGER REFERENCES trade_offers(id),
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    players_traded JSONB, -- Store player details
    approved_by VARCHAR(50), -- 'auto', 'committee', 'commissioner'
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    season_year INTEGER,
    week INTEGER
);
```

#### Message Board System
```sql
-- Global Announcements
CREATE TABLE global_announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE
);

-- Global Announcement Comments
CREATE TABLE global_announcement_comments (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES global_announcements(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_by INTEGER REFERENCES users(id)
);

-- League Announcements
CREATE TABLE league_announcements (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    pinned BOOLEAN DEFAULT FALSE
);

-- League Announcement Comments
CREATE TABLE league_announcement_comments (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES league_announcements(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_by INTEGER REFERENCES users(id)
);

-- Schedule Comments (for game scheduling)
CREATE TABLE schedule_comments (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    game_id VARCHAR(100) NOT NULL, -- Unique identifier for the matchup
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_by INTEGER REFERENCES users(id)
);
```

#### Invite System
```sql
CREATE TABLE league_invites (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    invited_by INTEGER REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    invite_code VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    team_id INTEGER REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    used_at TIMESTAMP,
    used_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_invites_code ON league_invites(invite_code);
CREATE INDEX idx_invites_email ON league_invites(email);
CREATE INDEX idx_invites_league ON league_invites(league_id);
```

#### Online Status Tracking
```sql
CREATE TABLE user_online_status (
    user_id INTEGER REFERENCES users(id) PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    
    UNIQUE(user_id, league_id)
);

-- Auto-update trigger for last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_seen
    BEFORE UPDATE ON user_online_status
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen();
```

---

## 🔒 Authentication & Authorization System

### Authentication Decorators
```python
from functools import wraps
from flask import session, jsonify, request
import jwt
from datetime import datetime, timedelta

def require_authentication(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_developer_access(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        user = User.query.get(user_id)
        if not user or user.role != 'developer':
            return jsonify({'error': 'Developer access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def require_league_access(required_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = session.get('user_id')
            league_id = kwargs.get('league_id')
            
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check league membership
            membership = LeagueMembership.query.filter_by(
                user_id=user_id, 
                league_id=league_id,
                is_active=True
            ).first()
            
            if not membership:
                return jsonify({'error': 'League access required'}), 403
            
            # Check role requirements
            if required_roles and membership.role not in required_roles:
                return jsonify({
                    'error': f'Role required: {", ".join(required_roles)}'
                }), 403
            
            # Add membership to kwargs for use in endpoint
            kwargs['current_membership'] = membership
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_commissioner_access(f):
    return require_league_access(['commissioner', 'co-commissioner'])(f)

def require_trade_committee_access(f):
    return require_league_access(['commissioner', 'co-commissioner', 'trade_committee_member'])(f)
```

---

## 🚀 API Endpoints

### 1. User Profile Management

#### GET /user/profile
```python
@app.route('/user/profile', methods=['GET'])
@require_authentication
def get_user_profile():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    # Get leagues where user is commissioner
    commissioner_leagues = db.session.query(League).join(
        LeagueMembership, League.id == LeagueMembership.league_id
    ).filter(
        LeagueMembership.user_id == user_id,
        LeagueMembership.role.in_(['commissioner', 'co-commissioner']),
        LeagueMembership.is_active == True
    ).all()
    
    return jsonify({
        'profile': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'last_username_change': user.last_username_change.isoformat() if user.last_username_change else None,
            'notification_settings': user.notification_settings,
            'subscription': {
                'status': user.subscription_status,
                'expires_at': user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
                'auto_renew': user.subscription_auto_renew
            },
            'leagues_as_commissioner': [{
                'id': league.id,
                'name': league.name,
                'season_year': league.season_year,
                'member_count': LeagueMembership.query.filter_by(league_id=league.id, is_active=True).count()
            } for league in commissioner_leagues]
        }
    })
```

#### PUT /user/profile/personal
```python
@app.route('/user/profile/personal', methods=['PUT'])
@require_authentication
def update_personal_info():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    data = request.get_json()
    
    # Validate username change (once every 3 months)
    if 'username' in data and data['username'] != user.username:
        if user.last_username_change:
            time_since_change = datetime.utcnow() - user.last_username_change
            if time_since_change.days < 90:  # 3 months
                return jsonify({
                    'error': 'Username can only be changed once every 3 months',
                    'next_change_date': (user.last_username_change + timedelta(days=90)).isoformat()
                }), 400
        
        # Check username availability
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Username already taken'}), 400
        
        user.username = data['username']
        user.last_username_change = datetime.utcnow()
    
    # Update other fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Personal information updated'})
```

#### PUT /user/profile/notifications
```python
@app.route('/user/profile/notifications', methods=['PUT'])
@require_authentication
def update_notification_settings():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    data = request.get_json()
    
    # Update notification settings
    user.notification_settings = data
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Notification settings updated'})
```

#### POST /user/password-reset-request
```python
@app.route('/user/password-reset-request', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if email exists
        return jsonify({'success': True, 'message': 'If email exists, reset link sent'})
    
    # Generate reset token
    reset_token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    # Send email (implement email service)
    send_password_reset_email(user.email, reset_token)
    
    return jsonify({'success': True, 'message': 'Password reset email sent'})
```

### 2. Developer System Management

#### GET /admin/system/stats
```python
@app.route('/admin/system/stats', methods=['GET'])
@require_developer_access
def get_system_stats():
    stats = {
        'total_users': User.query.count(),
        'active_users': User.query.filter_by(is_active=True).count(),
        'total_leagues': League.query.count(),
        'active_leagues': League.query.filter_by(is_active=True).count(),
        'total_trades': TradeOffer.query.count(),
        'total_messages': GlobalAnnouncementComment.query.count() + LeagueAnnouncementComment.query.count()
    }
    
    return jsonify({'stats': stats})
```

#### GET /admin/system/users
```python
@app.route('/admin/system/users', methods=['GET'])
@require_developer_access
def get_system_users():
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '')
    per_page = 50
    
    query = User.query
    
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f'%{search}%'),
                User.username.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%')
            )
        )
    
    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users_data = []
    for user in pagination.items:
        # Count leagues
        leagues_count = LeagueMembership.query.filter_by(user_id=user.id, is_active=True).count()
        commissioner_count = LeagueMembership.query.filter_by(
            user_id=user.id, 
            is_active=True
        ).filter(
            LeagueMembership.role.in_(['commissioner', 'co-commissioner'])
        ).count()
        
        users_data.append({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_active': user.is_active,
            'leagues_count': leagues_count,
            'leagues_as_commissioner': commissioner_count
        })
    
    return jsonify({
        'users': users_data,
        'total_pages': pagination.pages,
        'current_page': page,
        'total_users': pagination.total
    })
```

#### PUT /admin/system/users/{user_id}
```python
@app.route('/admin/system/users/<int:user_id>', methods=['PUT'])
@require_developer_access
def update_system_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update fields
    for field in ['email', 'username', 'first_name', 'last_name', 'role', 'is_active']:
        if field in data:
            setattr(user, field, data[field])
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User updated successfully'})
```

### 3. Multi-League Support

#### GET /user/leagues
```python
@app.route('/user/leagues', methods=['GET'])
@require_authentication
def get_user_leagues():
    user_id = session.get('user_id')
    
    # Get all leagues where user is a member
    memberships = db.session.query(
        LeagueMembership, League
    ).join(
        League, LeagueMembership.league_id == League.id
    ).filter(
        LeagueMembership.user_id == user_id,
        LeagueMembership.is_active == True,
        League.is_active == True
    ).all()
    
    leagues_data = []
    for membership, league in memberships:
        leagues_data.append({
            'league': {
                'id': league.id,
                'name': league.name,
                'season_year': league.season_year,
                'week': league.week
            },
            'membership': {
                'role': membership.role,
                'team_id': membership.team_id,
                'joined_at': membership.joined_at.isoformat()
            }
        })
    
    return jsonify({'leagues': leagues_data})
```

#### POST /leagues/{league_id}/switch-context
```python
@app.route('/leagues/<int:league_id>/switch-context', methods=['POST'])
@require_authentication
@require_league_access()
def switch_league_context(league_id, current_membership):
    # Update session context
    session['current_league_id'] = league_id
    session['current_membership_role'] = current_membership.role
    
    # Update online status
    user_id = session.get('user_id')
    status = UserOnlineStatus.query.filter_by(user_id=user_id, league_id=league_id).first()
    if not status:
        status = UserOnlineStatus(user_id=user_id, league_id=league_id)
        db.session.add(status)
    
    status.is_online = True
    status.last_seen = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'league_context': {
            'league_id': league_id,
            'role': current_membership.role,
            'team_id': current_membership.team_id
        }
    })
```

### 4. Trade System

#### POST /leagues/{league_id}/trades/offer
```python
@app.route('/leagues/<int:league_id>/trades/offer', methods=['POST'])
@require_authentication
@require_league_access()
def create_trade_offer(league_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    # Create trade offer
    trade_offer = TradeOffer(
        league_id=league_id,
        from_user_id=user_id,
        to_user_id=data['to_user_id'],
        message=data.get('message', ''),
        status='pending'
    )
    
    db.session.add(trade_offer)
    db.session.flush()  # Get the ID
    
    # Add players
    for player in data.get('players_offered', []):
        trade_player = TradeOfferPlayer(
            trade_offer_id=trade_offer.id,
            player_id=player['id'],
            player_name=player['name'],
            from_user=True,
            position=player.get('position'),
            team=player.get('team')
        )
        db.session.add(trade_player)
    
    for player in data.get('players_wanted', []):
        trade_player = TradeOfferPlayer(
            trade_offer_id=trade_offer.id,
            player_id=player['id'],
            player_name=player['name'],
            from_user=False,
            position=player.get('position'),
            team=player.get('team')
        )
        db.session.add(trade_player)
    
    db.session.commit()
    
    # Check for auto-approval
    league = League.query.get(league_id)
    if league.auto_approve_trades:
        # Implement trade value calculation and auto-approval logic
        trade_value_difference = calculate_trade_value_difference(trade_offer.id)
        if abs(trade_value_difference) <= league.auto_approve_threshold:
            trade_offer.status = 'approved'
            trade_offer.auto_approved = True
            trade_offer.final_status = 'approved'
            db.session.commit()
            
            # Create trade history record
            create_trade_history_record(trade_offer)
            
            # Send notifications
            send_trade_notifications(trade_offer, 'auto_approved')
        else:
            trade_offer.committee_vote_needed = True
            db.session.commit()
            
            # Notify trade committee
            send_trade_committee_notification(trade_offer)
    
    return jsonify({
        'success': True,
        'trade_offer_id': trade_offer.id,
        'status': trade_offer.status
    })
```

#### GET /leagues/{league_id}/trades/committee/pending
```python
@app.route('/leagues/<int:league_id>/trades/committee/pending', methods=['GET'])
@require_authentication
@require_trade_committee_access
def get_pending_committee_trades(league_id, current_membership):
    # Get trades needing committee votes
    pending_trades = TradeOffer.query.filter_by(
        league_id=league_id,
        committee_vote_needed=True,
        status='pending'
    ).all()
    
    trades_data = []
    for trade in pending_trades:
        # Get players involved
        players = TradeOfferPlayer.query.filter_by(trade_offer_id=trade.id).all()
        
        # Get existing votes
        votes = TradeCommitteeVote.query.filter_by(trade_offer_id=trade.id).all()
        
        trades_data.append({
            'id': trade.id,
            'from_user': get_user_name(trade.from_user_id),
            'to_user': get_user_name(trade.to_user_id),
            'message': trade.message,
            'created_at': trade.created_at.isoformat(),
            'players': [{
                'id': p.player_id,
                'name': p.player_name,
                'position': p.position,
                'team': p.team,
                'from_user': p.from_user
            } for p in players],
            'votes': [{
                'user': get_user_name(v.user_id),
                'vote': v.vote,
                'reasoning': v.reasoning,
                'created_at': v.created_at.isoformat()
            } for v in votes],
            'votes_needed': League.query.get(league_id).trade_committee_votes_needed
        })
    
    return jsonify({'pending_trades': trades_data})
```

#### POST /leagues/{league_id}/trades/{trade_id}/vote
```python
@app.route('/leagues/<int:league_id>/trades/<int:trade_id>/vote', methods=['POST'])
@require_authentication
@require_trade_committee_access
def vote_on_trade(league_id, trade_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    trade = TradeOffer.query.filter_by(id=trade_id, league_id=league_id).first_or_404()
    
    # Check if user already voted
    existing_vote = TradeCommitteeVote.query.filter_by(
        trade_offer_id=trade_id,
        user_id=user_id
    ).first()
    
    if existing_vote:
        return jsonify({'error': 'You have already voted on this trade'}), 400
    
    # Create vote
    vote = TradeCommitteeVote(
        trade_offer_id=trade_id,
        user_id=user_id,
        vote=data['vote'],  # 'approve' or 'reject'
        reasoning=data.get('reasoning', '')
    )
    
    db.session.add(vote)
    db.session.commit()
    
    # Check if enough votes to make decision
    league = League.query.get(league_id)
    votes = TradeCommitteeVote.query.filter_by(trade_offer_id=trade_id).all()
    
    approve_votes = len([v for v in votes if v.vote == 'approve'])
    reject_votes = len([v for v in votes if v.vote == 'reject'])
    
    if approve_votes >= league.trade_committee_votes_needed:
        trade.status = 'approved'
        trade.final_status = 'approved'
        db.session.commit()
        
        create_trade_history_record(trade)
        send_trade_notifications(trade, 'committee_approved')
        
    elif reject_votes >= league.trade_committee_votes_needed:
        trade.status = 'rejected'
        trade.final_status = 'rejected'
        db.session.commit()
        
        send_trade_notifications(trade, 'committee_rejected')
    
    return jsonify({'success': True, 'message': 'Vote recorded'})
```

### 5. Trade Block System

#### GET /leagues/{league_id}/trade-block
```python
@app.route('/leagues/<int:league_id>/trade-block', methods=['GET'])
@require_authentication
@require_league_access()
def get_trade_block(league_id, current_membership):
    position = request.args.get('position', 'ALL')
    
    query = TradeBlock.query.filter_by(league_id=league_id, is_active=True)
    
    if position != 'ALL':
        query = query.filter_by(position=position)
    
    players = query.order_by(TradeBlock.listed_at.desc()).all()
    
    players_data = []
    for player in players:
        owner = User.query.get(player.user_id)
        players_data.append({
            'id': player.id,
            'player_id': player.player_id,
            'player_name': player.player_name,
            'position': player.position,
            'team': player.team,
            'owner_name': f"{owner.first_name} {owner.last_name}",
            'owner_id': player.user_id,
            'asking_price': player.asking_price,
            'notes': player.notes,
            'listed_at': player.listed_at.isoformat(),
            'position_rank': player.position_rank,
            'overall_rank': player.overall_rank
        })
    
    return jsonify({'players': players_data})
```

#### POST /leagues/{league_id}/trade-block
```python
@app.route('/leagues/<int:league_id>/trade-block', methods=['POST'])
@require_authentication
@require_league_access()
def add_to_trade_block(league_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    # Check if player already on trade block
    existing = TradeBlock.query.filter_by(
        league_id=league_id,
        user_id=user_id,
        player_id=data['player_id'],
        is_active=True
    ).first()
    
    if existing:
        return jsonify({'error': 'Player already on trade block'}), 400
    
    trade_block_entry = TradeBlock(
        league_id=league_id,
        user_id=user_id,
        player_id=data['player_id'],
        player_name=data['player_name'],
        position=data['position'],
        team=data.get('team'),
        asking_price=data.get('asking_price', ''),
        notes=data.get('notes', ''),
        position_rank=data.get('position_rank'),
        overall_rank=data.get('overall_rank')
    )
    
    db.session.add(trade_block_entry)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Player added to trade block'})
```

#### GET /leagues/{league_id}/trade-block/comments
```python
@app.route('/leagues/<int:league_id>/trade-block/comments', methods=['GET'])
@require_authentication
@require_league_access()
def get_trade_block_comments(league_id, current_membership):
    comments = TradeBlockComment.query.filter_by(league_id=league_id).order_by(
        TradeBlockComment.created_at.desc()
    ).limit(50).all()
    
    comments_data = []
    for comment in comments:
        user = User.query.get(comment.user_id)
        comments_data.append({
            'id': comment.id,
            'user_name': f"{user.first_name} {user.last_name}",
            'comment': comment.comment,
            'created_at': comment.created_at.isoformat()
        })
    
    return jsonify({'comments': comments_data})
```

#### POST /leagues/{league_id}/trade-block/comments
```python
@app.route('/leagues/<int:league_id>/trade-block/comments', methods=['POST'])
@require_authentication
@require_league_access()
def add_trade_block_comment(league_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    comment = TradeBlockComment(
        league_id=league_id,
        user_id=user_id,
        comment=data['comment']
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Comment added'})
```

### 6. Message Board System

#### Global Announcements
```python
# GET /global/announcements
@app.route('/global/announcements', methods=['GET'])
def get_global_announcements():
    announcements = GlobalAnnouncement.query.filter_by(is_active=True).order_by(
        GlobalAnnouncement.featured.desc(),
        GlobalAnnouncement.created_at.desc()
    ).all()
    
    announcements_data = []
    for announcement in announcements:
        author = User.query.get(announcement.author_id)
        comment_count = GlobalAnnouncementComment.query.filter_by(
            announcement_id=announcement.id
        ).count()
        
        announcements_data.append({
            'id': announcement.id,
            'title': announcement.title,
            'content': announcement.content,
            'author': f"{author.first_name} {author.last_name}",
            'created_at': announcement.created_at.isoformat(),
            'featured': announcement.featured,
            'comment_count': comment_count
        })
    
    return jsonify({'announcements': announcements_data})

# POST /global/announcements (Developer only)
@app.route('/global/announcements', methods=['POST'])
@require_developer_access
def create_global_announcement():
    data = request.get_json()
    user_id = session.get('user_id')
    
    announcement = GlobalAnnouncement(
        title=data['title'],
        content=data['content'],
        author_id=user_id,
        featured=data.get('featured', False)
    )
    
    db.session.add(announcement)
    db.session.commit()
    
    return jsonify({'success': True, 'announcement_id': announcement.id})
```

#### League Announcements
```python
# GET /leagues/{league_id}/announcements
@app.route('/leagues/<int:league_id>/announcements', methods=['GET'])
@require_authentication
@require_league_access()
def get_league_announcements(league_id, current_membership):
    announcements = LeagueAnnouncement.query.filter_by(
        league_id=league_id, 
        is_active=True
    ).order_by(
        LeagueAnnouncement.pinned.desc(),
        LeagueAnnouncement.created_at.desc()
    ).all()
    
    announcements_data = []
    for announcement in announcements:
        author = User.query.get(announcement.author_id)
        comment_count = LeagueAnnouncementComment.query.filter_by(
            announcement_id=announcement.id
        ).count()
        
        announcements_data.append({
            'id': announcement.id,
            'title': announcement.title,
            'content': announcement.content,
            'author': f"{author.first_name} {author.last_name}",
            'created_at': announcement.created_at.isoformat(),
            'pinned': announcement.pinned,
            'comment_count': comment_count
        })
    
    return jsonify({'announcements': announcements_data})

# POST /leagues/{league_id}/announcements (Commissioner only)
@app.route('/leagues/<int:league_id>/announcements', methods=['POST'])
@require_authentication
@require_commissioner_access
def create_league_announcement(league_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    announcement = LeagueAnnouncement(
        league_id=league_id,
        title=data['title'],
        content=data['content'],
        author_id=user_id,
        pinned=data.get('pinned', False)
    )
    
    db.session.add(announcement)
    db.session.commit()
    
    return jsonify({'success': True, 'announcement_id': announcement.id})
```

### 7. Invite System

#### POST /leagues/{league_id}/invites
```python
@app.route('/leagues/<int:league_id>/invites', methods=['POST'])
@require_authentication
@require_commissioner_access
def create_league_invite(league_id, current_membership):
    data = request.get_json()
    user_id = session.get('user_id')
    
    # Generate unique invite code
    invite_code = generate_invite_code()
    
    invite = LeagueInvite(
        league_id=league_id,
        invited_by=user_id,
        email=data['email'],
        invite_code=invite_code,
        role=data.get('role', 'user'),
        team_id=data.get('team_id')
    )
    
    db.session.add(invite)
    db.session.commit()
    
    # Send invite email
    send_league_invite_email(data['email'], invite_code, league_id)
    
    return jsonify({
        'success': True,
        'invite_code': invite_code,
        'invite_url': f"https://www.couchlytics.com/join/{invite_code}"
    })

def generate_invite_code():
    import secrets
    return secrets.token_urlsafe(16)
```

#### GET /join/{invite_code}
```python
@app.route('/join/<invite_code>', methods=['GET'])
def process_invite(invite_code):
    invite = LeagueInvite.query.filter_by(
        invite_code=invite_code,
        is_active=True
    ).first()
    
    if not invite:
        return jsonify({'error': 'Invalid or expired invite'}), 404
    
    if invite.expires_at < datetime.utcnow():
        return jsonify({'error': 'Invite has expired'}), 400
    
    if invite.used_at:
        return jsonify({'error': 'Invite has already been used'}), 400
    
    # Check if user is logged in
    user_id = session.get('user_id')
    
    if user_id:
        # User is logged in, add to league directly
        existing_membership = LeagueMembership.query.filter_by(
            league_id=invite.league_id,
            user_id=user_id
        ).first()
        
        if existing_membership:
            return jsonify({'error': 'You are already a member of this league'}), 400
        
        # Create membership
        membership = LeagueMembership(
            league_id=invite.league_id,
            user_id=user_id,
            role=invite.role,
            team_id=invite.team_id
        )
        
        db.session.add(membership)
        
        # Mark invite as used
        invite.used_at = datetime.utcnow()
        invite.used_by = user_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Successfully joined league',
            'redirect_url': f'/leagues/{invite.league_id}'
        })
    else:
        # User not logged in, redirect to registration with invite context
        return jsonify({
            'success': False,
            'registration_required': True,
            'invite_details': {
                'league_name': League.query.get(invite.league_id).name,
                'role': invite.role,
                'invite_code': invite_code
            },
            'redirect_url': f'/register?invite={invite_code}'
        })
```

### 8. Online Status Tracking

#### POST /leagues/{league_id}/online-status/update
```python
@app.route('/leagues/<int:league_id>/online-status/update', methods=['POST'])
@require_authentication
@require_league_access()
def update_online_status(league_id, current_membership):
    user_id = session.get('user_id')
    
    status = UserOnlineStatus.query.filter_by(
        user_id=user_id,
        league_id=league_id
    ).first()
    
    if not status:
        status = UserOnlineStatus(user_id=user_id, league_id=league_id)
        db.session.add(status)
    
    status.is_online = True
    status.last_seen = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'success': True})

# Background task to mark users offline after inactivity
def mark_inactive_users_offline():
    threshold = datetime.utcnow() - timedelta(minutes=5)
    
    UserOnlineStatus.query.filter(
        UserOnlineStatus.last_seen < threshold,
        UserOnlineStatus.is_online == True
    ).update({'is_online': False})
    
    db.session.commit()

# GET /leagues/{league_id}/online-users
@app.route('/leagues/<int:league_id>/online-users', methods=['GET'])
@require_authentication
@require_league_access()
def get_online_users(league_id, current_membership):
    # Mark users offline if inactive
    mark_inactive_users_offline()
    
    online_users = db.session.query(
        UserOnlineStatus, User
    ).join(
        User, UserOnlineStatus.user_id == User.id
    ).filter(
        UserOnlineStatus.league_id == league_id,
        UserOnlineStatus.is_online == True
    ).all()
    
    users_data = []
    for status, user in online_users:
        users_data.append({
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}",
            'last_seen': status.last_seen.isoformat()
        })
    
    return jsonify({'online_users': users_data})
```

### 9. League Settings & Import

#### GET /leagues/{league_id}/settings
```python
@app.route('/leagues/<int:league_id>/settings', methods=['GET'])
@require_authentication
@require_commissioner_access
def get_league_settings(league_id, current_membership):
    league = League.query.get_or_404(league_id)
    
    return jsonify({
        'settings': {
            'name': league.name,
            'description': league.description,
            'auto_approve_trades': league.auto_approve_trades,
            'auto_approve_threshold': float(league.auto_approve_threshold),
            'trade_committee_votes_needed': league.trade_committee_votes_needed,
            'max_roster_size': league.max_roster_size,
            'league_type': league.league_type,
            'scoring_system': league.scoring_system,
            'import_instructions': league.import_instructions,
            'companion_app_connected': league.companion_app_connected,
            'last_import_date': league.last_import_date.isoformat() if league.last_import_date else None
        }
    })

# PUT /leagues/{league_id}/settings
@app.route('/leagues/<int:league_id>/settings', methods=['PUT'])
@require_authentication
@require_commissioner_access
def update_league_settings(league_id, current_membership):
    league = League.query.get_or_404(league_id)
    data = request.get_json()
    
    # Update settings
    for field in ['name', 'description', 'auto_approve_trades', 'auto_approve_threshold', 
                  'trade_committee_votes_needed', 'max_roster_size', 'league_type', 
                  'scoring_system', 'import_instructions']:
        if field in data:
            setattr(league, field, data[field])
    
    league.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'League settings updated'})
```

---

## 🔧 Utility Functions

### Helper Functions
```python
def get_user_name(user_id):
    user = User.query.get(user_id)
    if user:
        return f"{user.first_name} {user.last_name}"
    return "Unknown User"

def calculate_trade_value_difference(trade_offer_id):
    # Implement trade value calculation logic
    # This would integrate with your player valuation system
    return 0.0  # Placeholder

def create_trade_history_record(trade_offer):
    # Get all players in the trade
    players = TradeOfferPlayer.query.filter_by(trade_offer_id=trade_offer.id).all()
    
    players_data = {
        'offered': [{'id': p.player_id, 'name': p.player_name, 'position': p.position} 
                   for p in players if p.from_user],
        'wanted': [{'id': p.player_id, 'name': p.player_name, 'position': p.position} 
                  for p in players if not p.from_user]
    }
    
    history = TradeHistory(
        league_id=trade_offer.league_id,
        trade_offer_id=trade_offer.id,
        from_user_id=trade_offer.from_user_id,
        to_user_id=trade_offer.to_user_id,
        players_traded=players_data,
        approved_by='auto' if trade_offer.auto_approved else 'committee',
        season_year=League.query.get(trade_offer.league_id).season_year,
        week=League.query.get(trade_offer.league_id).week
    )
    
    db.session.add(history)
    db.session.commit()

def send_trade_notifications(trade_offer, notification_type):
    # Implement notification system (email, push, in-app)
    pass

def send_trade_committee_notification(trade_offer):
    # Notify trade committee members
    pass

def send_league_invite_email(email, invite_code, league_id):
    # Implement email service
    pass

def send_password_reset_email(email, reset_token):
    # Implement email service
    pass
```

---

## 🚀 Deployment & Configuration

### Flask App Configuration
```python
import os
from flask import Flask
from flask_cors import CORS
from datetime import timedelta
import redis

app = Flask(__name__)

# Basic configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['DATABASE_URL'] = os.environ.get('DATABASE_URL')

# Session configuration
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_REDIS'] = redis.from_url(os.environ.get('REDIS_URL'))
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

# CORS configuration
CORS(app, 
     origins=['https://www.couchlytics.com', 'https://couchlytics.vercel.app'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Authorization', 'Content-Type'])

# Cookie configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_DOMAIN='couchlytics.com'
)
```

### Environment Variables
```bash
# Core Configuration
SECRET_KEY=your-super-secret-key
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://localhost:6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-app-password

# External APIs
SLEEPER_API_KEY=your-sleeper-api-key
ESPN_API_KEY=your-espn-api-key
```

---

## 📊 Performance & Monitoring

### Database Optimization
```sql
-- Additional indexes for performance
CREATE INDEX idx_trade_offers_league_status ON trade_offers(league_id, status);
CREATE INDEX idx_trade_block_league_active ON trade_block(league_id, is_active);
CREATE INDEX idx_memberships_league_active ON league_memberships(league_id, is_active);
CREATE INDEX idx_announcements_league_active ON league_announcements(league_id, is_active);

-- Composite indexes for common queries
CREATE INDEX idx_trade_votes_offer_user ON trade_committee_votes(trade_offer_id, user_id);
CREATE INDEX idx_online_status_league_online ON user_online_status(league_id, is_online);
```

### Caching Strategy
```python
import redis
from functools import wraps

redis_client = redis.from_url(os.environ.get('REDIS_URL'))

def cache_result(expiration=300):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Create cache key
            cache_key = f"{f.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Execute function
            result = f(*args, **kwargs)
            
            # Cache result
            redis_client.setex(cache_key, expiration, json.dumps(result))
            
            return result
        return decorated_function
    return decorator

# Usage example
@cache_result(expiration=600)  # Cache for 10 minutes
def get_league_standings(league_id):
    # Expensive calculation
    return calculate_standings(league_id)
```

---

## 🧪 Testing & Validation

### API Testing Examples
```bash
# Test authentication flow
curl -X POST https://api.couchlytics.com/auth/sync-firebase \
  -H "Content-Type: application/json" \
  -d '{"firebase_uid":"test-uid","email":"test@example.com"}' \
  --cookie-jar cookies.txt

# Test league context switching
curl -X POST https://api.couchlytics.com/leagues/12335716/switch-context \
  -H "Content-Type: application/json" \
  --cookie cookies.txt

# Test trade offer creation
curl -X POST https://api.couchlytics.com/leagues/12335716/trades/offer \
  -H "Content-Type: application/json" \
  -d '{"to_user_id":456,"players_offered":[{"id":1,"name":"Player 1"}],"players_wanted":[{"id":2,"name":"Player 2"}]}' \
  --cookie cookies.txt

# Test trade block
curl -X GET https://api.couchlytics.com/leagues/12335716/trade-block \
  --cookie cookies.txt
```

### Database Migrations
```sql
-- Migration script example
BEGIN;

-- Add new columns for enhanced features
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_notifications": true}';
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS auto_approve_trades BOOLEAN DEFAULT FALSE;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS trade_committee_votes_needed INTEGER DEFAULT 3;

-- Create new tables
CREATE TABLE IF NOT EXISTS trade_offers (
    -- Table definition here
);

-- Update existing data
UPDATE users SET notification_settings = '{"email_notifications": true, "push_notifications": true, "trade_notifications": true, "league_announcements": true, "chat_notifications": true}' WHERE notification_settings IS NULL;

COMMIT;
```

---

## 🎯 Implementation Priority

### Phase 1: Core Infrastructure ✅
- [ ] User profile management endpoints
- [ ] Multi-league support
- [ ] Developer system management
- [ ] Enhanced authentication/authorization

### Phase 2: Trade System ✅
- [ ] Trade offer creation and management
- [ ] Committee voting system
- [ ] Auto-approval logic
- [ ] Trade block functionality
- [ ] Trade history tracking

### Phase 3: Communication ✅
- [ ] Global announcement system
- [ ] League announcement system
- [ ] Schedule comments
- [ ] Trade block discussions
- [ ] Online status tracking

### Phase 4: Advanced Features ✅
- [ ] Invite system with seamless registration
- [ ] League settings and import functionality
- [ ] Real-time notifications
- [ ] Performance optimization

---

## 🆘 Troubleshooting

### Common Issues

**1. Multi-League Context Switching**
- Ensure session properly tracks current league context
- Validate league membership before allowing operations
- Clear online status when switching leagues

**2. Trade Committee Voting**
- Verify vote counting logic matches league settings
- Prevent duplicate votes from same user
- Handle edge cases when committee members leave league

**3. Online Status Accuracy**
- Implement heartbeat mechanism for reliable status
- Handle browser close/refresh scenarios
- Batch status updates for performance

**4. Invite System Edge Cases**
- Handle expired invites gracefully
- Prevent duplicate memberships
- Validate invite permissions

---

## 📈 Success Metrics

When properly implemented, you should see:

✅ **Multi-league functionality** working seamlessly
✅ **Trade system** with offers, committee voting, and auto-approval
✅ **Trade block** with player listings and discussions
✅ **Message boards** for announcements and scheduling
✅ **Developer tools** for system management
✅ **Invite system** with seamless registration flow
✅ **Real-time features** like online status and notifications
✅ **Performance optimization** with caching and indexing

This comprehensive backend will support all the advanced features in your frontend! 🚀
