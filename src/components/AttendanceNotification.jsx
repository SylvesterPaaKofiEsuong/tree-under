import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  Zap,
  Settings
} from 'lucide-react';
import { snoozeNotifications, dismissNotificationsForToday } from '../lib/notificationService';

export default function AttendanceNotification({ 
  status, 
  onTakeAttendance, 
  onDismiss,
  className = '' 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  if (!status || !status.shouldNotify || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSnooze = (minutes) => {
    snoozeNotifications(minutes);
    setIsVisible(false);
    setShowSnoozeOptions(false);
    onDismiss?.();
  };

  const handleDismissForToday = () => {
    dismissNotificationsForToday();
    setIsVisible(false);
    onDismiss?.();
  };

  const getPriorityStyles = () => {
    switch (status.priority) {
      case 'high':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          IconComponent: AlertTriangle
        };
      case 'medium':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          IconComponent: Clock
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          IconComponent: CheckCircle
        };
    }
  };

  const styles = getPriorityStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div className={`relative ${className}`}>
      {/* Main Notification Banner */}
      <div className={`${styles.container} border rounded-lg p-4 shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`${styles.icon} mt-0.5 flex-shrink-0`}>
              <IconComponent size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className={`text-sm font-medium ${styles.text}`}>
                    Attendance Reminder
                  </h3>
                  <p className={`text-sm ${styles.text} mt-1`}>
                    {status.message}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  {status.actionText && (
                    <button
                      onClick={onTakeAttendance}
                      className={`${styles.button} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center`}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {status.actionText}
                    </button>
                  )}
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                      title="Snooze reminder"
                    >
                      <Clock size={16} />
                    </button>
                    
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Snooze Options */}
        {showSnoozeOptions && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Snooze for:</span>
              <button
                onClick={() => handleSnooze(30)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                30 min
              </button>
              <button
                onClick={() => handleSnooze(60)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                1 hour
              </button>
              <button
                onClick={() => handleSnooze(120)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                2 hours
              </button>
              <button
                onClick={handleDismissForToday}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Rest of day
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pulse Animation for High Priority */}
      {status.priority === 'high' && (
        <div className="absolute inset-0 rounded-lg animate-pulse bg-red-100 opacity-30 pointer-events-none"></div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactAttendanceNotification({ 
  status, 
  onTakeAttendance, 
  onDismiss,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!status || !status.shouldNotify || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getPriorityColor = () => {
    switch (status.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className={`${getPriorityColor()} text-white px-3 py-2 rounded-md flex items-center justify-between text-sm ${className}`}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span className="truncate">{status.message}</span>
      </div>
      
      <div className="flex items-center space-x-1 ml-2">
        {status.actionText && (
          <button
            onClick={onTakeAttendance}
            className="px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs transition-colors"
          >
            {status.actionText}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}