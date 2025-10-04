import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Hook for fetching a collection with real-time updates
export function useCollection(collectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = collection(db, collectionName);
    
    if (queryConstraints.length > 0) {
      q = query(q, ...queryConstraints);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

// Hook for fetching a single document
export function useDocument(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}/${docId}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

// Hook for Firestore operations
export function useFirestore(collectionName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addDocument = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      console.error(`Error adding document to ${collectionName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (docId, data) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      return { id: docId, ...data };
    } catch (err) {
      console.error(`Error updating document in ${collectionName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return docId;
    } catch (err) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument
  };
}

// Specific hooks for app collections
export function useSellers() {
  return useCollection('sellers', [where('active', '==', true), orderBy('name')]);
}

export function useAttendance(date = null) {
  const constraints = date ? [where('date', '==', date)] : [];
  return useCollection('attendance', constraints);
}

export function usePayments(weekStart = null) {
  const constraints = weekStart ? [where('weekStart', '==', weekStart)] : [];
  return useCollection('payments', [...constraints, orderBy('timestamp', 'desc')]);
}

export function useAdmins() {
  return useCollection('admins', [orderBy('name')]);
}