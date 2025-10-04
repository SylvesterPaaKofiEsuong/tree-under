import { useState, useEffect } from 'react';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingWrites, setPendingWrites] = useState(0);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      console.log('Back online - syncing pending changes...');
    }

    function handleOffline() {
      setIsOnline(false);
      console.log('Gone offline - caching changes locally...');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firestore offline state
  useEffect(() => {
    // This would normally use Firestore's offline state monitoring
    // For now, we'll just use the browser's online/offline events
  }, []);

  return { 
    isOnline, 
    pendingWrites,
    isOffline: !isOnline 
  };
}