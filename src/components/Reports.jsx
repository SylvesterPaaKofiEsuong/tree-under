import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useFirestore';
import { 
  BarChart3, 
  ArrowLeft, 
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Eye,
  Filter,
  RefreshCw,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { orderBy, where } from 'firebase/firestore';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subWeeks, 
  subMonths,
  isWithinInterval,
  parseISO,
  differenceInWeeks,
  eachWeekOfInterval
} from 'date-fns';

export default function Reports({ onNavigate }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState('weekly'); // weekly, monthly, custom
  const [dateRange, setDateRange] = useState({
    start: subWeeks(new Date(), 4), // Last 4 weeks
    end: new Date()
  });
  const [selectedSellerId, setSelectedSellerId] = useState('all');

  // Fetch all data
  const { data: sellers, loading: sellersLoading } = useCollection('sellers', [orderBy('name')]);
  const { data: allAttendance, loading: attendanceLoading } = useCollection('attendance', [orderBy('date', 'desc')]);
  const { data: allPayments, loading: paymentsLoading } = useCollection('payments', [orderBy('timestamp', 'desc')]);

  const isLoading = sellersLoading || attendanceLoading || paymentsLoading;

  // Filter data by date range
  const filteredAttendance = allAttendance.filter(att => {
    const attDate = parseISO(att.date);
    return isWithinInterval(attDate, { start: dateRange.start, end: dateRange.end });
  });

  const filteredPayments = allPayments.filter(payment => {
    const paymentDate = parseISO(payment.timestamp);
    return isWithinInterval(paymentDate, { start: dateRange.start, end: dateRange.end });
  });

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPayments = filteredPayments.length;
    const uniqueSellers = new Set(filteredPayments.map(p => p.sellerId)).size;
    const totalAttendanceDays = filteredAttendance.length;
    
    const avgRevenuePerWeek = reportType === 'weekly' 
      ? totalRevenue / Math.max(differenceInWeeks(dateRange.end, dateRange.start), 1)
      : totalRevenue;

    return {
      totalRevenue,
      totalPayments,
      uniqueSellers,
      totalAttendanceDays,
      avgRevenuePerWeek
    };
  };

  // Calculate seller performance
  const calculateSellerPerformance = () => {
    const sellerStats = sellers.map(seller => {
      const sellerAttendance = filteredAttendance.filter(att => att.sellerId === seller.id);
      const sellerPayments = filteredPayments.filter(pay => pay.sellerId === seller.id);
      
      const daysWorked = sellerAttendance.length;
      const totalPaid = sellerPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const averagePerDay = daysWorked > 0 ? totalPaid / daysWorked : 0;
      
      // Calculate expected vs actual payments
      const expectedRevenue = daysWorked * seller.feeRate;
      const collectionRate = expectedRevenue > 0 ? (totalPaid / expectedRevenue) * 100 : 0;
      
      return {
        ...seller,
        daysWorked,
        totalPaid,
        averagePerDay,
        expectedRevenue,
        collectionRate,
        paymentsCount: sellerPayments.length
      };
    });

    return sellerStats.sort((a, b) => b.totalPaid - a.totalPaid);
  };

  // Calculate weekly trends
  const calculateWeeklyTrends = () => {
    const weeks = eachWeekOfInterval(
      { start: dateRange.start, end: dateRange.end },
      { weekStartsOn: 1 }
    );

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      const weekPayments = filteredPayments.filter(payment => {
        const paymentDate = parseISO(payment.timestamp);
        return isWithinInterval(paymentDate, { start: weekStart, end: weekEnd });
      });
      
      const weekAttendance = filteredAttendance.filter(att => {
        const attDate = parseISO(att.date);
        return isWithinInterval(attDate, { start: weekStart, end: weekEnd });
      });
      
      const revenue = weekPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const attendanceDays = weekAttendance.length;
      const uniqueSellers = new Set(weekPayments.map(p => p.sellerId)).size;
      
      return {
        weekStart,
        weekEnd,
        weekKey,
        label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        revenue,
        attendanceDays,
        uniqueSellers,
        paymentsCount: weekPayments.length
      };
    });
  };

  const summaryStats = calculateSummaryStats();
  const sellerPerformance = calculateSellerPerformance();
  const weeklyTrends = calculateWeeklyTrends();

  const formatCurrency = (amount) => `GHS ${amount.toFixed(2)}`;
  const formatPercent = (value) => `${Math.round(value)}%`;

  const exportToCSV = () => {
    const csvData = [
      ['Seller Name', 'Product', 'Days Worked', 'Total Paid', 'Expected Revenue', 'Collection Rate', 'Status'],
      ...sellerPerformance.map(seller => [
        seller.name,
        seller.product,
        seller.daysWorked,
        seller.totalPaid,
        seller.expectedRevenue,
        `${Math.round(seller.collectionRate)}%`,
        seller.active ? 'Active' : 'Inactive'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Reports & Analytics', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(
      `Period: ${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`,
      pageWidth / 2, 30, { align: 'center' }
    );
    
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageWidth / 2, 35, { align: 'center' });
    
    // Summary Statistics
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Summary Statistics', 20, 50);
    
    const summaryData = [
      ['Total Revenue', formatCurrency(summaryStats.totalRevenue)],
      ['Payments Collected', summaryStats.totalPayments.toString()],
      ['Active Sellers', summaryStats.uniqueSellers.toString()],
      ['Attendance Days', summaryStats.totalAttendanceDays.toString()],
      ['Avg per Week', formatCurrency(summaryStats.avgRevenuePerWeek)]
    ];
    
    doc.autoTable({
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });
    
    // Weekly Trends
    let finalY = doc.lastAutoTable.finalY + 15;
    
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Weekly Revenue Trends', 20, finalY);
    
    const trendsData = weeklyTrends.map(week => [
      week.label,
      formatCurrency(week.revenue),
      week.attendanceDays.toString(),
      week.uniqueSellers.toString()
    ]);
    
    doc.autoTable({
      head: [['Week', 'Revenue', 'Attendance Days', 'Unique Sellers']],
      body: trendsData,
      startY: finalY + 5,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
    
    // Seller Performance
    finalY = doc.lastAutoTable.finalY + 15;
    
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Seller Performance', 20, finalY);
    
    const performanceData = sellerPerformance.map(seller => [
      seller.name,
      seller.product,
      seller.daysWorked.toString(),
      formatCurrency(seller.totalPaid),
      formatCurrency(seller.averagePerDay),
      formatPercent(seller.collectionRate),
      seller.active ? 'Active' : 'Inactive'
    ]);
    
    doc.autoTable({
      head: [['Seller', 'Product', 'Days', 'Total Paid', 'Avg/Day', 'Collection Rate', 'Status']],
      body: performanceData,
      startY: finalY + 5,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 18 }
      },
      margin: { left: 20, right: 20 }
    });
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${totalPages} | Tree Under Checklist - Reports`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`reports-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        {t('backToDashboard')}
      </button>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Reports & Analytics
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={exportToCSV}
              className="btn btn-secondary flex items-center justify-center text-sm"
            >
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="btn btn-primary flex items-center justify-center text-sm"
            >
              <FileDown size={16} className="mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={reportType}
            onChange={(e) => {
              const type = e.target.value;
              setReportType(type);
              if (type === 'weekly') {
                setDateRange({
                  start: subWeeks(new Date(), 4),
                  end: new Date()
                });
              } else if (type === 'monthly') {
                setDateRange({
                  start: subMonths(new Date(), 3),
                  end: new Date()
                });
              }
            }}
            className="input w-auto"
          >
            <option value="weekly">Last 4 Weeks</option>
            <option value="monthly">Last 3 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {reportType === 'custom' && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="input w-auto"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="input w-auto"
            />
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {formatCurrency(summaryStats.totalRevenue)}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {summaryStats.totalPayments}
          </div>
          <div className="text-sm text-gray-600">Payments Collected</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {summaryStats.uniqueSellers}
          </div>
          <div className="text-sm text-gray-600">Active Sellers</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {summaryStats.totalAttendanceDays}
          </div>
          <div className="text-sm text-gray-600">Attendance Days</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-teal-600 mb-2">
            {formatCurrency(summaryStats.avgRevenuePerWeek)}
          </div>
          <div className="text-sm text-gray-600">Avg per Week</div>
        </div>
      </div>

      {/* Weekly Trends Chart */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2" />
          Weekly Revenue Trends
        </h3>
        <div className="space-y-4">
          {weeklyTrends.map((week, index) => {
            const maxRevenue = Math.max(...weeklyTrends.map(w => w.revenue));
            const barWidth = maxRevenue > 0 ? (week.revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={week.weekKey} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600 flex-shrink-0">
                  {week.label}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-6 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                      {formatCurrency(week.revenue)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 w-20 text-right">
                  {week.attendanceDays} days
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seller Performance Table */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Users size={20} className="mr-2" />
          Seller Performance
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Worked
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg/Day
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Rate
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellerPerformance
                .filter(seller => selectedSellerId === 'all' || seller.id === selectedSellerId)
                .map((seller, index) => (
                <tr key={seller.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {seller.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {seller.product}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    {seller.daysWorked}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(seller.totalPaid)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {seller.paymentsCount} payments
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    {formatCurrency(seller.averagePerDay)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`text-sm font-medium ${
                      seller.collectionRate >= 90 ? 'text-green-600' :
                      seller.collectionRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercent(seller.collectionRate)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      seller.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {seller.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sellerPerformance.length === 0 && (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              No seller data found for the selected date range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
