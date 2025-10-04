import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function Payments({ onNavigate }) {
  const { t } = useLanguage();

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
      
      <div className="text-center py-12">
        <CreditCard size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('payments')}
        </h2>
        <p className="text-gray-600">
          Payment collection features coming soon...
        </p>
      </div>
    </div>
  );
}
