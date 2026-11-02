import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${trend.color || 'bg-slate-100 text-slate-700'}`}>
            {trend.text}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
