import React from 'react';
import { Menu, Database, CheckCircle2, AlertCircle } from 'lucide-react';

const pageTitles = {
  dashboard: 'Customer Churn Overview',
  dataset: 'Dataset Management',
  training: 'Model Evaluation & Comparison',
  prediction: 'Single Customer Prediction',
  'high-risk': 'High-Risk Customer Directory',
  insights: 'Model Insights & Explainability',
};

export default function Header({ activePage, setSidebarOpen, health, isHealthLoading, datasetName }) {
  const title = pageTitles[activePage] || 'Customer Churn Overview';
  const isConnected = health && health.status === 'healthy' && health.database === 'connected';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-semibold text-slate-900">{title}</span>
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Active Dataset Pill */}
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-500 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <Database className="w-3 h-3 text-slate-400" />
            <span>{datasetName || 'WA_Fn-UseC_-Telco-Customer-Churn.csv'}</span>
          </div>

          {/* Backend Connection Status */}
          <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthLoading
                  ? 'bg-slate-400'
                  : isConnected
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-[11px]">
              {isHealthLoading ? 'Checking...' : isConnected ? 'API Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
