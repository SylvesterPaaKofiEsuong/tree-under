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
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Fetch all active sellers
    const sellersSnapshot = await getDocs(
      query(collection(db, 'sellers'), where('active', '==', true))
    );
    const totalSellers = sellersSnapshot.size;

    // Fetch today's attendance
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '>=', Timestamp.fromDate(todayStart)),
      where('date', '<=', Timestamp.fromDate(todayEnd)),
      where('present', '==', true)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const presentToday = attendanceSnapshot.size;

    // Fetch this week's payments
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('timestamp', '>=', Timestamp.fromDate(weekStart)),
      where('timestamp', '<=', Timestamp.fromDate(weekEnd))
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    let weeklyCollection = 0;
    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      weeklyCollection += payment.amount || 0;
    });

    // Calculate outstanding fees (sellers with unpaid fees for this week)
    const outstandingFees = await calculateOutstandingFees(sellersSnapshot.docs, weekStart, weekEnd);

    return {
      totalSellers,
      presentToday,
      weeklyCollection,
      outstandingFees,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
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
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('sellerId', '==', sellerId),
        where('date', '>=', Timestamp.fromDate(weekStart)),
        where('date', '<=', Timestamp.fromDate(weekEnd)),
        where('present', '==', true)
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
        timestamp: attendance.date.toDate()
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
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(weekStart)),
        where('date', '<=', Timestamp.fromDate(weekEnd)),
        where('present', '==', true)
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