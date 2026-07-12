import React, { useState } from 'react';
import { TransitProvider, useTransit } from './context/TransitContext';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FleetRegistryView } from './components/FleetRegistryView';
import { DriverManagementView } from './components/DriverManagementView';
import { TripDispatcherView } from './components/TripDispatcherView';
import { MaintenanceView } from './components/MaintenanceView';
import { FuelExpenseView } from './components/FuelExpenseView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsRBACView } from './components/SettingsRBACView';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, setCurrentUser, notification, clearNotification } = useTransit();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!currentUser);

  if (!isLoggedIn || !currentUser) {
    return (
      <Login
        onLoginSuccess={() => {
          setIsLoggedIn(true);
        }}
      />
    );
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <div className="flex h-screen w-full bg-[#0d1117] overflow-hidden">
      {/* Sidebar navigation matching Screenshots 1-8 */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header / Navbar */}
        <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'fleet' && <FleetRegistryView />}
            {activeTab === 'drivers' && <DriverManagementView />}
            {activeTab === 'trips' && <TripDispatcherView />}
            {activeTab === 'maintenance' && <MaintenanceView />}
            {activeTab === 'fuel' && <FuelExpenseView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsRBACView />}
          </div>
        </main>
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div className="toast">
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <div className="text-xs">
            <p className="font-semibold text-white capitalize">{notification.type}</p>
            <p className="text-gray-300 mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={clearNotification}
            className="ml-auto text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TransitProvider>
      <MainLayout />
    </TransitProvider>
  );
}
