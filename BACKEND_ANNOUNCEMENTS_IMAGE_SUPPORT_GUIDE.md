# 🖼️ Backend Implementation Guide: Announcements Image Support

## 🚨 **CRITICAL BACKEND UPDATES REQUIRED**

The frontend now supports cover photos and inline images for announcements, but the backend needs to be updated to handle these new fields.

---

## 🔍 **Required Backend Changes**

### **1. Database Schema Updates**

#### **Option A: Add New Columns (Recommended)**
```sql
-- Add cover photo column to announcements table
ALTER TABLE announcements 
ADD COLUMN cover_photo TEXT;

-- Add index for better performance
CREATE INDEX idx_announcements_cover_photo ON announcements(cover_photo);
```

#### **Option B: Modify Existing Content Column**
If you prefer to store images within the content field (not recommended for large images):
```sql
-- Ensure content column can handle larger text (if not already)
ALTER TABLE announcements 
ALTER COLUMN content TYPE TEXT;
```

### **2. API Endpoint Updates**

#### **Create Announcement Endpoint**
**Current Endpoint**: `POST /leagues/{league_id}/announcements`

**Updated Request Body**:
```json
{
  "title": "League Update",
  "content": "This is the announcement content with inline images:\n![Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)\nMore content here.",
  "pinned": false,
  "cover_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Updated Response**:
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "announcement": {
    "id": 123,
    "title": "League Update",
    "content": "This is the announcement content with inline images:\n![Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)\nMore content here.",
    "pinned": false,
    "cover_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "created_by": "commissioner@example.com",
    "created_at": "2025-09-02T06:39:24.030350Z",
    "is_pinned": false
  }
}
```

#### **Get Announcements Endpoint**
**Current Endpoint**: `GET /leagues/{league_id}/announcements`

**Updated Response**:
```json
{
  "success": true,
  "announcements": [
    {
      "id": 123,
      "title": "League Update",
      "content": "This is the announcement content with inline images:\n![Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)\nMore content here.",
      "pinned": false,
      "cover_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
      "created_by": "commissioner@example.com",
      "created_at": "2025-09-02T06:39:24.030350Z",
      "is_pinned": false
    }
  ],
  "total": 1
}
```

---

## 🛠️ **Implementation Steps**

### **Step 1: Update Database Schema**

#### **For PostgreSQL:**
```sql
-- Connect to your database
\c your_database_name

-- Add cover photo column
ALTER TABLE announcements 
ADD COLUMN cover_photo TEXT;

-- Add index for performance
CREATE INDEX idx_announcements_cover_photo ON announcements(cover_photo);

-- Verify the change
\d announcements
```

#### **For MySQL:**
```sql
-- Connect to your database
USE your_database_name;

-- Add cover photo column
ALTER TABLE announcements 
ADD COLUMN cover_photo TEXT;

-- Add index for performance
CREATE INDEX idx_announcements_cover_photo ON announcements(cover_photo);

-- Verify the change
DESCRIBE announcements;
```

### **Step 2: Update Backend Models**

#### **Python/Flask Example:**
```python
# models/announcement.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Announcement(Base):
    __tablename__ = 'announcements'
    
    id = Column(Integer, primary_key=True)
    league_id = Column(Integer, ForeignKey('leagues.id'), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    cover_photo = Column(Text, nullable=True)  # NEW FIELD
    pinned = Column(Boolean, default=False)
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    league = relationship("League", back_populates="announcements")
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'cover_photo': self.cover_photo,  # NEW FIELD
            'pinned': self.pinned,
            'is_pinned': self.pinned,  # For frontend compatibility
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None  # For frontend compatibility
        }
```

#### **Node.js/Express Example:**
```javascript
// models/Announcement.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    league_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leagues',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cover_photo: {
      type: DataTypes.TEXT,
      allowNull: true  // NEW FIELD
    },
    pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'announcements',
    timestamps: false
  });

  return Announcement;
};
```

### **Step 3: Update API Routes**

#### **Python/Flask Example:**
```python
# routes/announcements.py
from flask import Blueprint, request, jsonify
from models.announcement import Announcement
from models.league import League
from database import db
from datetime import datetime

announcements_bp = Blueprint('announcements', __name__)

@announcements_bp.route('/leagues/<int:league_id>/announcements', methods=['POST'])
def create_announcement(league_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Create new announcement
        announcement = Announcement(
            league_id=league_id,
            title=data['title'],
            content=data['content'],
            cover_photo=data.get('cover_photo'),  # NEW FIELD
            pinned=data.get('pinned', False),
            created_by=data.get('created_by', 'Unknown')
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/leagues/<int:league_id>/announcements', methods=['GET'])
def get_announcements(league_id):
    try:
        announcements = Announcement.query.filter_by(league_id=league_id).order_by(
            Announcement.pinned.desc(), 
            Announcement.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'announcements': [announcement.to_dict() for announcement in announcements],
            'total': len(announcements)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

#### **Node.js/Express Example:**
```javascript
// routes/announcements.js
const express = require('express');
const { Announcement } = require('../models');
const router = express.Router();

// Create announcement
router.post('/leagues/:leagueId/announcements', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { title, content, cover_photo, pinned, created_by } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Create new announcement
    const announcement = await Announcement.create({
      league_id: leagueId,
      title,
      content,
      cover_photo,  // NEW FIELD
      pinned: pinned || false,
      created_by: created_by || 'Unknown'
    });
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: announcement.toJSON()
    });
    
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get announcements
router.get('/leagues/:leagueId/announcements', async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    const announcements = await Announcement.findAll({
      where: { league_id: leagueId },
      order: [['pinned', 'DESC'], ['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      announcements: announcements.map(announcement => announcement.toJSON()),
      total: announcements.length
    });
    
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### **Step 4: Update Data Validation**

#### **Python/Flask Example:**
```python
# validators/announcement_validator.py
import re
from typing import Dict, Any, Optional

class AnnouncementValidator:
    @staticmethod
    def validate_announcement_data(data: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        
        # Validate title
        if not data.get('title'):
            errors.append('Title is required')
        elif len(data['title']) > 255:
            errors.append('Title must be less than 255 characters')
        
        # Validate content
        if not data.get('content'):
            errors.append('Content is required')
        elif len(data['content']) > 10000:  # Increased for images
            errors.append('Content must be less than 10,000 characters')
        
        # Validate cover photo (if provided)
        cover_photo = data.get('cover_photo')
        if cover_photo:
            if not cover_photo.startswith('data:image/'):
                errors.append('Cover photo must be a valid image data URL')
            elif len(cover_photo) > 10000000:  # ~10MB base64 limit
                errors.append('Cover photo is too large (max 10MB)')
        
        # Validate pinned
        if 'pinned' in data and not isinstance(data['pinned'], bool):
            errors.append('Pinned must be a boolean value')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
```

#### **Node.js/Express Example:**
```javascript
// validators/announcementValidator.js
const validateAnnouncementData = (data) => {
  const errors = [];
  
  // Validate title
  if (!data.title) {
    errors.push('Title is required');
  } else if (data.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }
  
  // Validate content
  if (!data.content) {
    errors.push('Content is required');
  } else if (data.content.length > 10000) {  // Increased for images
    errors.push('Content must be less than 10,000 characters');
  }
  
  // Validate cover photo (if provided)
  if (data.cover_photo) {
    if (!data.cover_photo.startsWith('data:image/')) {
      errors.push('Cover photo must be a valid image data URL');
    } else if (data.cover_photo.length > 10000000) {  // ~10MB base64 limit
      errors.push('Cover photo is too large (max 10MB)');
    }
  }
  
  // Validate pinned
  if (data.pinned !== undefined && typeof data.pinned !== 'boolean') {
    errors.push('Pinned must be a boolean value');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = { validateAnnouncementData };
```

---

## 🧪 **Testing the Implementation**

### **Test 1: Create Announcement with Cover Photo**
```bash
curl -X POST http://localhost:5000/leagues/12335716/announcements \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "title": "Test Announcement with Cover Photo",
    "content": "This is a test announcement with a cover photo.",
    "cover_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "pinned": false
  }'
```

### **Test 2: Create Announcement with Inline Images**
```bash
curl -X POST http://localhost:5000/leagues/12335716/announcements \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "title": "Test Announcement with Inline Images",
    "content": "This announcement has inline images:\n![Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)\nMore content here.",
    "pinned": false
  }'
```

### **Test 3: Get Announcements**
```bash
curl -X GET http://localhost:5000/leagues/12335716/announcements \
  -H "Cookie: your_session_cookie"
```

---

## ⚠️ **Important Considerations**

### **1. Database Performance**
- **Large Data**: Base64 images can be large (5-10MB+)
- **Indexing**: Don't index the `cover_photo` column (it's too large)
- **Queries**: Consider separate table for images if performance becomes an issue

### **2. Storage Optimization**
- **Current**: Images stored as base64 in database
- **Future**: Consider moving to cloud storage (AWS S3, Google Cloud Storage)
- **Migration**: Plan for future migration to external storage

### **3. Security**
- **Validation**: Always validate image data URLs
- **Size Limits**: Enforce reasonable size limits
- **Type Validation**: Ensure only image types are accepted

### **4. Backward Compatibility**
- **Existing Data**: Existing announcements without cover photos will work fine
- **Frontend**: Frontend handles both `cover_photo` and `coverPhoto` field names
- **Migration**: No data migration needed for existing announcements

---

## 📋 **Implementation Checklist**

- [ ] **Database Schema**: Add `cover_photo` column to announcements table
- [ ] **Model Updates**: Update announcement model to include cover_photo field
- [ ] **API Routes**: Update create and get announcement endpoints
- [ ] **Validation**: Add validation for cover photo data
- [ ] **Testing**: Test with cover photos and inline images
- [ ] **Error Handling**: Ensure proper error handling for large images
- [ ] **Performance**: Monitor database performance with large images
- [ ] **Documentation**: Update API documentation

---

## 🚀 **Quick Start**

**Immediate Steps:**
1. Run the database migration to add `cover_photo` column
2. Update your announcement model to include the new field
3. Update your API routes to handle the new field
4. Test with the frontend

**Expected Result:**
- Frontend can create announcements with cover photos
- Frontend can paste images into announcement content
- Backend stores and returns image data correctly
- Announcements display with images on the frontend

The backend changes are minimal but essential for the new image functionality to work! 🏈🖼️✨
