import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RotateCcw,
  CheckCircle2,
  BarChart2,
  Info
} from 'lucide-react';
import { getModelComparison, getModelMetrics, trainModels } from '../services/api';

export default function ModelTrainingPage() {
  const [comparison, setComparison] = useState([]);
  const [bestModel, setBestModel] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, metricsRes] = await Promise.all([
        getModelComparison(),
        getModelMetrics()
      ]);
      setComparison(compRes.models || []);
      setBestModel(metricsRes);
      setSelectedModel(metricsRes);
      setError(null);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
      setError('Failed to fetch model metrics from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetrain = async () => {
    try {
      setTraining(true);
      setMessage(null);
      setError(null);
      const res = await trainModels();
      setMessage(res.message || 'Models retrained and evaluated successfully.');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrain models.');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Model Evaluation & Benchmarking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holdout test set evaluation (N = 1,409; stratified 80/20 split; seed = 42).
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-60"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Evaluating Candidates...' : 'Retrain All Models'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* 2. Primary Selected Model vs Alternative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selected Best Model */}
        <div className="bg-white p-5 rounded-lg border-2 border-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Production Selected Model
              </span>
              <span className="text-[10px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Decision Tree (Balanced)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Selected for its priority <strong className="text-slate-900">80.75% Churn Recall</strong> (identifying 302 of 374 churners). Prevents missed attrition in retention campaigns.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Recall</span>
              <span className="text-sm font-bold text-slate-900">80.75%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">F1-Score</span>
              <span className="text-sm font-medium text-slate-700">61.76%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ROC-AUC</span>
              <span className="text-sm font-medium text-slate-700">0.8308</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
              <span className="text-sm font-medium text-slate-700">73.46%</span>
            </div>
          </div>
        </div>

        {/* Top Alternative */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Top Ensemble Alternative
              </span>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Alternative
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Random Forest (Balanced)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Achieves highest overall <strong className="text-slate-900">F1-Score (62.98%)</strong> and <strong className="text-slate-900">ROC-AUC (0.8427)</strong> with 77.54% Recall and calibrated probabilities.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Recall</span>
              <span className="text-sm font-medium text-slate-700">77.54%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">F1-Score</span>
              <span className="text-sm font-bold text-slate-900">62.98%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ROC-AUC</span>
              <span className="text-sm font-medium text-slate-700">0.8427</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
              <span className="text-sm font-medium text-slate-700">75.80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Model Evaluation Matrix */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Holdout Evaluation Matrix (N = 1,409)
            </h3>
            <span className="text-[11px] text-slate-500">
              Metrics calculated specifically for positive churn class (<code className="text-slate-800">Churn = Yes</code>)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sorted by Churn Recall</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Model Algorithm</th>
                <th className="py-2.5 px-3">Class Weight</th>
                <th className="py-2.5 px-4 text-right">Accuracy</th>
                <th className="py-2.5 px-4 text-right">Precision</th>
                <th className="py-2.5 px-4 text-right font-semibold text-slate-900">Recall (Churn)</th>
                <th className="py-2.5 px-4 text-right">F1-Score</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparison.map((m) => {
                const isSelected = m.is_best;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50 font-medium'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <span className={`font-medium ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'}`}>
                        {m.model_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        m.model_name.includes('Balanced')
                          ? 'bg-slate-200 text-slate-800 font-medium'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.model_name.includes('Balanced') ? 'balanced' : 'default'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{m.accuracy}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{m.precision}%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">{m.recall}%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-800">{m.f1_score}%</td>
                    <td className="py-2.5 px-4 text-center">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-white">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Confusion Matrix Details */}
      {selectedModel && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Confusion Matrix: {selectedModel.model_name}
              </h3>
              <span className="text-[11px] text-slate-500">Holdout test set classification counts</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-900">
              Recall: {selectedModel.recall}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* 2x2 Matrix */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 max-w-xs mx-auto w-full">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    {selectedModel.confusion_matrix?.[0]?.[0] || 733}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">True Negative</div>
                  <div className="text-[10px] text-slate-400">Stayed & predicted stayed</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-xl font-bold text-slate-700 font-mono">
                    {selectedModel.confusion_matrix?.[0]?.[1] || 302}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">False Positive</div>
                  <div className="text-[10px] text-slate-400">Stayed flagged at-risk</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-xl font-bold text-rose-700 font-mono">
                    {selectedModel.confusion_matrix?.[1]?.[0] || 72}
                  </div>
                  <div className="text-[10px] font-semibold text-rose-700 uppercase mt-0.5">False Negative</div>
                  <div className="text-[10px] text-slate-400">Churned but missed</div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-xl font-bold text-emerald-800 font-mono">
                    {selectedModel.confusion_matrix?.[1]?.[1] || 302}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-800 uppercase mt-0.5">True Positive</div>
                  <div className="text-[10px] text-slate-400">Churned & caught</div>
                </div>
              </div>
            </div>

            {/* Business Objective Explanation */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700">
                <div className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cost Asymmetry in Customer Churn</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  A <strong>False Negative</strong> represents an unaddressed customer departure and lost recurring revenue. A <strong>False Positive</strong> triggers proactive outreach or retention incentives. Because the cost of churn exceeds the cost of outreach, optimizing for Recall delivers superior business return.
                </p>
              </div>

              <div className="text-[11px] text-slate-500">
                Click any row in the comparison table above to inspect its confusion matrix.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
