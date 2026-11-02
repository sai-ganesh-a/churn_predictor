import React from 'react';
import {
  LayoutDashboard,
  Database,
  Cpu,
  UserCheck,
  AlertTriangle,
  LineChart,
  BarChart2
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'training', label: 'Model Evaluation', icon: Cpu },
  { id: 'prediction', label: 'Predict Churn', icon: UserCheck },
  { id: 'high-risk', label: 'High-Risk Accounts', icon: AlertTriangle },
  { id: 'insights', label: 'Model Insights', icon: LineChart },
];

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-slate-900 block leading-tight">
                ChurnInsight
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                Retention Analytics
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-slate-900' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quiet Pipeline Status Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Pipeline</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Active</span>
          </div>
          <div className="text-slate-800 font-medium truncate text-[11px]">Decision Tree (Balanced)</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
            <span>Holdout Recall:</span>
            <span className="font-semibold text-slate-800">80.8%</span>
          </div>
        </div>
      </aside>
    </>
  );
}
