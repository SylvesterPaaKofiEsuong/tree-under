import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday = 1
}

/**
 * Get the end of the week (Saturday) for a given date
 * Note: School operates Monday-Saturday, no Sunday sales
 */
export function getWeekEnd(date = new Date()) {
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  // Adjust to Saturday since no Sunday sales
  const saturday = new Date(weekEnd);
  saturday.setDate(saturday.getDate() - 1);
  return saturday;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a date is within the current week
 */
export function isCurrentWeek(date) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  
  return isWithinInterval(date, { start: weekStart, end: weekEnd });
}

/**
 * Calculate payment amount based on days worked and fee rate
 */
export function calculatePayment(daysWorked, feeRate) {
  return daysWorked * feeRate;
}

/**
 * Get days of the week that school operates (Mon-Sat)
 */
export function getSchoolDays() {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Convert day abbreviation to full day name
 */
export function getDayName(dayAbbr) {
  const dayMap = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday'
  };
  return dayMap[dayAbbr] || dayAbbr;
}

/**
 * Generate a simple ID for documents
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format currency (GHS)
 */
export function formatCurrency(amount) {
  return `GHS ${amount.toFixed(2)}`;
}

/**
 * Check if user is on a mobile device
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Compress image before upload
 */
export function compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxWidth / height);
      
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString) {
  return parseISO(dateString);
}

/**
 * Get current week's date range as string
 */
export function getCurrentWeekRange() {
  const start = getWeekStart();
  const end = getWeekEnd();
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}