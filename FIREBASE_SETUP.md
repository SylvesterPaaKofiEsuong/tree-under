# Firebase Setup Instructions

Your app is configured but Firebase needs to be set up. Follow these steps:

## Step 1: Verify Environment Variables

Your `.env` file has the Firebase config. Let's verify it's working:

1. Open browser to: http://localhost:5174/
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Try to login with PIN `1234`
5. Check console for error messages

## Step 2: Firebase Console Setup

Go to [Firebase Console](https://console.firebase.google.com) and:

### A. Enable Authentication
1. Go to **Authentication > Sign-in method**
2. Enable **Email/Password** provider
3. Click Save

### B. Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select a location (recommend: `us-central1`)

### C. Enable Storage
1. Go to **Storage**
2. Click **Get started**
3. Use default security rules for now

## Step 3: Create Admin Users

### In Authentication:
1. Go to **Authentication > Users**
2. Click **Add user**
3. Create these users:
   - Email: `leader@tuc.local`, Password: `1234`
   - Email: `assistant@tuc.local`, Password: `5678`

### In Firestore:
1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `admins`
4. Add two documents:

**Document 1:**
```json
{
  "name": "Mother (Leader)",
  "email": "leader@tuc.local",
  "pin": "1234",
  "role": "leader",
  "createdAt": [Use timestamp]
}
```

**Document 2:**
```json
{
  "name": "Assistant Leader", 
  "email": "assistant@tuc.local",
  "pin": "5678",
  "role": "assistant",
  "createdAt": [Use timestamp]
}
```

## Step 4: Test Login

1. Go to your app: http://localhost:5174/
2. Try login with PIN: `1234` (Leader) or `5678` (Assistant)
3. Check browser console for any errors

## Step 5: Deploy Security Rules

Once login works, secure your database:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init firestore
firebase init storage

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Common Issues & Solutions

### "Firebase config not found"
- Check `.env` file exists and has correct values
- Restart dev server: `npm run dev`

### "Invalid PIN"
- Verify admin users exist in both Auth and Firestore
- Check PIN matches between Auth password and Firestore document

### "Network error" 
- Check internet connection
- Verify Firebase project ID is correct

### "Permission denied"
- Firestore rules are too restrictive
- Temporarily use test mode rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Next Steps After Login Works

1. Implement seller management
2. Add attendance tracking  
3. Set up payment collection with camera
4. Create reports and analytics
5. Deploy to production

---

If you're still having issues, check the browser console and share the error messages!