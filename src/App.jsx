import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './components/Login';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Payments from './components/Payments';
import Reports from './components/Reports';
import SellerManagement from './components/SellerManagement';
import { useOfflineSync } from './hooks/useOfflineSync';
import { Toaster } from 'react-hot-toast';

// Main App Content
function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { currentUser, loading } = useAuth();
  const { isOffline } = useOfflineSync();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-xl font-bold text-white">TUC</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'attendance':
        return <Attendance onNavigate={setCurrentView} />;
      case 'payments':
        return <Payments onNavigate={setCurrentView} />;
      case 'reports':
        return <Reports onNavigate={setCurrentView} />;
      case 'sellers':
        return <SellerManagement onNavigate={setCurrentView} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setCurrentView('dashboard')} 
        isOffline={isOffline} 
      />
      <main className="pb-6">
        {renderView()}
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

// Root App Component with Providers
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
