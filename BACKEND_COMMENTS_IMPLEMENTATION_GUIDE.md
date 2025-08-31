# 🚀 Backend Implementation Guide: Announcement Comments & Threading

## 📋 **Overview**

This guide provides the complete backend implementation for the announcement comments and threading system. The frontend is now fully implemented and ready to work with these backend endpoints.

## 🗄️ **Database Schema**

### **Comments Table**
```sql
CREATE TABLE announcement_comments (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES announcement_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_announcement_comments_announcement_id ON announcement_comments(announcement_id);
CREATE INDEX idx_announcement_comments_parent_id ON announcement_comments(parent_comment_id);
CREATE INDEX idx_announcement_comments_user_id ON announcement_comments(user_id);
CREATE INDEX idx_announcement_comments_created_at ON announcement_comments(created_at);
```

## 🔧 **Python Models**

### **Comment Model**
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class AnnouncementComment(Base):
    __tablename__ = "announcement_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("announcement_comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    announcement = relationship("Announcement", back_populates="comments")
    user = relationship("User", back_populates="announcement_comments")
    parent_comment = relationship("AnnouncementComment", remote_side=[id], back_populates="replies")
    replies = relationship("AnnouncementComment", back_populates="parent_comment", cascade="all, delete-orphan")
    
    @property
    def reply_count(self):
        return len([r for r in self.replies if not r.is_deleted])
```

### **Update Existing Models**
```python
# In Announcement model, add:
comments = relationship("AnnouncementComment", back_populates="announcement", cascade="all, delete-orphan")

# In User model, add:
announcement_comments = relationship("AnnouncementComment", back_populates="user")
```

## 🌐 **API Endpoints**

### **1. GET Comments for Announcement**
```python
@app.route('/leagues/<int:league_id>/announcements/<int:announcement_id>/comments', methods=['GET'])
@login_required
def get_announcement_comments(league_id, announcement_id):
    """Get comments for a specific announcement with pagination and threading"""
    try:
        # Verify user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get the announcement
        announcement = db.session.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.league_id == league_id
        ).first()
        
        if not announcement:
            return jsonify({'error': 'Announcement not found'}), 404
        
        # Get top-level comments (parent_comment_id is NULL)
        comments_query = db.session.query(AnnouncementComment).filter(
            AnnouncementComment.announcement_id == announcement_id,
            AnnouncementComment.parent_comment_id.is_(None),
            AnnouncementComment.is_deleted == False
        ).order_by(AnnouncementComment.created_at.desc())
        
        # Apply pagination
        total = comments_query.count()
        comments = comments_query.offset(offset).limit(limit).all()
        
        # Build response with nested replies
        comments_data = []
        for comment in comments:
            comment_data = {
                'id': comment.id,
                'announcement_id': comment.announcement_id,
                'user_id': comment.user_id,
                'parent_comment_id': comment.parent_comment_id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'updated_at': comment.updated_at.isoformat(),
                'is_edited': comment.is_edited,
                'edited_at': comment.edited_at.isoformat() if comment.edited_at else None,
                'is_deleted': comment.is_deleted,
                'user': {
                    'email': comment.user.email,
                    'display_name': comment.user.display_name or comment.user.email
                },
                'replies': [],
                'reply_count': comment.reply_count
            }
            
            # Get replies for this comment
            replies = db.session.query(AnnouncementComment).filter(
                AnnouncementComment.parent_comment_id == comment.id,
                AnnouncementComment.is_deleted == False
            ).order_by(AnnouncementComment.created_at.asc()).all()
            
            for reply in replies:
                reply_data = {
                    'id': reply.id,
                    'parent_comment_id': reply.parent_comment_id,
                    'content': reply.content,
                    'created_at': reply.created_at.isoformat(),
                    'user_id': reply.user_id,
                    'updated_at': reply.updated_at.isoformat(),
                    'is_edited': reply.is_edited,
                    'edited_at': reply.edited_at.isoformat() if reply.edited_at else None,
                    'is_deleted': reply.is_deleted,
                    'user': {
                        'email': reply.user.email,
                        'display_name': reply.user.display_name or reply.user.email
                    }
                }
                comment_data['replies'].append(reply_data)
            
            comments_data.append(comment_data)
        
        return jsonify({
            'comments': comments_data,
            'total': total,
            'limit': limit,
            'offset': offset,
            'has_more': (offset + len(comments)) < total
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching comments: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

### **2. POST New Comment**
```python
@app.route('/leagues/<int:league_id>/announcements/<int:announcement_id>/comments', methods=['POST'])
@login_required
def create_announcement_comment(league_id, announcement_id):
    """Create a new comment or reply"""
    try:
        # Verify user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        parent_comment_id = data.get('parent_comment_id')
        
        if not content:
            return jsonify({'error': 'Comment content is required'}), 400
        
        if len(content) > 1000:
            return jsonify({'error': 'Comment too long (max 1000 characters)'}), 400
        
        # Get the announcement
        announcement = db.session.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.league_id == league_id
        ).first()
        
        if not announcement:
            return jsonify({'error': 'Announcement not found'}), 404
        
        # If this is a reply, verify parent comment exists
        if parent_comment_id:
            parent_comment = db.session.query(AnnouncementComment).filter(
                AnnouncementComment.id == parent_comment_id,
                AnnouncementComment.announcement_id == announcement_id,
                AnnouncementComment.is_deleted == False
            ).first()
            
            if not parent_comment:
                return jsonify({'error': 'Parent comment not found'}), 404
        
        # Create the comment
        new_comment = AnnouncementComment(
            announcement_id=announcement_id,
            user_id=current_user.id,
            parent_comment_id=parent_comment_id,
            content=content
        )
        
        db.session.add(new_comment)
        db.session.commit()
        
        # Return the created comment
        return jsonify({
            'id': new_comment.id,
            'announcement_id': new_comment.announcement_id,
            'user_id': new_comment.user_id,
            'parent_comment_id': new_comment.parent_comment_id,
            'content': new_comment.content,
            'created_at': new_comment.created_at.isoformat(),
            'updated_at': new_comment.updated_at.isoformat(),
            'is_edited': new_comment.is_edited,
            'edited_at': new_comment.edited_at.isoformat() if new_comment.edited_at else None,
            'is_deleted': new_comment.is_deleted,
            'user': {
                'email': current_user.email,
                'display_name': current_user.display_name or current_user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating comment: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

### **3. PUT Update Comment**
```python
@app.route('/leagues/<int:league_id>/announcements/<int:announcement_id>/comments/<int:comment_id>', methods=['PUT'])
@login_required
def update_announcement_comment(league_id, announcement_id, comment_id):
    """Update an existing comment"""
    try:
        # Verify user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': 'Comment content is required'}), 400
        
        if len(content) > 1000:
            return jsonify({'error': 'Comment too long (max 1000 characters)'}), 400
        
        # Get the comment
        comment = db.session.query(AnnouncementComment).filter(
            AnnouncementComment.id == comment_id,
            AnnouncementComment.announcement_id == announcement_id,
            AnnouncementComment.is_deleted == False
        ).first()
        
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Check if user can edit this comment
        if comment.user_id != current_user.id:
            return jsonify({'error': 'You can only edit your own comments'}), 403
        
        # Update the comment
        comment.content = content
        comment.is_edited = True
        comment.edited_at = datetime.utcnow()
        comment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'id': comment.id,
            'announcement_id': comment.announcement_id,
            'user_id': comment.user_id,
            'parent_comment_id': comment.parent_comment_id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'updated_at': comment.updated_at.isoformat(),
            'is_edited': comment.is_edited,
            'edited_at': comment.edited_at.isoformat() if comment.edited_at else None,
            'is_deleted': comment.is_deleted,
            'user': {
                'email': comment.user.email,
                'display_name': comment.user.display_name or comment.user.email
            }
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating comment: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

### **4. DELETE Comment**
```python
@app.route('/leagues/<int:league_id>/announcements/<int:announcement_id>/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_announcement_comment(league_id, announcement_id, comment_id):
    """Delete a comment (soft delete)"""
    try:
        # Verify user has access to this league
        if not user_has_league_access(current_user.id, league_id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get the comment
        comment = db.session.query(AnnouncementComment).filter(
            AnnouncementComment.id == comment_id,
            AnnouncementComment.announcement_id == announcement_id,
            AnnouncementComment.is_deleted == False
        ).first()
        
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Check if user can delete this comment
        can_delete = (
            comment.user_id == current_user.id or
            current_user.role in ['admin', 'commissioner', 'super_admin']
        )
        
        if not can_delete:
            return jsonify({'error': 'You do not have permission to delete this comment'}), 403
        
        # Soft delete the comment
        comment.is_deleted = True
        comment.deleted_at = datetime.utcnow()
        comment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Comment deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting comment: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

## 🔐 **Helper Functions**

### **User League Access Check**
```python
def user_has_league_access(user_id, league_id):
    """Check if user has access to a specific league"""
    # Check if user is a member of the league
    membership = db.session.query(LeagueMembership).filter(
        LeagueMembership.user_id == user_id,
        LeagueMembership.league_id == league_id
    ).first()
    
    if membership:
        return True
    
    # Check if user is an admin/commissioner
    user = db.session.query(User).filter(User.id == user_id).first()
    if user and user.role in ['admin', 'commissioner', 'super_admin']:
        return True
    
    return False
```

### **Comment Validation**
```python
def validate_comment_content(content):
    """Validate comment content"""
    if not content or not content.strip():
        return False, "Comment content cannot be empty"
    
    if len(content.strip()) > 1000:
        return False, "Comment too long (max 1000 characters)"
    
    # Add any additional validation rules here
    # e.g., profanity filter, spam detection, etc.
    
    return True, None
```

## 🧪 **Testing Endpoints**

### **Test Data Setup**
```python
# Create test comments
def create_test_comments():
    """Create sample comments for testing"""
    # Create a test announcement
    announcement = Announcement(
        league_id=1,
        title="Test Announcement",
        content="This is a test announcement",
        created_by="test@example.com"
    )
    db.session.add(announcement)
    db.session.commit()
    
    # Create test comments
    comment1 = AnnouncementComment(
        announcement_id=announcement.id,
        user_id=1,
        content="This is a test comment"
    )
    
    comment2 = AnnouncementComment(
        announcement_id=announcement.id,
        user_id=2,
        content="This is another test comment"
    )
    
    db.session.add_all([comment1, comment2])
    db.session.commit()
    
    # Create a reply
    reply = AnnouncementComment(
        announcement_id=announcement.id,
        user_id=3,
        parent_comment_id=comment1.id,
        content="This is a reply to the first comment"
    )
    
    db.session.add(reply)
    db.session.commit()
```

### **API Testing**
```bash
# Test GET comments
curl -X GET "http://localhost:5000/leagues/1/announcements/1/comments" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST comment
curl -X POST "http://localhost:5000/leagues/1/announcements/1/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "This is a new comment"}'

# Test POST reply
curl -X POST "http://localhost:5000/leagues/1/announcements/1/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "This is a reply", "parent_comment_id": 1}'

# Test PUT update
curl -X PUT "http://localhost:5000/leagues/1/announcements/1/comments/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "Updated comment content"}'

# Test DELETE
curl -X DELETE "http://localhost:5000/leagues/1/announcements/1/comments/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 **Database Migrations**

### **Alembic Migration**
```python
# Create migration file: alembic revision --autogenerate -m "Add announcement comments"

"""Add announcement comments

Revision ID: abc123def456
Revises: previous_revision
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table('announcement_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('announcement_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_comment_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_edited', sa.Boolean(), nullable=True),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['announcement_id'], ['announcements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['announcement_comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_announcement_comments_announcement_id'), 'announcement_comments', ['announcement_id'], unique=False)
    op.create_index(op.f('ix_announcement_comments_parent_id'), 'announcement_comments', ['parent_comment_id'], unique=False)
    op.create_index(op.f('ix_announcement_comments_user_id'), 'announcement_comments', ['user_id'], unique=False)
    op.create_index(op.f('ix_announcement_comments_created_at'), 'announcement_comments', ['created_at'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_announcement_comments_created_at'), table_name='announcement_comments')
    op.drop_index(op.f('ix_announcement_comments_user_id'), table_name='announcement_comments')
    op.drop_index(op.f('ix_announcement_comments_parent_id'), table_name='announcement_comments')
    op.drop_index(op.f('ix_announcement_comments_announcement_id'), table_name='announcement_comments')
    op.drop_table('announcement_comments')
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Run database migrations
- [ ] Test all endpoints with sample data
- [ ] Verify authentication and authorization
- [ ] Check error handling and logging
- [ ] Test pagination and performance
- [ ] Verify soft delete functionality

### **Post-Deployment**
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Monitor error logs
- [ ] Test with real user data
- [ ] Verify frontend integration

## 🔧 **Performance Considerations**

### **Database Optimization**
- Use indexes on frequently queried columns
- Consider pagination for large comment threads
- Implement caching for frequently accessed comments
- Monitor query performance with EXPLAIN

### **API Optimization**
- Implement response caching where appropriate
- Use database connection pooling
- Consider rate limiting for comment creation
- Monitor API response times

## 📝 **Error Handling**

### **Common Error Responses**
```python
# 400 Bad Request
{"error": "Comment content is required"}

# 403 Forbidden
{"error": "You can only edit your own comments"}

# 404 Not Found
{"error": "Comment not found"}

# 500 Internal Server Error
{"error": "Internal server error"}
```

## 🔒 **Security Considerations**

### **Input Validation**
- Sanitize comment content
- Validate comment length limits
- Check for SQL injection attempts
- Implement rate limiting

### **Authorization**
- Verify user league membership
- Check comment ownership for edits
- Implement role-based permissions
- Log all comment actions

## 📈 **Monitoring & Analytics**

### **Metrics to Track**
- Comment creation rate
- Reply engagement
- Most active users
- Popular announcements
- Error rates

### **Logging**
```python
import logging

# Log comment actions
logging.info(f"User {user_id} created comment {comment_id} on announcement {announcement_id}")
logging.warning(f"User {user_id} attempted to edit comment {comment_id} without permission")
logging.error(f"Error creating comment: {str(e)}")
```

---

## ✅ **Implementation Status**

**Frontend**: ✅ **COMPLETE**
- All components implemented
- TypeScript interfaces defined
- CSS styling complete
- Build successful
- Ready for deployment

**Backend**: ⏳ **PENDING**
- Database schema defined
- API endpoints documented
- Models and relationships ready
- Testing procedures outlined

**Next Steps**:
1. Implement the backend endpoints
2. Run database migrations
3. Test the complete system
4. Deploy to production
5. Monitor performance and usage

The frontend is fully ready and will work seamlessly once the backend endpoints are implemented according to this guide.
