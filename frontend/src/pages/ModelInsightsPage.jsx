import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getModelMetrics, getModelComparison } from '../services/api';

const plotOptions = [
  { id: 'cm_decision_tree_balanced.png', label: 'Confusion Matrix — Decision Tree (Balanced)' },
  { id: 'imp_decision_tree_balanced.png', label: 'Feature Importance — Decision Tree (Balanced)' },
  { id: 'cm_random_forest_balanced.png', label: 'Confusion Matrix — Random Forest (Balanced)' },
  { id: 'imp_random_forest_balanced.png', label: 'Feature Importance — Random Forest (Balanced)' },
  { id: 'cm_logistic_regression_balanced.png', label: 'Confusion Matrix — Logistic Regression (Balanced)' },
  { id: 'imp_logistic_regression_balanced.png', label: 'Feature Importance — Logistic Regression (Balanced)' },
];

export default function ModelInsightsPage() {
  const [metrics, setMetrics] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('cm_decision_tree_balanced.png');
  const [activeTab, setActiveTab] = useState('features');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mRes, compRes] = await Promise.all([
          getModelMetrics(),
          getModelComparison()
        ]);
        setMetrics(mRes);
        setComparison(compRes.models || []);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const featureData = (metrics?.feature_importances || []).slice(0, 10).map((f) => ({
    feature: f.feature
      .replace('cat__', '')
      .replace('num__', '')
      .replace('_', ' '),
    importance: Number((f.importance * 100).toFixed(1))
  }));

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Segmented Tab Control */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Model Explainability & Drivers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interpretation of feature weights, classification matrix, and validation plots.
          </p>
        </div>

        {/* Clean Segmented Tab Control */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md text-xs">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              activeTab === 'features' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feature Weights
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Holdout Matrix
          </button>
          <button
            onClick={() => setActiveTab('plots')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              activeTab === 'plots' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Seaborn Plots
          </button>
        </div>
      </div>

      {/* TAB 1: Feature Importance */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Top 10 Influential Features (Decision Tree)
              </h3>
              <span className="text-[11px] text-slate-500">
                Gini split impurity reduction percentages
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={featureData}
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={130}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Relative Importance']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="importance" fill="#0f172a" radius={[0, 2, 2, 0]}>
                    {featureData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < 3 ? '#0f172a' : '#475569'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Observations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-semibold text-slate-900 block mb-1">
                Contract Type Dominance
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Month-to-month contracts represent the single strongest driver of attrition. Customers bound to 1- or 2-year agreements exhibit under 12% churn.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-semibold text-slate-900 block mb-1">
                Tenure Decay Curve
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Customer attrition drops exponentially past 12 months. Account onboarding and early engagement strategies yield the highest long-term retention dividends.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-semibold text-slate-900 block mb-1">
                Fiber vs. DSL Pricing Sensitivity
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Fiber optic users face higher monthly charges and churn at twice the rate of DSL accounts unless bundled with technical support services.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Holdout Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Holdout Classification Matrix (N = 1,409)
            </h3>
            <span className="text-[11px] text-slate-500">
              Decision Tree (Balanced) validation counts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* 2x2 Grid */}
            <div className="bg-slate-50 p-5 rounded border border-slate-200 max-w-xs mx-auto w-full">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900 font-mono">733</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">True Negative</div>
                  <div className="text-[10px] text-slate-400">Correctly retained</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-2xl font-bold text-slate-700 font-mono">302</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">False Positive</div>
                  <div className="text-[10px] text-slate-400">Retained flagged at-risk</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-2xl font-bold text-rose-700 font-mono">72</div>
                  <div className="text-[10px] font-semibold text-rose-700 uppercase mt-0.5">False Negative</div>
                  <div className="text-[10px] text-slate-400">Missed churners</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-2xl font-bold text-emerald-800 font-mono">302</div>
                  <div className="text-[10px] font-semibold text-emerald-800 uppercase mt-0.5">True Positive</div>
                  <div className="text-[10px] text-slate-400">Caught churners</div>
                </div>
              </div>
            </div>

            {/* Holdout Metrics Table */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Sensitivity (Churn Recall):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">80.75%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Precision:</span>
                  <span className="font-mono font-medium text-slate-800">50.00%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">F1-Score:</span>
                  <span className="font-mono font-medium text-slate-800">61.76%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">ROC-AUC:</span>
                  <span className="font-mono font-medium text-slate-800">0.8308</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Plots Image Gallery */}
      {activeTab === 'plots' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Generated Matplotlib & Seaborn Artifacts
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Directly served from /api/model/plots/&lt;filename&gt;
              </span>
            </div>

            <select
              value={selectedPlot}
              onChange={(e) => setSelectedPlot(e.target.value)}
              className="py-1 px-3 text-xs"
            >
              {plotOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-center min-h-[380px]">
            <img
              src={`/api/model/plots/${selectedPlot}`}
              alt={selectedPlot}
              className="max-h-[380px] rounded object-contain bg-white p-2 border border-slate-200 shadow-xs"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%2394a3b8">Artifact loading...</text></svg>';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
