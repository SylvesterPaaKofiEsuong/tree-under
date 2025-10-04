import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, Menu, X, Globe, Wifi, WifiOff } from 'lucide-react';

export default function Header({ onMenuClick, isOffline = false }) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { currentUser, logout } = useAuth();
  const { language, switchLanguage, t } = useLanguage();

  const handleLogout = async () => {
    if (confirm(t('confirm') + '?')) {
      await logout();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    switchLanguage(newLanguage);
    setShowLanguageMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* Offline indicator */}
      {isOffline && (
        <div className="offline-indicator">
          <div className="flex items-center justify-center">
            <WifiOff size={16} className="mr-2" />
            {t('offline')}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu button and title */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center ml-2 md:ml-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-white">TUC</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Tree Under Checklist
                </h1>
                <p className="text-xs text-gray-500">
                  {currentUser?.name} • {currentUser?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Language switcher and logout */}
          <div className="flex items-center space-x-4">
            {/* Online status */}
            <div className="flex items-center text-sm text-gray-500">
              {isOffline ? (
                <WifiOff size={16} className="text-orange-500" />
              ) : (
                <Wifi size={16} className="text-green-500" />
              )}
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Globe size={18} className="mr-1" />
                <span className="font-medium uppercase">
                  {language}
                </span>
              </button>

              {/* Language dropdown */}
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        language === 'en' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('tw')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        language === 'tw' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Twi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center p-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              title={t('logout')}
            >
              <LogOut size={18} className="mr-1" />
              <span className="hidden sm:inline">
                {t('logout')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}