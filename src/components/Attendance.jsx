import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, CheckCircle } from 'lucide-react';

export default function Attendance() {
  const { t } = useLanguage();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center py-12">
        <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('markDailyAttendance')}
        </h2>
        <p className="text-gray-600">
          Attendance tracking feature coming soon...
        </p>
      </div>
    </div>
  );
}