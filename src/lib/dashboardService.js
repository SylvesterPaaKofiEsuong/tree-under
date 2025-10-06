import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format } from 'date-fns';

/**
 * Fetch dashboard statistics from Firestore
 * @returns {Object} Dashboard statistics
 */
export async function fetchDashboardStats() {
  try {
    console.log('Fetching dashboard stats...');
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    let totalSellers = 0;
    let presentToday = 0;
    let weeklyCollection = 0;
    let outstandingFees = 0;

    try {
      // Fetch all active sellers (handle if collection doesn't exist)
      const sellersSnapshot = await getDocs(
        query(collection(db, 'sellers'), where('active', '==', true))
      );
      totalSellers = sellersSnapshot.size;
      console.log('Found sellers:', totalSellers);

      // Fetch today's attendance (handle if collection doesn't exist)
      // Note: Attendance records exist = present, no 'present' field needed
      const todayStr = format(today, 'yyyy-MM-dd');
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '==', todayStr)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      presentToday = attendanceSnapshot.size;
      console.log('Present today:', presentToday, 'for date:', todayStr);

      // Fetch this week's payments (handle if collection doesn't exist)
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('timestamp', '>=', Timestamp.fromDate(weekStart)),
        where('timestamp', '<=', Timestamp.fromDate(weekEnd))
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        weeklyCollection += payment.amount || 0;
      });
      console.log('Weekly collection:', weeklyCollection);

      // Calculate outstanding fees only if we have sellers
      if (totalSellers > 0) {
        outstandingFees = await calculateOutstandingFees(sellersSnapshot.docs, weekStart, weekEnd);
      }
      console.log('Outstanding fees:', outstandingFees);

    } catch (collectionError) {
      console.warn('Some collections may not exist yet:', collectionError.message);
      // This is normal for a new database - just return zeros
    }

    const result = {
      totalSellers,
      presentToday,
      weeklyCollection,
      outstandingFees,
      lastUpdated: new Date()
    };
    
    console.log('Dashboard stats result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return zeros instead of throwing to prevent UI errors for new databases
    return {
      totalSellers: 0,
      presentToday: 0,
      weeklyCollection: 0,
      outstandingFees: 0,
      lastUpdated: new Date()
    };
  }
}

/**
 * Calculate outstanding fees for the current week
 * @param {Array} sellerDocs - Array of seller documents
 * @param {Date} weekStart - Start of current week
 * @param {Date} weekEnd - End of current week
 * @returns {number} Total outstanding fees
 */
async function calculateOutstandingFees(sellerDocs, weekStart, weekEnd) {
  try {
    let totalOutstanding = 0;

    for (const sellerDoc of sellerDocs) {
      const sellerId = sellerDoc.id;
      const sellerData = sellerDoc.data();
      const feeRate = sellerData.feeRate || 0;

      // Count attendance days for this seller this week
      // Note: Attendance uses string dates, not Timestamps
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('sellerId', '==', sellerId),
        where('date', '>=', weekStartStr),
        where('date', '<=', weekEndStr)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceDays = attendanceSnapshot.size;

      // Check if payment has been made for this seller this week
      const paymentQuery = query(
        collection(db, 'payments'),
        where('sellerId', '==', sellerId),
        where('timestamp', '>=', Timestamp.fromDate(weekStart)),
        where('timestamp', '<=', Timestamp.fromDate(weekEnd))
      );
      const paymentSnapshot = await getDocs(paymentQuery);
      const hasPaid = !paymentSnapshot.empty;

      // If seller worked but hasn't paid, add to outstanding
      if (attendanceDays > 0 && !hasPaid) {
        totalOutstanding += attendanceDays * feeRate;
      }
    }

    return totalOutstanding;
  } catch (error) {
    console.error('Error calculating outstanding fees:', error);
    return 0;
  }
}

/**
 * Fetch recent activity for dashboard
 * @param {number} limit - Number of recent activities to fetch
 * @returns {Array} Recent activities
 */
export async function fetchRecentActivity(limit = 10) {
  try {
    const activities = [];

    // Fetch recent payments
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      activities.push({
        type: 'payment',
        ...payment,
        id: doc.id,
        timestamp: payment.timestamp.toDate()
      });
    });

    // Fetch recent attendance records
    const attendanceQuery = query(
      collection(db, 'attendance'),
      orderBy('date', 'desc'),
      limit(limit)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    attendanceSnapshot.forEach(doc => {
      const attendance = doc.data();
      activities.push({
        type: 'attendance',
        ...attendance,
        id: doc.id,
        timestamp: new Date(attendance.date) // Convert string date to Date object
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get weekly summary data for the dashboard chart
 * @param {number} weeksBack - Number of weeks to look back
 * @returns {Array} Weekly summary data
 */
export async function fetchWeeklySummary(weeksBack = 4) {
  try {
    const weeks = [];
    const today = new Date();

    for (let i = 0; i < weeksBack; i++) {
      const weekStart = startOfWeek(new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000)), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      // Fetch payments for this week
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('timestamp', '>=', Timestamp.fromDate(weekStart)),
        where('timestamp', '<=', Timestamp.fromDate(weekEnd))
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      let weeklyRevenue = 0;
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        weeklyRevenue += payment.amount || 0;
      });

      // Fetch attendance count for this week
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', weekStartStr),
        where('date', '<=', weekEndStr)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      weeks.unshift({
        weekStart,
        weekEnd,
        label: format(weekStart, 'MMM d'),
        revenue: weeklyRevenue,
        attendanceDays: attendanceSnapshot.size
      });
    }

    return weeks;
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return [];
  }
}