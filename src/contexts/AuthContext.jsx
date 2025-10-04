import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login with PIN
  async function login(pin) {
    try {
      setError(null);
      setLoading(true);

      // Find admin with this PIN
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('pin', '==', pin));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Invalid PIN');
      }
      
      const adminDoc = snapshot.docs[0];
      const adminData = adminDoc.data();
      const adminId = adminDoc.id;
      
      // Sign in with Firebase Auth (PIN as password)
      await signInWithEmailAndPassword(auth, adminData.email, pin);
      
      const user = { 
        ...adminData, 
        id: adminId, 
        uid: auth.currentUser.uid 
      };
      
      setCurrentUser(user);
      localStorage.setItem('tuc_user', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.message === 'Invalid PIN') {
        errorMessage = 'Invalid PIN. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('tuc_user');
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  }

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try to get user data from localStorage first
        const savedUser = localStorage.getItem('tuc_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setCurrentUser(userData);
          } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('tuc_user');
            setCurrentUser(null);
          }
        } else {
          // Fallback: fetch from Firestore
          try {
            const adminsRef = collection(db, 'admins');
            const q = query(adminsRef, where('email', '==', firebaseUser.email));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const adminDoc = snapshot.docs[0];
              const adminData = adminDoc.data();
              const user = {
                ...adminData,
                id: adminDoc.id,
                uid: firebaseUser.uid
              };
              setCurrentUser(user);
              localStorage.setItem('tuc_user', JSON.stringify(user));
            } else {
              setCurrentUser(null);
            }
          } catch (error) {
            console.error('Error fetching admin data:', error);
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('tuc_user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!currentUser,
    isLeader: currentUser?.role === 'leader',
    isAssistant: currentUser?.role === 'assistant'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;