import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import DatasetPage from './pages/DatasetPage';
import ModelTrainingPage from './pages/ModelTrainingPage';
import PredictionPage from './pages/PredictionPage';
import HighRiskPage from './pages/HighRiskPage';
import ModelInsightsPage from './pages/ModelInsightsPage';
import { checkHealth, getDatasetInfo } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [datasetName, setDatasetName] = useState('');

  // Fetch dataset info whenever activePage changes (e.g., after upload on Dataset page)
  useEffect(() => {
    getDatasetInfo().then((res) => {
      if (res?.filename) setDatasetName(res.filename);
    }).catch(() => {});
  }, [activePage]);

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        const res = await checkHealth();
        if (isMounted) setHealth(res);
      } catch (err) {
        if (isMounted) setHealth({ status: 'offline', database: 'disconnected' });
      } finally {
        if (isMounted) setIsHealthLoading(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'dataset':
        return <DatasetPage />;
      case 'training':
        return <ModelTrainingPage />;
      case 'prediction':
        return <PredictionPage />;
      case 'high-risk':
        return <HighRiskPage />;
      case 'insights':
        return <ModelInsightsPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* 2. Main Layout Shell */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        <Header
          activePage={activePage}
          setSidebarOpen={setSidebarOpen}
          health={health}
          isHealthLoading={isHealthLoading}
          datasetName={datasetName}
        />

        <main className="flex-1 p-5 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-[11px] text-slate-400">
          <span>ChurnInsight &bull; Customer Churn Analytics & Prediction &bull; Scikit-learn & Flask</span>
        </footer>
      </div>
    </div>
  );
}
