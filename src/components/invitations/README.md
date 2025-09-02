# 🎯 League Invitation System Components

## 📋 **Overview**

This directory contains all the frontend components for the League Invitation System, allowing commissioners to create invitation links and manage league members seamlessly.

---

## 🚀 **Components**

### **1. InvitationManagement.tsx**
Main component that orchestrates the entire invitation system.

**Usage:**
```jsx
import InvitationManagement from '@/components/invitations/InvitationManagement'

<InvitationManagement leagueId="123" />
```

### **2. CreateInvitationModal.tsx**
Modal for creating new invitation links with customizable settings.

**Features:**
- Max uses configuration
- Expiration date setting
- Role assignment (member/co-commissioner)
- Custom welcome message
- Email-specific invitations

### **3. InvitationsList.tsx**
Displays all active invitations with management options.

**Features:**
- Copy invitation links
- Edit invitation settings
- Activate/deactivate invitations
- Delete invitations
- Usage tracking

### **4. MembersList.tsx**
Manages league members and their roles.

**Features:**
- View all league members
- Update member roles
- Remove members from league
- Display join dates and user info

---

## 🎨 **Integration Examples**

### **Add to League Settings Page**

```jsx
// In your existing league settings page
import InvitationManagement from '@/components/invitations/InvitationManagement'

const LeagueSettings = ({ leagueId, isCommissioner }) => {
  return (
    <div className="league-settings">
      {/* Your existing settings */}
      
      {isCommissioner && (
        <InvitationManagement leagueId={leagueId} />
      )}
    </div>
  )
}
```

### **Add to Navigation**

```jsx
// In your main navigation
import NotificationCenter from '@/components/notifications/NotificationCenter'

const Navigation = () => {
  return (
    <nav className="main-nav">
      {/* Your existing nav items */}
      
      <NotificationCenter />
    </nav>
  )
}
```

---

## 🔧 **API Endpoints Required**

The components expect these backend endpoints:

### **Invitation Management**
- `GET /api/leagues/{league_id}/invitations` - Get all invitations
- `POST /api/leagues/{league_id}/invitations` - Create new invitation
- `PUT /api/leagues/{league_id}/invitations/{invitation_id}` - Update invitation
- `DELETE /api/leagues/{league_id}/invitations/{invitation_id}` - Delete invitation

### **Member Management**
- `GET /api/leagues/{league_id}/members` - Get all members
- `PUT /api/leagues/{league_id}/members/{user_id}/role` - Update member role
- `DELETE /api/leagues/{league_id}/members/{user_id}` - Remove member

### **User Actions**
- `GET /api/invitations/{invitation_code}/validate` - Validate invitation
- `POST /api/invitations/{invitation_code}/join` - Join league (existing users)
- `POST /api/register-with-invitation` - Register and join (new users)

### **Notifications**
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{notification_id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

---

## 🎨 **Styling**

Import the CSS file in your main application:

```jsx
// In your main layout or _app.js
import '@/styles/invitation-system.css'
```

The CSS includes:
- Modal styles
- Form components
- Status badges
- Notification dropdown
- Responsive design
- Animation classes

---

## 🔐 **Authentication**

All components use the `getAuthToken()` helper function. Make sure to implement this in your app:

```jsx
const getAuthToken = () => {
  // Return your auth token from localStorage, cookies, or context
  return localStorage.getItem('authToken') || ''
}
```

---

## 📱 **Responsive Design**

All components are fully responsive and work on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

---

## 🧪 **Testing**

Test the components with:

1. **Create invitation** - Test all form fields and validation
2. **Copy invitation link** - Verify clipboard functionality
3. **Join league** - Test both existing and new user flows
4. **Member management** - Test role updates and member removal
5. **Notifications** - Test notification display and marking as read

---

## 🚀 **Deployment**

1. **Import components** into your existing pages
2. **Add CSS styles** to your main stylesheet
3. **Implement backend endpoints** (see backend guide)
4. **Test all functionality** with real data
5. **Deploy to production**

---

## 📞 **Support**

If you encounter issues:

1. **Check console errors** for API call failures
2. **Verify authentication** is working correctly
3. **Test API endpoints** independently
4. **Check network requests** in browser dev tools
5. **Review backend logs** for server-side errors

The invitation system is now ready to provide a seamless experience for your league commissioners and users! 🎯
