# 🚀 Backend System Announcements API Implementation Guide

## Overview
This guide provides the complete backend implementation for the System Announcements feature, allowing admins to create, manage, and publish platform-wide announcements that appear on the Couchlytics Central dashboard.

## Database Schema

### System Announcements Table
```sql
CREATE TABLE system_announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('announcement', 'update', 'maintenance', 'feature')),
    is_published BOOLEAN DEFAULT FALSE,
    cover_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_system_announcements_published ON system_announcements(is_published);
CREATE INDEX idx_system_announcements_created_at ON system_announcements(created_at DESC);
```

## API Endpoints

### 1. Admin Endpoints (System Admin Only)

#### GET /admin/announcements
**Description:** Get all system announcements (admin view)
**Authentication:** Required (System Admin)
**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "id": 1,
      "title": "Welcome to Couchlytics Central!",
      "content": "This is your members-only dashboard...",
      "author": "Couchlytics Team",
      "author_role": "Developer",
      "created_at": "2025-09-13T16:00:00Z",
      "updated_at": "2025-09-13T16:00:00Z",
      "priority": "high",
      "category": "announcement",
      "is_published": true,
      "cover_photo": null
    }
  ]
}
```

#### POST /admin/announcements
**Description:** Create a new system announcement
**Authentication:** Required (System Admin)
**Request Body:**
```json
{
  "title": "New Feature Release",
  "content": "We're excited to announce...",
  "priority": "high",
  "category": "feature",
  "is_published": true
}
```
**Response:**
```json
{
  "success": true,
  "id": 2,
  "title": "New Feature Release",
  "content": "We're excited to announce...",
  "author": "antoinehickssales@gmail.com",
  "author_role": "system_admin",
  "created_at": "2025-09-13T16:00:00Z",
  "updated_at": "2025-09-13T16:00:00Z",
  "priority": "high",
  "category": "feature",
  "is_published": true,
  "cover_photo": null
}
```

#### PUT /admin/announcements/{id}
**Description:** Update an existing system announcement
**Authentication:** Required (System Admin)
**Request Body:** Same as POST
**Response:** Same as POST

#### PATCH /admin/announcements/{id}/status
**Description:** Toggle publish status of an announcement
**Authentication:** Required (System Admin)
**Request Body:**
```json
{
  "is_published": true
}
```
**Response:**
```json
{
  "success": true,
  "message": "Announcement status updated successfully"
}
```

#### DELETE /admin/announcements/{id}
**Description:** Delete a system announcement
**Authentication:** Required (System Admin)
**Response:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```

### 2. Public Endpoints (Authenticated Users)

#### GET /central/announcements
**Description:** Get published system announcements for Couchlytics Central
**Authentication:** Required (Any authenticated user)
**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "id": 1,
      "title": "Welcome to Couchlytics Central!",
      "content": "This is your members-only dashboard...",
      "author": "Couchlytics Team",
      "author_role": "Developer",
      "created_at": "2025-09-13T16:00:00Z",
      "priority": "high",
      "category": "announcement"
    }
  ]
}
```

#### GET /central/leaderboard
**Description:** Get top league managers for Couchlytics Central
**Authentication:** Required (Any authenticated user)
**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "id": 1,
      "username": "LeagueMaster",
      "total_leagues": 5,
      "commissioner_leagues": 3,
      "total_trades": 12,
      "reputation_score": 95
    }
  ]
}
```

## Python/Flask Implementation

### 1. Database Models
```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, CheckConstraint
from sqlalchemy.sql import func
from your_app import db

class SystemAnnouncement(db.Model):
    __tablename__ = 'system_announcements'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    author = Column(String(255), nullable=False)
    author_role = Column(String(100), nullable=False)
    priority = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)
    is_published = Column(Boolean, default=False)
    cover_photo = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    __table_args__ = (
        CheckConstraint("priority IN ('low', 'medium', 'high')", name='check_priority'),
        CheckConstraint("category IN ('announcement', 'update', 'maintenance', 'feature')", name='check_category'),
    )
```

### 2. Admin Routes
```python
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from your_app import db
from your_app.models import SystemAnnouncement
from your_app.decorators import admin_required

admin_announcements = Blueprint('admin_announcements', __name__)

@admin_announcements.route('/admin/announcements', methods=['GET'])
@login_required
@admin_required
def get_admin_announcements():
    try:
        announcements = SystemAnnouncement.query.order_by(SystemAnnouncement.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'announcements': [announcement.to_dict() for announcement in announcements]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_announcements.route('/admin/announcements', methods=['POST'])
@login_required
@admin_required
def create_announcement():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content', 'priority', 'category']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Create announcement
        announcement = SystemAnnouncement(
            title=data['title'],
            content=data['content'],
            author=current_user.email,
            author_role=current_user.role,
            priority=data['priority'],
            category=data['category'],
            is_published=data.get('is_published', False)
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        return jsonify({
            'success': True,
            **announcement.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_announcements.route('/admin/announcements/<int:announcement_id>', methods=['PUT'])
@login_required
@admin_required
def update_announcement(announcement_id):
    try:
        announcement = SystemAnnouncement.query.get_or_404(announcement_id)
        data = request.get_json()
        
        # Update fields
        announcement.title = data.get('title', announcement.title)
        announcement.content = data.get('content', announcement.content)
        announcement.priority = data.get('priority', announcement.priority)
        announcement.category = data.get('category', announcement.category)
        announcement.is_published = data.get('is_published', announcement.is_published)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            **announcement.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_announcements.route('/admin/announcements/<int:announcement_id>/status', methods=['PATCH'])
@login_required
@admin_required
def update_announcement_status(announcement_id):
    try:
        announcement = SystemAnnouncement.query.get_or_404(announcement_id)
        data = request.get_json()
        
        announcement.is_published = data.get('is_published', announcement.is_published)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Announcement status updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_announcements.route('/admin/announcements/<int:announcement_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_announcement(announcement_id):
    try:
        announcement = SystemAnnouncement.query.get_or_404(announcement_id)
        
        db.session.delete(announcement)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Announcement deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
```

### 3. Public Routes
```python
from flask import Blueprint, jsonify
from flask_login import login_required
from your_app.models import SystemAnnouncement, User, League

central = Blueprint('central', __name__)

@central.route('/central/announcements', methods=['GET'])
@login_required
def get_central_announcements():
    try:
        # Get only published announcements
        announcements = SystemAnnouncement.query.filter_by(is_published=True)\
            .order_by(SystemAnnouncement.created_at.desc())\
            .all()
        
        return jsonify({
            'success': True,
            'announcements': [announcement.to_public_dict() for announcement in announcements]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@central.route('/central/leaderboard', methods=['GET'])
@login_required
def get_central_leaderboard():
    try:
        # Get top users by reputation score
        users = User.query.filter(User.reputation_score.isnot(None))\
            .order_by(User.reputation_score.desc())\
            .limit(10)\
            .all()
        
        leaderboard = []
        for user in users:
            # Calculate stats
            total_leagues = League.query.filter_by(commissioner_id=user.id).count()
            total_trades = 0  # Calculate from trades table
            
            leaderboard.append({
                'id': user.id,
                'username': user.username or user.email.split('@')[0],
                'total_leagues': total_leagues,
                'commissioner_leagues': total_leagues,
                'total_trades': total_trades,
                'reputation_score': user.reputation_score or 0
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

### 4. Model Methods
```python
# Add to SystemAnnouncement model
def to_dict(self):
    return {
        'id': self.id,
        'title': self.title,
        'content': self.content,
        'author': self.author,
        'author_role': self.author_role,
        'created_at': self.created_at.isoformat(),
        'updated_at': self.updated_at.isoformat(),
        'priority': self.priority,
        'category': self.category,
        'is_published': self.is_published,
        'cover_photo': self.cover_photo
    }

def to_public_dict(self):
    return {
        'id': self.id,
        'title': self.title,
        'content': self.content,
        'author': self.author,
        'author_role': self.author_role,
        'created_at': self.created_at.isoformat(),
        'priority': self.priority,
        'category': self.category
    }
```

## Security Considerations

1. **Authentication:** All endpoints require authentication
2. **Authorization:** Admin endpoints require system admin role
3. **Input Validation:** Validate all input data
4. **SQL Injection:** Use parameterized queries
5. **Rate Limiting:** Implement rate limiting for API endpoints

## Testing

### Test Data
```sql
-- Insert test announcements
INSERT INTO system_announcements (title, content, author, author_role, priority, category, is_published) VALUES
('Welcome to Couchlytics Central!', 'This is your members-only dashboard where you can stay updated on all platform announcements, updates, and connect with other league managers.', 'Couchlytics Team', 'Developer', 'high', 'announcement', true),
('New Trade System Features Coming Soon', 'We''re working on enhanced committee voting, auto-approval logic, and improved trade analytics. Stay tuned for updates!', 'Development Team', 'Developer', 'medium', 'update', true),
('League Invitation System Now Live!', 'Commissioners can now create invitation links to easily invite new members to their leagues. Check out the new invitation management tools in your league settings.', 'Development Team', 'Developer', 'high', 'feature', true);
```

## Deployment Checklist

- [ ] Create database table
- [ ] Add model to your app
- [ ] Register blueprints
- [ ] Test all endpoints
- [ ] Update CORS settings if needed
- [ ] Deploy and verify functionality

## Frontend Integration

The frontend is already set up to consume these endpoints:
- Admin interface: `/admin/announcements`
- Public display: `/central/announcements`
- Leaderboard: `/central/leaderboard`

Once the backend is implemented, the system will be fully functional!
