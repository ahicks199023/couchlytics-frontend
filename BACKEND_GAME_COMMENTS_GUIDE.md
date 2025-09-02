# 🎯 Backend Implementation Guide: Game Comments System

## 📋 Overview
Game Comments System allows users to discuss specific games from schedule/team pages. Reuses existing comment infrastructure with game-specific endpoints.

## 🗄️ Database Schema

```sql
CREATE TABLE game_comments (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    game_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    parent_comment_id INTEGER NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES game_comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_comments_league_game ON game_comments(league_id, game_id);
CREATE INDEX idx_game_comments_user ON game_comments(user_id);
CREATE INDEX idx_game_comments_parent ON game_comments(parent_comment_id);
```

## 🐍 Python Model

```python
class GameComment(Base):
    __tablename__ = 'game_comments'
    
    id = Column(Integer, primary_key=True)
    league_id = Column(Integer, ForeignKey('leagues.id'), nullable=False)
    game_id = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey('game_comments.id'), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="game_comments")
    league = relationship("League", back_populates="game_comments")
    parent_comment = relationship("GameComment", remote_side=[id], back_populates="replies")
    replies = relationship("GameComment", back_populates="parent_comment")
```

## 🔌 Required API Endpoints

### 1. GET /leagues/{league_id}/games/{game_id}/comments
- Get comments for a specific game with pagination
- Query params: `limit`, `offset`
- Returns: comments array, total count, pagination info

### 2. POST /leagues/{league_id}/games/{game_id}/comments
- Create new comment
- Body: `{"content": "comment text", "parent_comment_id": null}`
- Returns: created comment object

### 3. PUT /leagues/{league_id}/games/{game_id}/comments/{comment_id}
- Update existing comment
- Body: `{"content": "updated text"}`
- Returns: updated comment object

### 4. DELETE /leagues/{league_id}/games/{game_id}/comments/{comment_id}
- Soft delete comment
- Returns: success message

### 5. GET /leagues/{league_id}/games/{game_id}
- Get basic game info for comments page
- Returns: game data with teams and scores

## 🔒 Security Requirements

1. **Authentication Required** on all endpoints
2. **League Access Control** - users can only access their league's comments
3. **Comment Ownership** - users can only edit/delete their own comments
4. **Admin Override** - admins/commissioners can delete any comment
5. **Input Validation** - sanitize comment content

## 📝 Response Format

```json
{
  "comments": [
    {
      "id": 1,
      "league_id": 123,
      "game_id": "game_123",
      "user_id": 456,
      "parent_comment_id": null,
      "content": "Great game!",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_edited": false,
      "edited_at": null,
      "is_deleted": false,
      "deleted_at": null,
      "user": {
        "email": "user@example.com",
        "display_name": "John Doe"
      },
      "reply_count": 2,
      "replies": [...]
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

## 🚀 Implementation Steps

1. **Create Database Table** - Run the SQL schema
2. **Add GameComment Model** - Add to your models file
3. **Create API Endpoints** - Implement all 5 endpoints
4. **Add Relationships** - Update User and League models
5. **Test Endpoints** - Verify authentication and permissions
6. **Deploy** - Run migrations and deploy

## ✅ Testing Checklist

- [ ] Database table created
- [ ] All 5 API endpoints work
- [ ] Authentication required
- [ ] League access control works
- [ ] Comment CRUD operations work
- [ ] Reply functionality works
- [ ] Pagination works
- [ ] Error handling works
- [ ] Frontend integration successful

## 🎯 Key Points

- **Reuses existing comment infrastructure** - Same structure as announcement comments
- **Game-specific isolation** - Comments tied to specific games and leagues
- **Automatic generation** - No manual thread creation needed
- **Multiple entry points** - Accessible from schedule and team pages
- **Full CRUD operations** - Create, read, update, delete comments
- **Reply support** - Nested comment threading
- **Moderation tools** - Edit/delete permissions for users and admins

**This provides a complete game comments system that integrates seamlessly with your existing infrastructure!**




