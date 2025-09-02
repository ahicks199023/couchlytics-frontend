# 🎯 Backend League Invitation System Implementation Guide

## 📋 **Overview**

This guide provides complete backend implementation for the League Invitation System, allowing commissioners to create invitation links that automatically join users to their leagues. The system handles both existing Couchlytics users and new user registration seamlessly.

---

## 🚀 **System Features**

### **For Commissioners:**
- ✅ **Create invitation links** with customizable settings
- ✅ **Manage invitations** (view, edit, delete, deactivate)
- ✅ **Set invitation parameters** (expiration, max uses, specific email, role)
- ✅ **View league members** and manage their roles
- ✅ **Receive notifications** when users join via invitation
- ✅ **User management** - assign new members to teams

### **For Users:**
- ✅ **Existing users** - click link and automatically join league
- ✅ **New users** - register and automatically join league
- ✅ **Seamless experience** - no additional login required after registration
- ✅ **Role assignment** - automatically assigned role specified in invitation

---

## 🗄️ **Database Schema**

### **1. Invitations Table**

```sql
CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    invitation_code VARCHAR(255) UNIQUE NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_invitations_league_id ON invitations(league_id);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_invitations_is_active ON invitations(is_active);
```

### **2. League Members Table (if not exists)**

```sql
CREATE TABLE league_members (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by INTEGER REFERENCES users(id),
    invitation_id INTEGER REFERENCES invitations(id),
    UNIQUE(league_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_league_members_league_id ON league_members(league_id);
CREATE INDEX idx_league_members_user_id ON league_members(user_id);
CREATE INDEX idx_league_members_role ON league_members(role);
```

### **3. Notifications Table (if not exists)**

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## 🔧 **Backend Implementation**

### **1. Invitation Management Routes**

```python
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import secrets
import string
import logging

invitations_bp = Blueprint('invitations', __name__)
logger = logging.getLogger(__name__)

def generate_invitation_code():
    """Generate a unique invitation code"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['GET'])
@login_required
def get_invitations(league_id):
    """Get all invitations for a league"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        invitations = db.session.query(Invitation).filter_by(league_id=league_id).all()
        
        invitation_list = []
        for invitation in invitations:
            invitation_list.append({
                'id': invitation.id,
                'invitation_code': invitation.invitation_code,
                'max_uses': invitation.max_uses,
                'current_uses': invitation.current_uses,
                'expires_at': invitation.expires_at.isoformat(),
                'is_active': invitation.is_active,
                'is_valid': invitation.is_active and invitation.expires_at > datetime.utcnow() and invitation.current_uses < invitation.max_uses,
                'role': invitation.role,
                'invited_email': invitation.invited_email,
                'metadata': invitation.metadata,
                'created_at': invitation.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'invitations': invitation_list
        })
        
    except Exception as e:
        logger.error(f"Error fetching invitations: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/leagues/<int:league_id>/invitations', methods=['POST'])
@login_required
def create_invitation(league_id):
    """Create a new invitation"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        max_uses = data.get('max_uses', 1)
        expires_in_days = data.get('expires_in_days', 7)
        role = data.get('role', 'member')
        invited_email = data.get('invited_email')
        custom_message = data.get('custom_message', '')
        
        # Validate inputs
        if max_uses < 1 or max_uses > 100:
            return jsonify({'success': False, 'error': 'Max uses must be between 1 and 100'}), 400
        
        if expires_in_days < 1 or expires_in_days > 30:
            return jsonify({'success': False, 'error': 'Expiration must be between 1 and 30 days'}), 400
        
        if role not in ['member', 'co_commissioner']:
            return jsonify({'success': False, 'error': 'Invalid role'}), 400
        
        # Generate unique invitation code
        invitation_code = generate_invitation_code()
        while db.session.query(Invitation).filter_by(invitation_code=invitation_code).first():
            invitation_code = generate_invitation_code()
        
        # Calculate expiration date
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create invitation
        invitation = Invitation(
            league_id=league_id,
            invitation_code=invitation_code,
            max_uses=max_uses,
            current_uses=0,
            expires_at=expires_at,
            is_active=True,
            role=role,
            invited_email=invited_email,
            metadata={'custom_message': custom_message} if custom_message else None
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation.id,
                'invitation_code': invitation.invitation_code,
                'max_uses': invitation.max_uses,
                'expires_at': invitation.expires_at.isoformat(),
                'role': invitation.role,
                'invited_email': invitation.invited_email
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating invitation: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/leagues/<int:league_id>/invitations/<int:invitation_id>', methods=['PUT'])
@login_required
def update_invitation(league_id, invitation_id):
    """Update an invitation"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        invitation = db.session.query(Invitation).filter_by(
            id=invitation_id, 
            league_id=league_id
        ).first()
        
        if not invitation:
            return jsonify({'success': False, 'error': 'Invitation not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'is_active' in data:
            invitation.is_active = data['is_active']
        
        if 'max_uses' in data:
            invitation.max_uses = data['max_uses']
        
        if 'expires_in_days' in data:
            invitation.expires_at = datetime.utcnow() + timedelta(days=data['expires_in_days'])
        
        if 'role' in data:
            invitation.role = data['role']
        
        if 'custom_message' in data:
            invitation.metadata = {'custom_message': data['custom_message']}
        
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error updating invitation: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/leagues/<int:league_id>/invitations/<int:invitation_id>', methods=['DELETE'])
@login_required
def delete_invitation(league_id, invitation_id):
    """Delete an invitation"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        invitation = db.session.query(Invitation).filter_by(
            id=invitation_id, 
            league_id=league_id
        ).first()
        
        if not invitation:
            return jsonify({'success': False, 'error': 'Invitation not found'}), 404
        
        db.session.delete(invitation)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error deleting invitation: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **2. Invitation Validation and Joining**

```python
@invitations_bp.route('/invitations/<invitation_code>/validate', methods=['GET'])
def validate_invitation(invitation_code):
    """Validate an invitation code"""
    try:
        invitation = db.session.query(Invitation).filter_by(
            invitation_code=invitation_code
        ).first()
        
        if not invitation:
            return jsonify({'success': False, 'error': 'Invalid invitation code'}), 404
        
        # Check if invitation is still valid
        if not invitation.is_active:
            return jsonify({'success': False, 'error': 'Invitation is no longer active'}), 400
        
        if invitation.expires_at < datetime.utcnow():
            return jsonify({'success': False, 'error': 'Invitation has expired'}), 400
        
        if invitation.current_uses >= invitation.max_uses:
            return jsonify({'success': False, 'error': 'Invitation has reached maximum uses'}), 400
        
        # Get league information
        league = db.session.query(League).filter_by(id=invitation.league_id).first()
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation.id,
                'invitation_code': invitation.invitation_code,
                'max_uses': invitation.max_uses,
                'current_uses': invitation.current_uses,
                'expires_at': invitation.expires_at.isoformat(),
                'role': invitation.role,
                'invited_email': invitation.invited_email,
                'metadata': invitation.metadata
            },
            'league': {
                'id': league.id,
                'name': league.name,
                'description': league.description,
                'season_year': league.season_year,
                'max_teams': league.max_teams
            }
        })
        
    except Exception as e:
        logger.error(f"Error validating invitation: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/invitations/<invitation_code>/join', methods=['POST'])
@login_required
def join_league_via_invitation(invitation_code):
    """Join a league using an invitation code"""
    try:
        invitation = db.session.query(Invitation).filter_by(
            invitation_code=invitation_code
        ).first()
        
        if not invitation:
            return jsonify({'success': False, 'error': 'Invalid invitation code'}), 404
        
        # Check if invitation is still valid
        if not invitation.is_active:
            return jsonify({'success': False, 'error': 'Invitation is no longer active'}), 400
        
        if invitation.expires_at < datetime.utcnow():
            return jsonify({'success': False, 'error': 'Invitation has expired'}), 400
        
        if invitation.current_uses >= invitation.max_uses:
            return jsonify({'success': False, 'error': 'Invitation has reached maximum uses'}), 400
        
        # Check if user is already a member
        existing_member = db.session.query(LeagueMember).filter_by(
            league_id=invitation.league_id,
            user_id=current_user.id
        ).first()
        
        if existing_member:
            return jsonify({'success': False, 'error': 'You are already a member of this league'}), 400
        
        # Check if invitation is for specific email
        if invitation.invited_email and invitation.invited_email != current_user.email:
            return jsonify({'success': False, 'error': 'This invitation is for a different email address'}), 400
        
        # Add user to league
        league_member = LeagueMember(
            league_id=invitation.league_id,
            user_id=current_user.id,
            role=invitation.role,
            invited_by=current_user.id,
            invitation_id=invitation.id
        )
        
        db.session.add(league_member)
        
        # Update invitation usage
        invitation.current_uses += 1
        
        # Create notification for commissioners
        create_join_notification(invitation.league_id, current_user.id)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'league_id': invitation.league_id,
            'message': 'Successfully joined the league'
        })
        
    except Exception as e:
        logger.error(f"Error joining league via invitation: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **3. Member Management Routes**

```python
@invitations_bp.route('/leagues/<int:league_id>/members', methods=['GET'])
@login_required
def get_league_members(league_id):
    """Get all members of a league"""
    try:
        # Check if user is a member of the league
        if not is_league_member(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        members = db.session.query(LeagueMember, User).join(
            User, LeagueMember.user_id == User.id
        ).filter(LeagueMember.league_id == league_id).all()
        
        member_list = []
        for member, user in members:
            member_list.append({
                'id': member.id,
                'user_id': member.user_id,
                'league_id': member.league_id,
                'role': member.role,
                'joined_at': member.joined_at.isoformat(),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'display_name': user.display_name,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            })
        
        return jsonify({
            'success': True,
            'members': member_list
        })
        
    except Exception as e:
        logger.error(f"Error fetching league members: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/leagues/<int:league_id>/members/<int:user_id>/role', methods=['PUT'])
@login_required
def update_member_role(league_id, user_id):
    """Update a member's role"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        new_role = data.get('role')
        
        if new_role not in ['member', 'co_commissioner']:
            return jsonify({'success': False, 'error': 'Invalid role'}), 400
        
        member = db.session.query(LeagueMember).filter_by(
            league_id=league_id,
            user_id=user_id
        ).first()
        
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'}), 404
        
        member.role = new_role
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error updating member role: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/leagues/<int:league_id>/members/<int:user_id>', methods=['DELETE'])
@login_required
def remove_league_member(league_id, user_id):
    """Remove a member from the league"""
    try:
        # Check if user is commissioner of the league
        if not is_commissioner(current_user.id, league_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        member = db.session.query(LeagueMember).filter_by(
            league_id=league_id,
            user_id=user_id
        ).first()
        
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'}), 404
        
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error removing league member: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **4. Registration with Auto-Join**

```python
@invitations_bp.route('/register-with-invitation', methods=['POST'])
def register_with_invitation():
    """Register a new user and automatically join them to a league"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'invitation_code']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Validate invitation
        invitation = db.session.query(Invitation).filter_by(
            invitation_code=data['invitation_code']
        ).first()
        
        if not invitation:
            return jsonify({'success': False, 'error': 'Invalid invitation code'}), 404
        
        # Check if invitation is still valid
        if not invitation.is_active:
            return jsonify({'success': False, 'error': 'Invitation is no longer active'}), 400
        
        if invitation.expires_at < datetime.utcnow():
            return jsonify({'success': False, 'error': 'Invitation has expired'}), 400
        
        if invitation.current_uses >= invitation.max_uses:
            return jsonify({'success': False, 'error': 'Invitation has reached maximum uses'}), 400
        
        # Check if invitation is for specific email
        if invitation.invited_email and invitation.invited_email != data['email']:
            return jsonify({'success': False, 'error': 'This invitation is for a different email address'}), 400
        
        # Check if user already exists
        existing_user = db.session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            first_name=data['first_name'],
            last_name=data['last_name'],
            display_name=data.get('display_name', f"{data['first_name']} {data['last_name']}")
        )
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Add user to league
        league_member = LeagueMember(
            league_id=invitation.league_id,
            user_id=user.id,
            role=invitation.role,
            invited_by=user.id,
            invitation_id=invitation.id
        )
        
        db.session.add(league_member)
        
        # Update invitation usage
        invitation.current_uses += 1
        
        # Create notification for commissioners
        create_join_notification(invitation.league_id, user.id)
        
        db.session.commit()
        
        # Log the user in
        login_user(user)
        
        return jsonify({
            'success': True,
            'user_id': user.id,
            'league_id': invitation.league_id,
            'redirect_url': f'/leagues/{invitation.league_id}',
            'message': 'Account created and joined league successfully'
        })
        
    except Exception as e:
        logger.error(f"Error registering with invitation: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **5. Notification System**

```python
def create_join_notification(league_id, user_id):
    """Create notification when user joins league via invitation"""
    try:
        # Get all commissioners of the league
        commissioners = db.session.query(LeagueMember, User).join(
            User, LeagueMember.user_id == User.id
        ).filter(
            LeagueMember.league_id == league_id,
            LeagueMember.role.in_(['commissioner', 'co_commissioner'])
        ).all()
        
        # Get the joining user's info
        joining_user = db.session.query(User).filter_by(id=user_id).first()
        
        for member, commissioner in commissioners:
            notification = Notification(
                user_id=commissioner.id,
                title="New Member Joined",
                message=f"{joining_user.display_name} has joined your league via invitation",
                type="user_joined",
                metadata={
                    'league_id': league_id,
                    'league_name': db.session.query(League).filter_by(id=league_id).first().name,
                    'joining_user_id': user_id,
                    'joining_user_name': joining_user.display_name
                }
            )
            db.session.add(notification)
        
        db.session.commit()
        
    except Exception as e:
        logger.error(f"Error creating join notification: {str(e)}")
        db.session.rollback()

@invitations_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get user notifications"""
    try:
        per_page = request.args.get('per_page', 10, type=int)
        page = request.args.get('page', 1, type=int)
        
        notifications = db.session.query(Notification).filter_by(
            user_id=current_user.id
        ).order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        notification_list = []
        for notification in notifications.items:
            notification_list.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.type,
                'is_read': notification.is_read,
                'metadata': notification.metadata,
                'created_at': notification.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'notifications': notification_list,
            'total': notifications.total,
            'pages': notifications.pages,
            'current_page': page
        })
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        notification = db.session.query(Notification).filter_by(
            id=notification_id,
            user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        db.session.query(Notification).filter_by(
            user_id=current_user.id,
            is_read=False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@invitations_bp.route('/notifications/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """Get unread notification count"""
    try:
        count = db.session.query(Notification).filter_by(
            user_id=current_user.id,
            is_read=False
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': count
        })
        
    except Exception as e:
        logger.error(f"Error fetching unread count: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

### **6. Helper Functions**

```python
def is_commissioner(user_id, league_id):
    """Check if user is a commissioner of the league"""
    member = db.session.query(LeagueMember).filter_by(
        league_id=league_id,
        user_id=user_id,
        role='commissioner'
    ).first()
    return member is not None

def is_league_member(user_id, league_id):
    """Check if user is a member of the league"""
    member = db.session.query(LeagueMember).filter_by(
        league_id=league_id,
        user_id=user_id
    ).first()
    return member is not None

def is_co_commissioner(user_id, league_id):
    """Check if user is a co-commissioner of the league"""
    member = db.session.query(LeagueMember).filter_by(
        league_id=league_id,
        user_id=user_id,
        role='co_commissioner'
    ).first()
    return member is not None
```

---

## 🚀 **Deployment Steps**

### **1. Database Migration**

```python
# Create migration file: migrations/add_invitation_system.py
from flask_migrate import upgrade
from app import create_app, db

def upgrade():
    """Add invitation system tables"""
    # Create invitations table
    db.engine.execute("""
        CREATE TABLE IF NOT EXISTS invitations (
            id SERIAL PRIMARY KEY,
            league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
            invitation_code VARCHAR(255) UNIQUE NOT NULL,
            max_uses INTEGER NOT NULL DEFAULT 1,
            current_uses INTEGER NOT NULL DEFAULT 0,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            role VARCHAR(50) NOT NULL DEFAULT 'member',
            invited_email VARCHAR(255),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create indexes
    db.engine.execute("CREATE INDEX IF NOT EXISTS idx_invitations_league_id ON invitations(league_id);")
    db.engine.execute("CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);")
    db.engine.execute("CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);")
    db.engine.execute("CREATE INDEX IF NOT EXISTS idx_invitations_is_active ON invitations(is_active);")
    
    # Create league_members table if not exists
    db.engine.execute("""
        CREATE TABLE IF NOT EXISTS league_members (
            id SERIAL PRIMARY KEY,
            league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            invited_by INTEGER REFERENCES users(id),
            invitation_id INTEGER REFERENCES invitations(id),
            UNIQUE(league_id, user_id)
        );
    """)
    
    # Create notifications table if not exists
    db.engine.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT false,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        upgrade()
        print("Invitation system migration completed successfully!")
```

### **2. Register Blueprint**

```python
# In your main app.py or __init__.py
from app.invitations import invitations_bp

app.register_blueprint(invitations_bp, url_prefix='/api')
```

### **3. Environment Variables**

```bash
# Add to your .env file
INVITATION_EXPIRY_DAYS=7
MAX_INVITATION_USES=100
NOTIFICATION_POLL_INTERVAL=30
```

---

## 🧪 **Testing Commands**

### **Test Invitation Creation**

```bash
curl -X POST "http://localhost:5000/api/leagues/1/invitations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "max_uses": 5,
    "expires_in_days": 7,
    "role": "member",
    "custom_message": "Welcome to our league!"
  }'
```

### **Test Invitation Validation**

```bash
curl -X GET "http://localhost:5000/api/invitations/INVITATION_CODE/validate"
```

### **Test Joining League**

```bash
curl -X POST "http://localhost:5000/api/invitations/INVITATION_CODE/join" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test Registration with Auto-Join**

```bash
curl -X POST "http://localhost:5000/api/register-with-invitation" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "JohnDoe",
    "invitation_code": "INVITATION_CODE"
  }'
```

---

## ✅ **Verification Checklist**

- [ ] **Database tables created** with proper indexes
- [ ] **Invitation routes** working correctly
- [ ] **Member management** functioning
- [ ] **Notification system** operational
- [ ] **Registration with auto-join** working
- [ ] **Permission checks** implemented
- [ ] **Error handling** comprehensive
- [ ] **Testing** completed for all endpoints

---

## 🚨 **Security Considerations**

1. **Rate Limiting**: Implement rate limiting on invitation creation
2. **Input Validation**: Validate all inputs thoroughly
3. **Permission Checks**: Ensure proper authorization for all endpoints
4. **SQL Injection**: Use parameterized queries
5. **XSS Protection**: Sanitize user inputs
6. **CSRF Protection**: Implement CSRF tokens for state-changing operations

---

## 📞 **Support**

If you encounter issues during implementation:

1. **Check database connections** and table creation
2. **Verify route registration** and blueprint setup
3. **Test individual endpoints** with curl commands
4. **Check server logs** for detailed error messages
5. **Validate invitation codes** manually in database

The invitation system is now ready for deployment and will provide a seamless experience for league commissioners and users! 🚀
