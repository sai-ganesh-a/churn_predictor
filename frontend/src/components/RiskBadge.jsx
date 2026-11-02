import React from 'react';

export default function RiskBadge({ category, probability }) {
  const cat = (category || '').toLowerCase();
  
  if (cat === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        High Risk {probability !== undefined ? `(${probability}%)` : ''}
      </span>
    );
  }
  if (cat === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Medium Risk {probability !== undefined ? `(${probability}%)` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
      Low Risk {probability !== undefined ? `(${probability}%)` : ''}
    </span>
  );
}

export function ChurnBadge({ prediction }) {
  const isChurn = (prediction || '').toLowerCase() === 'yes';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        isChurn
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {isChurn ? 'Churn: Yes' : 'Retained'}
    </span>
  );
}
