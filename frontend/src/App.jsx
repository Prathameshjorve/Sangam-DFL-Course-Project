import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './pages/DashboardOverview';
import { GlobalEventsExplorer } from './pages/GlobalEventsExplorer';
import { CrossCityCorrelations } from './pages/CrossCityCorrelations';
import { CityDetailView } from './pages/CityDetailView';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import { apiService } from './services/api';

export function App() {
  const [syncing, setSyncing] = useState(false);

  const handleGlobalSync = async () => {
    try {
      setSyncing(true);
      await apiService.triggerSync();
      // Dispatch custom event to notify active view to reload
      window.dispatchEvent(new Event('sangam-sync-complete'));
    } catch (err) {
      alert("Synchronization alert: " + (err.response?.data?.detail || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#4C5744] text-[#1E251A] flex flex-col font-sans selection:bg-[#526346] selection:text-white">
          <Navbar onTriggerSync={handleGlobalSync} syncing={syncing} />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/events" element={<GlobalEventsExplorer />} />
              <Route path="/correlations" element={<CrossCityCorrelations />} />
              <Route path="/cities" element={<CityDetailView />} />
              <Route path="/cities/:cityName" element={<CityDetailView />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="w-full bg-[#394333] border-t border-[#4E5C46] py-4 text-center text-xs text-[#BBCAB0]">
            <p className="font-mono">
              SANGAM Tactical Text Intelligence • Distributed Systems (DFL) Project • Ports: 8000 (Global), 8001-8004 (City Nodes)
            </p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
