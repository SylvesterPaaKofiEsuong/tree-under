import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { 
  Calendar, 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { orderBy, where } from 'firebase/firestore';
import { format, startOfWeek, addDays } from 'date-fns';

export default function Attendance({ onNavigate }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Format date for database storage (YYYY-MM-DD)
  const formatDateForDB = (date) => format(date, 'yyyy-MM-dd');
  const formatDateDisplay = (date) => format(date, 'EEEE, MMMM d, yyyy');
  const selectedDateStr = formatDateForDB(selectedDate);

  // Fetch active sellers
  const { data: sellers, loading: sellersLoading } = useCollection('sellers', [
    where('active', '==', true),
    orderBy('name')
  ]);

  // Fetch attendance for selected date
  const { data: existingAttendance, loading: attendanceLoading } = useCollection('attendance', [
    where('date', '==', selectedDateStr)
  ]);

  const { addDocument, updateDocument, deleteDocument, loading: operationLoading } = useFirestore('attendance');

  // Initialize attendance data when sellers or existing attendance changes
  useEffect(() => {
    if (!sellers.length) return;

    const initialData = {};
    sellers.forEach(seller => {
      const existing = existingAttendance.find(att => att.sellerId === seller.id);
      initialData[seller.id] = existing ? 'present' : 'absent';
    });

    setAttendanceData(initialData);
    setHasChanges(false);
  }, [sellers, existingAttendance]);

  const handleAttendanceChange = (sellerId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [sellerId]: status
    }));
    setHasChanges(true);
  };

  const saveAttendance = async () => {
    try {
      const weekStart = formatDateForDB(startOfWeek(selectedDate, { weekStartsOn: 1 })); // Monday start

      // Process each seller's attendance
      for (const seller of sellers) {
        const sellerId = seller.id;
        const status = attendanceData[sellerId];
        const existing = existingAttendance.find(att => att.sellerId === sellerId);

        if (status === 'present') {
          if (!existing) {
            // Add new attendance record
            await addDocument({
              sellerId,
              sellerName: seller.name,
              date: selectedDateStr,
              weekStart,
              markedBy: currentUser.uid,
              markedByName: currentUser.name
            });
          }
        } else {
          if (existing) {
            // Remove attendance record
            await deleteDocument(existing.id);
          }
        }
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const resetChanges = () => {
    const resetData = {};
    sellers.forEach(seller => {
      const existing = existingAttendance.find(att => att.sellerId === seller.id);
      resetData[seller.id] = existing ? 'present' : 'absent';
    });
    setAttendanceData(resetData);
    setHasChanges(false);
  };

  const markAllPresent = () => {
    const allPresentData = {};
    sellers.forEach(seller => {
      allPresentData[seller.id] = 'present';
    });
    setAttendanceData(allPresentData);
    setHasChanges(true);
  };

  const markAllAbsent = () => {
    const allAbsentData = {};
    sellers.forEach(seller => {
      allAbsentData[seller.id] = 'absent';
    });
    setAttendanceData(allAbsentData);
    setHasChanges(true);
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendanceData).filter(status => status === 'present').length;
    const total = sellers.length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  };

  const stats = getAttendanceStats();

  if (sellersLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('markDailyAttendance')}
        </h1>
        <p className="text-gray-600">
          {formatDateDisplay(selectedDate)}
        </p>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('selectDate')}
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={formatDateForDB(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            className="input w-auto"
            max={formatDateForDB(new Date())} // Can't mark future dates
          />
          <button
            onClick={() => setSelectedDate(new Date())}
            className="btn btn-secondary flex items-center"
          >
            <Clock size={16} className="mr-2" />
            Today
          </button>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{stats.present}</div>
          <div className="text-sm text-gray-600">{t('presentSellers')}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">{stats.absent}</div>
          <div className="text-sm text-gray-600">{t('absentSellers')}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Sellers</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">{stats.percentage}%</div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={markAllPresent}
          className="btn btn-secondary flex items-center"
          disabled={operationLoading}
        >
          <CheckCircle2 size={16} className="mr-2" />
          Mark All Present
        </button>
        <button
          onClick={markAllAbsent}
          className="btn btn-secondary flex items-center"
          disabled={operationLoading}
        >
          <XCircle size={16} className="mr-2" />
          Mark All Absent
        </button>
        {hasChanges && (
          <button
            onClick={resetChanges}
            className="btn btn-secondary flex items-center"
            disabled={operationLoading}
          >
            <RotateCcw size={16} className="mr-2" />
            Reset Changes
          </button>
        )}
      </div>

      {/* Sellers List */}
      {sellers.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Active Sellers
          </h2>
          <p className="text-gray-600 mb-4">
            Add some sellers first to track attendance
          </p>
          <button
            onClick={() => onNavigate('sellers')}
            className="btn btn-primary"
          >
            Manage Sellers
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sellers.map((seller) => {
              const isPresent = attendanceData[seller.id] === 'present';
              return (
                <div
                  key={seller.id}
                  className={`card p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isPresent
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-primary-200'
                  }`}
                  onClick={() => handleAttendanceChange(seller.id, isPresent ? 'absent' : 'present')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {seller.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{seller.product}</p>
                      <div className="text-xs text-gray-500">
                        GHS {seller.feeRate}/day
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${
                      isPresent ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {isPresent ? (
                        <CheckCircle2 size={24} className="fill-current" />
                      ) : (
                        <XCircle size={24} />
                      )}
                    </div>
                  </div>
                  
                  {/* Schedule Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1">
                      {seller.schedule?.length > 0 ? (
                        seller.schedule.map(day => (
                          <span key={day} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {day}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No schedule set</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={saveAttendance}
                className="btn btn-primary px-6 py-3 shadow-lg flex items-center"
                disabled={operationLoading || attendanceLoading}
              >
                {operationLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {t('saving')}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save size={20} className="mr-2" />
                    Save Attendance
                  </div>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
