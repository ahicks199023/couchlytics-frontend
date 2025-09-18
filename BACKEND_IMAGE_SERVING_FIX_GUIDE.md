# Backend Image Serving Fix Guide

## Problem Description
The frontend is correctly requesting images from the API endpoint, but the backend is returning 404 errors because the image files don't exist at the expected location.

**Frontend Request**: `GET /uploads/announcements/ba29050f-74be-4f4e-bd97-008e475b0e18.png`
**Backend Response**: `404 Not Found`

## Root Cause
The image files were uploaded to the old static file path (`/static/uploads/announcements/`) but the backend API endpoint is looking for them at `/uploads/announcements/`.

## Backend Fix Options

### Option 1: Move Image Files (Recommended)
Move all existing announcement images from the old static path to the new API path.

**File System Operations:**
```bash
# Move images from old location to new location
mv /path/to/static/uploads/announcements/* /path/to/uploads/announcements/

# Or if using Docker/containerized setup
docker exec -it <container_name> mv /app/static/uploads/announcements/* /app/uploads/announcements/
```

**Python Script to Move Files:**
```python
import os
import shutil

def move_announcement_images():
    old_path = "/path/to/static/uploads/announcements"
    new_path = "/path/to/uploads/announcements"
    
    # Create new directory if it doesn't exist
    os.makedirs(new_path, exist_ok=True)
    
    # Move all files
    for filename in os.listdir(old_path):
        old_file = os.path.join(old_path, filename)
        new_file = os.path.join(new_path, filename)
        
        if os.path.isfile(old_file):
            shutil.move(old_file, new_file)
            print(f"Moved {filename}")

if __name__ == "__main__":
    move_announcement_images()
```

### Option 2: Update Backend Route
Modify the backend to serve images from the old static path.

**Flask Route Update:**
```python
# In your Flask app routes
@app.route('/uploads/announcements/<filename>')
def serve_announcement_image(filename):
    """Serve announcement images from static directory"""
    return send_from_directory('/path/to/static/uploads/announcements', filename)
```

### Option 3: Create Symlink (Quick Fix)
Create a symbolic link from the new path to the old path.

```bash
# Create symlink
ln -s /path/to/static/uploads/announcements /path/to/uploads/announcements
```

### Option 4: Update Database Records
Update the database to point to the correct image paths.

**SQL Update:**
```sql
-- Update announcement cover_photo paths
UPDATE announcements 
SET cover_photo = REPLACE(cover_photo, '/static/uploads/announcements/', '/uploads/announcements/')
WHERE cover_photo LIKE '/static/uploads/announcements/%';
```

## Verification Steps

### 1. Check Current Image Locations
```bash
# Check if images exist in old location
ls -la /path/to/static/uploads/announcements/

# Check if images exist in new location
ls -la /path/to/uploads/announcements/
```

### 2. Test Image Access
```bash
# Test direct access to image
curl -I https://api.couchlytics.com/uploads/announcements/ba29050f-74be-4f4e-bd97-008e475b0e18.png

# Should return 200 OK instead of 404
```

### 3. Check Backend Logs
Look for successful image serving:
```
Request: GET /uploads/announcements/ba29050f-74be-4f4e-bd97-008e475b0e18.png
Response status: 200
```

## Recommended Implementation

**Step 1: Move Files (Option 1)**
```bash
# Create new directory
mkdir -p /path/to/uploads/announcements

# Move all existing images
mv /path/to/static/uploads/announcements/* /path/to/uploads/announcements/

# Verify move was successful
ls -la /path/to/uploads/announcements/
```

**Step 2: Update File Permissions**
```bash
# Ensure proper permissions
chmod 755 /path/to/uploads/announcements/
chmod 644 /path/to/uploads/announcements/*
```

**Step 3: Test Image Access**
```bash
# Test a specific image
curl -I https://api.couchlytics.com/uploads/announcements/ba29050f-74be-4f4e-bd97-008e475b0e18.png
```

## Expected Results

After implementing the fix:
- ✅ **Image requests return 200 OK** instead of 404
- ✅ **Images display correctly** in the frontend
- ✅ **No more console errors** about missing images
- ✅ **Preview mode works** in announcement editing

## Priority

**HIGH PRIORITY** - This blocks image display functionality completely. The frontend is ready and waiting for the backend to serve images from the correct location.

## Alternative Quick Fix

If moving files is not possible immediately, you can temporarily update the frontend to use the old static path:

```typescript
// Temporary fix in imageUtils.ts
if (imagePath.startsWith('/uploads/announcements/')) {
  // Temporarily redirect to static path
  const filename = imagePath.replace('/uploads/announcements/', '')
  return `https://www.couchlytics.com/static/uploads/announcements/${filename}`
}
```

But this is not recommended as a permanent solution.
