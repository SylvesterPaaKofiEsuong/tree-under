import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useOfflineSync } from './hooks/useOfflineSync';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Payments from './components/Payments';
import Reports from './components/Reports';
import SellerManagement from './components/SellerManagement';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  FileText, 
  Users,
  X
} from 'lucide-react';

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'dashboard', icon: Home, component: Dashboard },
  { id: 'attendance', label: 'attendance', icon: Calendar, component: Attendance },
  { id: 'payments', label: 'payments', icon: DollarSign, component: Payments },
  { id: 'reports', label: 'reports', icon: FileText, component: Reports },
  { id: 'sellers', label: 'sellers', icon: Users, component: SellerManagement }
];

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { isOffline } = useOfflineSync();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
  if (!isAuthenticated) {
    return <Login />;
  }

  // Find current component
  const currentNavItem = navItems.find(item => item.id === currentView) || navItems[0];
  const CurrentComponent = currentNavItem.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        isOffline={isOffline}
      />

      <div className="flex">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
            <div className="flex flex-col flex-grow">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-150 ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon 
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`} 
                      />
                      {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
              <div className="flex items-center justify-between px-4 py-3 bg-primary-600">
                <span className="text-lg font-medium text-white">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                <nav className="flex-1 px-2 pb-4 space-y-1">
                  {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                          isActive
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon 
                          className={`mr-3 h-5 w-5 ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`} 
                        />
                        {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          <CurrentComponent onNavigate={setCurrentView} />
        </main>
      </div>
    </div>
  );
}

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