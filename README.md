# Tree Under Checklist - Complete Firebase Documentation

## 🎯 Project Overview

**App Name:** Tree Under Checklist  
**Purpose:** Canteen fee tracking system for school sellers  
**Users:** 2 admins (Leader + Assistant Leader)  
**Sellers:** ~40 sellers  
**Languages:** English & Twi  
**Platform:** Progressive Web App (PWA)

---

## 📋 Core Requirements

### Business Logic
- **Fee Structure:** GHS 10 (standard) or GHS 5 (small sellers)
- **Payment Schedule:** Weekly (mandatory), collected on each seller's last selling day
- **Work Week:** Monday - Saturday (no Sunday sales)
- **Rotation:** Daily rotation for sellers with same product
- **Attendance:** Only pay for days actually worked
- **Proof:** Timestamped photo receipts

### User Features
1. **Daily Attendance Marking** - Simple tap to mark who showed up
2. **Automatic Payment Calculation** - Based on actual days worked
3. **Photo Receipts** - Camera integration with timestamp
4. **Weekly Reports** - Show collected vs outstanding
5. **Offline Mode** - Works without internet, syncs when online
6. **Push Notifications** - Payment reminders
7. **Dual Admin Access** - Both leader and assistant see everything
8. **Bilingual** - Switch between English and Twi

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **PWA:** Vite PWA Plugin
- **State:** React Context API
- **Camera:** Browser MediaDevices API
- **Date Handling:** date-fns

### Backend (Firebase)
- **Database:** Cloud Firestore (NoSQL)
- **Authentication:** Firebase Authentication (Email/Password)
- **Storage:** Firebase Cloud Storage (for photos)
- **Hosting:** Firebase Hosting or Render
- **Offline:** Firestore offline persistence (built-in)
- **Real-time:** Firestore real-time listeners

---

## 📁 Project Structure

```
tree-under-checklist/
├── public/
│   ├── icon-note.txt          # Instructions for PWA icons
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Main dashboard with stats
│   │   ├── Attendance.jsx     # Attendance tracking (placeholder)
│   │   ├── Payments.jsx       # Payment collection (placeholder)  
│   │   ├── Reports.jsx        # Reports (placeholder)
│   │   ├── SellerManagement.jsx # Seller management (placeholder)
│   │   ├── Login.jsx          # PIN-based login
│   │   └── Header.jsx         # App header with navigation
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Authentication state management
│   │   └── LanguageContext.jsx # English/Twi translations
│   ├── hooks/
│   │   ├── useCamera.js       # Camera functionality
│   │   ├── useFirestore.js    # Firestore operations
│   │   └── useOfflineSync.js  # Offline state monitoring
│   ├── lib/
│   │   ├── firebase.js        # Firebase configuration
│   │   └── utils.js           # Helper functions
│   ├── App.jsx               # Main app component
│   ├── main.jsx             # App entry point
│   └── index.css            # Tailwind styles
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── vite.config.ts           # Vite configuration with PWA
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account (free tier)

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "tree-under-checklist"
3. Enable Firestore Database (production mode, europe-west region)
4. Enable Authentication (Email/Password)
5. Enable Cloud Storage (production mode)
6. Get Firebase config from Project Settings > General > Web app

### 3. Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init firestore
firebase init storage

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 5. Create Admin Users
In Firebase Console:
1. **Authentication > Users > Add user:**
   - Email: `leader@tuc.local`, Password: `1234`
   - Email: `assistant@tuc.local`, Password: `5678`

2. **Firestore > Start collection: `admins`:**
```javascript
// Document 1
{
  name: "Mother (Leader)",
  email: "leader@tuc.local", 
  pin: "1234",
  role: "leader",
  createdAt: [timestamp]
}

// Document 2  
{
  name: "Assistant Leader",
  email: "assistant@tuc.local",
  pin: "5678", 
  role: "assistant",
  createdAt: [timestamp]
}
```

### 6. Start Development
```bash
npm run dev
```

Visit `http://localhost:5173` and login with PIN: `1234` or `5678`

---

## 🗄️ Database Structure

### Collections

**sellers**
```javascript
{
  name: "Ama Mensah",
  feeRate: 5,              // 5 or 10 GHS
  schedule: ["Mon", "Wed", "Fri"],
  product: "Porridge", 
  active: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**attendance**
```javascript
{
  sellerId: "seller-doc-id",
  date: "2025-10-03",      // YYYY-MM-DD
  weekStart: "2025-09-29", // Monday of the week
  markedBy: "admin-uid",
  timestamp: serverTimestamp()
}
```

**payments**
```javascript
{
  sellerId: "seller-doc-id",
  weekStart: "2025-09-29",
  amount: 15,
  daysWorked: 3,
  photoUrl: "gs://bucket/receipts/photo.jpg",
  collectedBy: "admin-uid", 
  timestamp: serverTimestamp()
}
```

**admins**
```javascript
{
  name: "Mother (Leader)",
  email: "leader@tuc.local",
  pin: "1234",             // Hash in production
  role: "leader",          // "leader" or "assistant"
  createdAt: timestamp
}
```

---

## 🔧 Development Status

### ✅ Completed
- [x] Project setup with Vite + React + TypeScript
- [x] Firebase configuration and security rules
- [x] Authentication with PIN-based login
- [x] Tailwind CSS styling and custom components
- [x] Language support (English/Twi)
- [x] PWA configuration with Vite PWA plugin
- [x] Offline state detection
- [x] Dashboard with mock data
- [x] Basic app navigation and routing
- [x] Responsive design

### 🚧 In Progress (Placeholders Created)
- [ ] Attendance tracking functionality
- [ ] Payment collection with camera
- [ ] Reports and analytics
- [ ] Seller management CRUD
- [ ] Real Firestore data integration
- [ ] Photo upload to Firebase Storage

### 📋 Next Steps
1. Implement attendance marking with real Firestore data
2. Build payment collection with camera integration
3. Create seller management interface
4. Add reporting and analytics
5. Implement push notifications
6. Add data export functionality
7. Write comprehensive tests
8. Create production deployment

---

## 🌐 Deployment Options

### Option 1: Firebase Hosting
```bash
firebase init hosting
npm run build
firebase deploy --only hosting
```

### Option 2: Render
1. Push to GitHub
2. Connect to Render
3. Build: `npm install && npm run build`
4. Publish: `./dist`

---

## 📱 PWA Features

- **Offline First:** Works without internet
- **Install to Home Screen:** Add to mobile home screen
- **Auto-Update:** New versions install automatically
- **Push Notifications:** (Future feature)

### PWA Icons Required
Create and add to `public/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `favicon.ico`

---

## 🆘 Troubleshooting

### Common Issues

**"Firebase config not found"**
- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`

**"Authentication failed"**
- Verify admin users exist in Firebase Auth
- Check Firestore `admins` collection has correct data
- Ensure PIN matches between Auth password and Firestore

**"Offline persistence failed"**  
- Close all other browser tabs
- Clear browser cache
- Try incognito mode

**Build errors**
- Run `npm install` to ensure all dependencies
- Check Node.js version (18+ required)

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**Built with ❤️ for efficient canteen fee management**

For questions or support, please check the documentation or create an issue in the repository.
