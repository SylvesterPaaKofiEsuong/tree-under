import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Settings as SettingsIcon,
  Save,
  X
} from 'lucide-react';
import { 
  getNotificationPreferences, 
  saveNotificationPreferences,
  requestNotificationPermission 
} from '../lib/notificationService';

export default function NotificationSettings({ onClose, className = '' }) {
  const [preferences, setPreferences] = useState(null);
  const [browserPermission, setBrowserPermission] = useState('default');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const prefs = getNotificationPreferences();
    setPreferences(prefs);
    setBrowserPermission(Notification?.permission || 'unsupported');
  }, []);

  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setHasChanges(true);
  };

  const handleReminderTimesChange = (hour, checked) => {
    const currentTimes = [...preferences.reminderTimes];
    if (checked) {
      if (!currentTimes.includes(hour)) {
        currentTimes.push(hour);
      }
    } else {
      const index = currentTimes.indexOf(hour);
      if (index > -1) {
        currentTimes.splice(index, 1);
      }
    }
    
    handlePreferenceChange('reminderTimes', currentTimes.sort((a, b) => a - b));
  };

  const handleSave = () => {
    saveNotificationPreferences(preferences);
    setHasChanges(false);
    onClose?.();
  };

  const handleRequestBrowserPermission = async () => {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  if (!preferences) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  const reminderHours = [8, 10, 12, 14, 16, 18]; // 8 AM to 6 PM

  return (
    <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Settings
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Enable/Disable Notifications */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <div className="flex items-center space-x-2">
              {preferences.enabled ? (
                <Bell size={16} className="text-green-600" />
              ) : (
                <BellOff size={16} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Enable attendance reminders
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Show notifications when attendance hasn't been recorded
          </p>
        </div>

        {preferences.enabled && (
          <>
            {/* Reminder Times */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock size={16} className="mr-2 text-primary-600" />
                Reminder Times
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {reminderHours.map(hour => (
                  <label key={hour} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.reminderTimes.includes(hour)}
                      onChange={(e) => handleReminderTimesChange(hour, e.target.checked)}
                      className="w-3 h-3 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {formatHour(hour)}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select times when you want to be reminded
              </p>
            </div>

            {/* Browser Notifications */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Browser Notifications
              </h3>
              
              {browserPermission === 'unsupported' && (
                <div className="text-sm text-gray-500">
                  Browser notifications are not supported on this device.
                </div>
              )}
              
              {browserPermission === 'denied' && (
                <div className="text-sm text-red-600">
                  Browser notifications are blocked. Enable them in your browser settings to receive notifications when the app is in the background.
                </div>
              )}
              
              {browserPermission === 'default' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Allow browser notifications for reminders even when the app is closed.
                  </p>
                  <button
                    onClick={handleRequestBrowserPermission}
                    className="btn btn-secondary text-sm"
                  >
                    Enable Browser Notifications
                  </button>
                </div>
              )}
              
              {browserPermission === 'granted' && (
                <div className="text-sm text-green-600">
                  ✓ Browser notifications enabled
                </div>
              )}
            </div>

            {/* Auto-hide Option */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoHide}
                  onChange={(e) => handlePreferenceChange('autoHide', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Auto-hide notifications after 10 seconds
                </span>
              </label>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className={`flex-1 btn btn-primary flex items-center justify-center ${
              !hasChanges ? 'opacity-50' : ''
            }`}
            disabled={!hasChanges}
          >
            <Save size={16} className="mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact settings toggle for header
export function NotificationToggle({ className = '' }) {
  const [preferences, setPreferences] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const prefs = getNotificationPreferences();
    setPreferences(prefs);
  }, []);

  const handleToggle = () => {
    const newPrefs = { ...preferences, enabled: !preferences.enabled };
    setPreferences(newPrefs);
    saveNotificationPreferences(newPrefs);
  };

  if (!preferences) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className={`p-2 rounded-md transition-colors ${
          preferences.enabled
            ? 'text-primary-600 hover:bg-primary-50'
            : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={preferences.enabled ? 'Notifications enabled' : 'Notifications disabled'}
      >
        {preferences.enabled ? (
          <Bell size={18} />
        ) : (
          <BellOff size={18} />
        )}
      </button>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <NotificationSettings onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
}