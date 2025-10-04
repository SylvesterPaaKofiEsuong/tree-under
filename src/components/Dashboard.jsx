import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  CheckCircle, 
  DollarSign, 
  AlertCircle, 
  Calendar,
  Camera,
  FileText,
  Settings
} from 'lucide-react';
import { formatCurrency, getCurrentWeekRange } from '../lib/utils';

export default function Dashboard({ onNavigate }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalSellers: 0,
    presentToday: 0,
    weeklyCollection: 0,
    outstandingFees: 0
  });

  // Mock data - replace with real data from Firebase
  useEffect(() => {
    // This would normally fetch real data from Firestore
    setStats({
      totalSellers: 42,
      presentToday: 38,
      weeklyCollection: 1850,
      outstandingFees: 120
    });
  }, []);

  const quickActions = [
    {
      title: t('markAttendance'),
      description: 'Mark who showed up today',
      icon: CheckCircle,
      color: 'bg-green-500',
      action: () => onNavigate('attendance')
    },
    {
      title: t('collectPayment'),
      description: 'Collect weekly fees',
      icon: Camera,
      color: 'bg-blue-500',
      action: () => onNavigate('payments')
    },
    {
      title: t('viewReports'),
      description: 'See collection reports',
      icon: FileText,
      color: 'bg-purple-500',
      action: () => onNavigate('reports')
    },
    {
      title: t('manageSellers'),
      description: 'Add or edit sellers',
      icon: Users,
      color: 'bg-orange-500',
      action: () => onNavigate('sellers')
    }
  ];

  const statCards = [
    {
      title: t('totalSellers'),
      value: stats.totalSellers,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      change: null
    },
    {
      title: t('presentToday'),
      value: stats.presentToday,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
      change: `${Math.round((stats.presentToday / stats.totalSellers) * 100)}%`
    },
    {
      title: t('weeklyCollection'),
      value: formatCurrency(stats.weeklyCollection),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
      change: null
    },
    {
      title: t('outstandingFees'),
      value: formatCurrency(stats.outstandingFees),
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-50',
      change: null
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard')}
        </h1>
        <p className="text-gray-600">
          {getCurrentWeekRange()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stat.change} attendance
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="card p-6 text-left hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center mb-4">
                <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon size={24} />
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Today's Attendance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Present</span>
              <span className="font-medium text-green-600">
                {stats.presentToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Absent</span>
              <span className="font-medium text-red-600">
                {stats.totalSellers - stats.presentToday}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-medium text-gray-900">
                {stats.totalSellers}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            This Week's Collections
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Collected</span>
              <span className="font-medium text-green-600">
                {formatCurrency(stats.weeklyCollection)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Outstanding</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(stats.outstandingFees)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium text-gray-900">Expected Total</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(stats.weeklyCollection + stats.outstandingFees)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}