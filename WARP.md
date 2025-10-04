# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Tree Under Checklist** is a Progressive Web App (PWA) designed for canteen fee tracking in schools. It manages ~40 sellers with 2 admin users (Leader + Assistant), supporting bilingual operation (English & Twi) with offline-first functionality.

**Current Status**: Foundation complete with Firebase integration, authentication, and UI components. Core business logic (attendance tracking, payment collection, reporting) is implemented as placeholder components ready for full development.

## Company Information

- **Purpose**: Canteen fee tracking system for school sellers
- **Users**: 2 admins (Leader + Assistant Leader) 
- **Sellers**: ~40 sellers with rotation system
- **Fee Structure**: GHS 10 (standard) or GHS 5 (small sellers)
- **Schedule**: Monday-Saturday, weekly fee collection
- **Languages**: English & Twi (bilingual support)

## Development Commands

This is a Vite + React + TypeScript PWA with Firebase backend:

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally  
npm run preview

# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

## Firebase Setup Commands

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore and Storage
firebase init firestore
firebase init storage

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# Deploy to Firebase Hosting (optional)
firebase init hosting
firebase deploy --only hosting
```

## Application Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom green theme
- **State Management**: React Context API (AuthContext, LanguageContext)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **PWA**: Vite PWA plugin with offline caching
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Component Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard with stats and quick actions
│   ├── Attendance.jsx         # Attendance tracking (placeholder)
│   ├── Payments.jsx           # Payment collection with camera (placeholder)
│   ├── Reports.jsx            # Reports and analytics (placeholder)
│   ├── SellerManagement.jsx   # CRUD for sellers (placeholder)
│   ├── Login.jsx              # PIN-based authentication
│   └── Header.jsx             # Navigation header
├── contexts/
│   ├── AuthContext.jsx        # Firebase authentication with PIN login
│   └── LanguageContext.jsx    # English/Twi translations
├── hooks/
│   ├── useCamera.js           # Camera functionality for receipts
│   ├── useFirestore.js        # Firestore operations
│   └── useOfflineSync.js      # Offline state monitoring
├── lib/
│   ├── firebase.js            # Firebase configuration with offline persistence
│   └── utils.js               # Helper functions (currency, dates)
├── App.tsx                    # Main application (currently default Vite template)
└── main.tsx                   # React entry point
```

### Firebase Architecture

**Database Structure (Firestore)**:
```javascript
// Collections:
admins: {
  name: "Mother (Leader)",
  email: "leader@tuc.local", 
  pin: "1234",
  role: "leader" | "assistant"
}

sellers: {
  name: "Ama Mensah",
  feeRate: 5 | 10,  // GHS
  schedule: ["Mon", "Wed", "Fri"],
  product: "Porridge",
  active: true
}

attendance: {
  sellerId: "doc-id",
  date: "2025-10-03",
  weekStart: "2025-09-29",
  markedBy: "admin-uid"
}

payments: {
  sellerId: "doc-id", 
  weekStart: "2025-09-29",
  amount: 15,
  daysWorked: 3,
  photoUrl: "gs://bucket/receipts/photo.jpg",
  collectedBy: "admin-uid"
}
```

## Key Technical Features

### 1. **PWA Configuration**
- Offline-first with service worker caching
- Installable on mobile devices
- Firebase API caching strategies:
  - Firestore: NetworkFirst (24 hours)
  - Storage: CacheFirst (7 days)

### 2. **Authentication System**
- PIN-based login (PIN = Firebase Auth password)
- Dual admin roles (Leader/Assistant)
- Persistent login state with localStorage backup
- Offline authentication support

### 3. **Bilingual Support**
- English/Twi language switching
- Centralized translation context
- RTL support ready

### 4. **Offline Functionality**
- Firestore offline persistence enabled
- Network state detection
- Data synchronization when online

## Current Implementation Status

### ✅ Completed Features
- React + TypeScript + Vite project setup
- Firebase configuration with offline persistence
- PIN-based authentication system
- Tailwind CSS styling with custom theme
- PWA configuration with proper caching
- Dashboard with mock data and navigation
- Language context for bilingual support
- Component structure and routing foundation
- ESLint configuration with React best practices

### 🚧 Ready for Implementation (Components Created)
- Attendance tracking with daily check-ins
- Payment collection with camera integration
- Seller management CRUD operations  
- Reports and analytics dashboard
- Real Firestore data integration
- Photo upload to Firebase Storage

## Development Guidelines

- **Authentication**: Use PIN-based system, not email/password UI
- **Offline-First**: Always consider offline scenarios and data sync
- **Performance**: PWA requires fast loading and smooth interactions
- **Mobile-First**: Primary usage on mobile devices
- **Bilingual**: All user-facing text must support English/Twi
- **Security**: Follow Firebase security rules (firestore.rules, storage.rules)
- **State Management**: Use React Context for global state, avoid prop drilling

## Asset Requirements

### PWA Icons (Missing - Create These)
- `public/icon-192.png` (192x192px)  
- `public/icon-512.png` (512x512px)
- `public/favicon.ico`

### Camera Integration
- MediaDevices API for photo capture
- Timestamp overlay on receipt photos
- Firebase Storage upload with compression

## Environment Setup

**Required Environment Variables** (`.env`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Setup Steps**:
1. Copy `.env.example` to `.env`
2. Create Firebase project 
3. Enable Firestore, Auth (Email/Password), Storage
4. Create admin users in Firebase Auth
5. Add admin documents to Firestore `admins` collection
6. Deploy security rules

## Important Technical Notes

### Authentication Flow
- PIN input → Query Firestore `admins` collection → Sign in with Firebase Auth
- User data cached in localStorage for offline access
- Auth state persists across app restarts

### PWA Caching Strategy
- App shell cached indefinitely
- Firebase APIs cached with different strategies
- Offline indicators show connection status

### Business Logic Implementation
- Weekly fee calculation based on actual attendance days
- Rotation system for sellers with same products
- Photo proof required for all payments
- Automatic outstanding fee tracking

## Troubleshooting

**Common Issues:**

1. **"Firebase config not found"**
   - Check `.env` file exists with correct values
   - Restart dev server after changing environment variables

2. **"Authentication failed"** 
   - Verify admin users exist in Firebase Auth
   - Check Firestore `admins` collection has matching PIN/email
   - Ensure Firebase Auth Email/Password provider is enabled

3. **"Offline persistence failed"**
   - Close other browser tabs to avoid multiple connections
   - Clear browser cache and try incognito mode

4. **PWA not installing**
   - Create missing icon files (icon-192.png, icon-512.png)
   - Build and serve from production build (`npm run build && npm run preview`)

## Next Development Priority

1. **Replace App.tsx** - Currently shows default Vite template, needs proper app structure
2. **Implement Attendance.jsx** - Core daily attendance marking functionality
3. **Implement Payments.jsx** - Camera integration and payment collection
4. **Connect real Firestore data** - Replace mock data with Firebase queries
5. **Add PWA icons** - Create required icon assets for installation

## Contact & Support

**Purpose**: Canteen fee tracking for school sellers
**Admin Access**: PIN-based (Leader: 1234, Assistant: 5678)
**Business Hours**: Monday-Saturday (no Sunday operations)
**Fee Collection**: Weekly on each seller's last working day

For technical questions, refer to the comprehensive README.md documentation or Firebase Console for backend management.