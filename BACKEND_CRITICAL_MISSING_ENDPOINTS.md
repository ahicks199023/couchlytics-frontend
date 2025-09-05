# 🚨 Critical Missing Backend Endpoints

## ❌ **Current 404/403 Errors**
- `GET /leagues/{leagueId}/invitations` → 404
- `POST /leagues/{leagueId}/invitations` → 404  
- `GET /leagues/{leagueId}/members` → 403
- `GET /notifications/unread-count` → 404

## 🎯 **Required Endpoint Implementations**

### **1. GET /leagues/{leagueId}/invitations**
```python
@leagues_bp.route('/<int:league_id>/invitations', methods=['GET'])
@login_required
def get_league_invitations(league_id):
    try:
        # Check commissioner access
        if not has_commissioner_access(league_id):
            return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
        
        invitations = LeagueInvitation.query.filter_by(league_id=league_id).all()
        
        invitations_data = []
        for inv in invitations:
            invitations_data.append({
                'id': inv.id,
                'invitation_code': inv.invitation_code,
                'max_uses': inv.max_uses,
                'current_uses': inv.current_uses,
                'expires_at': inv.expires_at.isoformat(),
                'is_active': inv.is_active,
                'is_valid': inv.is_valid,
                'role': inv.role,
                'invited_email': inv.invited_email,
                'league_id': inv.league_id,
                'created_at': inv.created_at.isoformat()
            })
        
        return jsonify({'success': True, 'invitations': invitations_data})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to fetch invitations'}), 500
```

### **2. POST /leagues/{leagueId}/invitations**
```python
@leagues_bp.route('/<int:league_id>/invitations', methods=['POST'])
@login_required
def create_league_invitation(league_id):
    try:
        if not has_commissioner_access(league_id):
            return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Generate unique invitation code
        invitation_code = generate_invitation_code()
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(days=data['expires_in_days'])
        
        # Create invitation
        invitation = LeagueInvitation(
            league_id=league_id,
            invitation_code=invitation_code,
            max_uses=data['max_uses'],
            current_uses=0,
            expires_at=expires_at,
            is_active=True,
            is_valid=True,
            role=data['role'],
            invited_email=data.get('invited_email'),
            custom_message=data.get('custom_message')
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation.id,
                'invitation_code': invitation.invitation_code,
                'max_uses': invitation.max_uses,
                'current_uses': invitation.current_uses,
                'expires_at': invitation.expires_at.isoformat(),
                'is_active': invitation.is_active,
                'is_valid': invitation.is_valid,
                'role': invitation.role,
                'invited_email': invitation.invited_email,
                'league_id': invitation.league_id,
                'created_at': invitation.created_at.isoformat()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create invitation'}), 500
```

### **3. GET /leagues/{leagueId}/members**
```python
@leagues_bp.route('/<int:league_id>/members', methods=['GET'])
@login_required
def get_league_members(league_id):
    try:
        if not has_commissioner_access(league_id):
            return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
        
        members = LeagueMember.query.filter_by(league_id=league_id).all()
        
        members_data = []
        for member in members:
            members_data.append({
                'id': member.id,
                'user_id': member.user_id,
                'league_id': member.league_id,
                'role': member.role,
                'joined_at': member.joined_at.isoformat(),
                'user': {
                    'id': member.user.id,
                    'email': member.user.email,
                    'display_name': member.user.display_name,
                    'first_name': member.user.first_name,
                    'last_name': member.user.last_name
                }
            })
        
        return jsonify({'success': True, 'members': members_data})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to fetch members'}), 500
```

### **4. GET /notifications/unread-count**
```python
@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    try:
        user_id = current_user.id
        
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
        
        return jsonify({'success': True, 'unread_count': unread_count})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to fetch unread count'}), 500
```

## 🗄️ **Required Database Models**

### **LeagueInvitation**
```python
class LeagueInvitation(db.Model):
    __tablename__ = 'league_invitations'
    
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    invitation_code = db.Column(db.String(50), unique=True, nullable=False)
    max_uses = db.Column(db.Integer, default=1, nullable=False)
    current_uses = db.Column(db.Integer, default=0, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_valid = db.Column(db.Boolean, default=True, nullable=False)
    role = db.Column(db.String(20), default='member', nullable=False)
    invited_email = db.Column(db.String(255), nullable=True)
    custom_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
```

### **LeagueMember**
```python
class LeagueMember(db.Model):
    __tablename__ = 'league_members'
    
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='member', nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('league_id', 'user_id'),)
```

### **Notification**
```python
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
```

## 🛠️ **Helper Functions**

```python
def has_commissioner_access(league_id):
    """Check if current user has commissioner access"""
    if current_user.is_admin:
        return True
    
    member = LeagueMember.query.filter_by(
        league_id=league_id,
        user_id=current_user.id,
        role='commissioner'
    ).first()
    
    return member is not None

def generate_invitation_code(length=8):
    """Generate unique invitation code"""
    import secrets
    import string
    
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
        existing = LeagueInvitation.query.filter_by(invitation_code=code).first()
        if not existing:
            return code
```

## 📋 **Implementation Steps**

1. **Create database tables** (see models above)
2. **Add routes to your leagues blueprint**
3. **Add notification routes to notifications blueprint**
4. **Test endpoints** with curl or Postman
5. **Verify frontend works** after implementation

## ✅ **Expected Results**

After implementing these 4 endpoints:
- ✅ 404 errors → 200 responses
- ✅ 403 errors → 200 responses  
- ✅ Frontend invitation system fully functional
- ✅ All API calls successful

---

*This guide provides the exact code for the 4 missing endpoints causing your 404/403 errors.*


