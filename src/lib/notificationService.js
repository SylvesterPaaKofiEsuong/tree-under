import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { format, startOfDay, endOfDay, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * Check if attendance has been taken for today
 * @returns {Object} Attendance status and details
 */
export async function checkTodayAttendanceStatus() {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const currentTime = new Date();
    
    console.log('Checking attendance status for:', todayStr);
    
    // Get all active sellers
    const sellersQuery = query(
      collection(db, 'sellers'),
      where('active', '==', true)
    );
    const sellersSnapshot = await getDocs(sellersQuery);
    const totalSellers = sellersSnapshot.size;
    
    if (totalSellers === 0) {
      return {
        shouldNotify: false,
        reason: 'no_sellers',
        message: 'No active sellers to track attendance for.',
        totalSellers: 0,
        attendanceRecorded: 0
      };
    }
    
    // Check if any attendance has been recorded today
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '==', todayStr)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceRecorded = attendanceSnapshot.size;
    
    // Define business hours (when reminders should be shown)
    const businessStartHour = 8; // 8 AM
    const businessEndHour = 18;  // 6 PM
    const currentHour = currentTime.getHours();
    
    // Don't notify outside business hours
    if (currentHour < businessStartHour || currentHour > businessEndHour) {
      return {
        shouldNotify: false,
        reason: 'outside_hours',
        message: 'Outside business hours.',
        totalSellers,
        attendanceRecorded,
        currentHour
      };
    }
    
    // Check if attendance is completely missing
    if (attendanceRecorded === 0) {
      return {
        shouldNotify: true,
        priority: 'high',
        reason: 'no_attendance',
        message: `No attendance recorded today for ${totalSellers} seller${totalSellers > 1 ? 's' : ''}.`,
        actionText: 'Take Attendance Now',
        totalSellers,
        attendanceRecorded: 0,
        currentHour
      };
    }
    
    // Check if attendance is incomplete
    if (attendanceRecorded < totalSellers) {
      return {
        shouldNotify: true,
        priority: 'medium',
        reason: 'incomplete_attendance',
        message: `Attendance incomplete: ${attendanceRecorded}/${totalSellers} sellers recorded.`,
        actionText: 'Complete Attendance',
        totalSellers,
        attendanceRecorded,
        currentHour
      };
    }
    
    // All attendance recorded
    return {
      shouldNotify: false,
      reason: 'complete',
      message: `Attendance complete: ${attendanceRecorded}/${totalSellers} sellers recorded.`,
      totalSellers,
      attendanceRecorded,
      currentHour
    };
    
  } catch (error) {
    console.error('Error checking attendance status:', error);
    return {
      shouldNotify: false,
      reason: 'error',
      message: 'Unable to check attendance status.',
      error: error.message
    };
  }
}

/**
 * Get attendance reminder settings from localStorage
 * @returns {Object} Notification preferences
 */
export function getNotificationPreferences() {
  try {
    const stored = localStorage.getItem('attendance_notification_prefs');
    const defaults = {
      enabled: true,
      reminderTimes: [10, 14, 16], // 10 AM, 2 PM, 4 PM
      showBanner: true,
      showToast: true,
      autoHide: true,
      playSound: true,
      soundType: 'gentle', // 'gentle', 'urgent', 'chime', 'none'
      hideUntil: null // Hide until specific time
    };
    
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      enabled: true,
      reminderTimes: [10, 14, 16],
      showBanner: true,
      showToast: true,
      autoHide: true,
      playSound: true,
      soundType: 'gentle',
      hideUntil: null
    };
  }
}

/**
 * Save notification preferences to localStorage
 * @param {Object} preferences - Notification preferences to save
 */
export function saveNotificationPreferences(preferences) {
  try {
    localStorage.setItem('attendance_notification_prefs', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

/**
 * Check if it's time to show a reminder based on preferences
 * @param {Object} preferences - User notification preferences
 * @returns {boolean} Whether to show reminder now
 */
export function shouldShowReminderNow(preferences = null) {
  if (!preferences) {
    preferences = getNotificationPreferences();
  }
  
  if (!preferences.enabled) {
    return false;
  }
  
  // Check if user has hidden notifications until later
  if (preferences.hideUntil) {
    const hideUntilTime = new Date(preferences.hideUntil);
    if (new Date() < hideUntilTime) {
      return false;
    }
  }
  
  const currentHour = new Date().getHours();
  return preferences.reminderTimes.includes(currentHour);
}

/**
 * Snooze notifications for a specified duration
 * @param {number} minutes - Minutes to snooze
 */
export function snoozeNotifications(minutes = 60) {
  const preferences = getNotificationPreferences();
  const hideUntil = new Date(Date.now() + (minutes * 60 * 1000));
  
  saveNotificationPreferences({
    ...preferences,
    hideUntil: hideUntil.toISOString()
  });
  
  return hideUntil;
}

/**
 * Dismiss notifications for today
 */
export function dismissNotificationsForToday() {
  const preferences = getNotificationPreferences();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  saveNotificationPreferences({
    ...preferences,
    hideUntil: endOfDay.toISOString()
  });
}

/**
 * Request browser notification permission (optional feature)
 * @returns {Promise<string>} Permission status
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported');
    return 'unsupported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

/**
 * Play notification sound based on user preferences
 * @param {string} soundType - Type of sound to play
 */
export function playNotificationSound(soundType = 'gentle') {
  const preferences = getNotificationPreferences();
  
  if (!preferences.playSound || soundType === 'none') {
    return;
  }
  
  try {
    // Create audio context for sound synthesis
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (frequency, duration, type = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
    
    // Different sound patterns based on type
    switch (soundType) {
      case 'gentle':
        // Soft ascending chime
        playTone(523.25, 0.3); // C5
        setTimeout(() => playTone(659.25, 0.3), 150); // E5
        break;
        
      case 'urgent':
        // More attention-grabbing sequence
        playTone(880, 0.2); // A5
        setTimeout(() => playTone(880, 0.2), 250);
        setTimeout(() => playTone(880, 0.2), 500);
        break;
        
      case 'chime':
        // Bell-like sequence
        playTone(1046.5, 0.4); // C6
        setTimeout(() => playTone(783.99, 0.4), 200); // G5
        setTimeout(() => playTone(659.25, 0.6), 400); // E5
        break;
        
      default:
        // Default gentle sound
        playTone(523.25, 0.3);
        break;
    }
  } catch (error) {
    console.warn('Could not play notification sound:', error);
    // Fallback to system beep if available
    try {
      // Simple beep as fallback
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIdBzuG0/Pf'); audio.play();
    } catch (fallbackError) {
      // Silent fallback
    }
  }
}

/**
 * Show browser notification (if permission granted)
 * @param {Object} options - Notification options
 */
export function showBrowserNotification({ title, message, actionText, playSound = true }) {
  const preferences = getNotificationPreferences();
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title || 'Attendance Reminder', {
      body: message,
      icon: '/favicon.ico',
      badge: '/icon-192.png',
      tag: 'attendance-reminder',
      requireInteraction: true,
      silent: !preferences.playSound, // Use user preference for sound
      actions: actionText ? [
        { action: 'take-attendance', title: actionText }
      ] : []
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
    
    // Play custom sound for in-app notifications if enabled
    if (playSound && preferences.playSound) {
      playNotificationSound(preferences.soundType);
    }
    
    return notification;
  }
  
  return null;
}
