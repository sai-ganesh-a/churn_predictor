import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import RiskBadge, { ChurnBadge } from '../components/RiskBadge';
import { getPredictions, predictBatch } from '../services/api';

export default function HighRiskPage() {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [riskFilter, setRiskFilter] = useState('High');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const data = await getPredictions(currentPage, perPage, riskFilter, search);
      setPredictions(data.predictions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [currentPage, perPage, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPredictions();
  };

  const handleBatchScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await predictBatch();
      setScanMessage(
        `Batch scan completed: ${res.total_predicted} accounts evaluated (${res.high_risk_count} High-Risk flagged).`
      );
      await fetchPredictions();
    } catch (err) {
      console.error('Batch scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            High-Risk Customer Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accounts with evaluated attrition probability exceeding risk threshold ($P \ge 65\%$).
          </p>
        </div>

        <button
          onClick={handleBatchScan}
          disabled={scanning}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-60"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Evaluating Dataset...' : 'Run Batch Evaluation'}</span>
        </button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-slate-100 border border-slate-300 rounded text-xs text-slate-800 flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-slate-600 hover:text-slate-900 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Risk Filter Segmented Control */}
        <div className="flex items-center space-x-1 w-full md:w-auto bg-slate-100 p-1 rounded-md">
          {['High', 'Medium', 'Low', 'All'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setRiskFilter(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                riskFilter === cat
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'All' ? 'All Accounts' : `${cat} Risk`}
            </button>
          ))}
        </div>

        {/* Search & Page Size */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs"
            />
          </form>

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="py-1 px-2.5 text-xs"
          >
            <option value={15}>15 rows</option>
            <option value={30}>30 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* 3. Accounts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono text-[11px]">
          <span>
            Showing <strong className="text-slate-800">{predictions.length}</strong> of{' '}
            <strong className="text-slate-800">{total.toLocaleString()}</strong> accounts
          </span>
          <span className="text-slate-500">
            Active Filter: <span className="font-semibold text-slate-700">{riskFilter}</span>
          </span>
        </div>

        {loading ? (
          <div className="py-14 text-center text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading records...</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">No matching accounts found</p>
            <p className="text-[11px]">Try adjusting your search criteria or running a batch evaluation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Customer ID</th>
                  <th className="py-2.5 px-4">Tenure</th>
                  <th className="py-2.5 px-4">Contract</th>
                  <th className="py-2.5 px-4 text-right">Monthly Fee</th>
                  <th className="py-2.5 px-4 text-right">Total Charges</th>
                  <th className="py-2.5 px-4">Attrition Probability</th>
                  <th className="py-2.5 px-4">Risk Level</th>
                  <th className="py-2.5 px-4 text-center">Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {predictions.map((p) => {
                  const isHigh = p.risk_category === 'High';
                  const input = p.input_data || {};
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHigh ? 'bg-rose-50/15' : ''
                      }`}
                    >
                      <td className="py-2 px-4 font-mono font-medium text-slate-900">
                        {p.customer_identifier}
                      </td>
                      <td className="py-2 px-4 text-slate-700 font-mono">
                        {input.tenure !== undefined ? `${input.tenure}m` : '—'}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          input.contract === 'Month-to-month'
                            ? 'bg-slate-200 text-slate-800 font-medium'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {input.contract || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right text-slate-700 font-mono">
                        {input.monthly_charges !== undefined ? `$${input.monthly_charges.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500 font-mono">
                        {input.total_charges !== undefined ? `$${input.total_charges.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-4 font-mono font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span className="w-11">{p.churn_probability}%</span>
                          <div className="w-14 bg-slate-100 h-1.5 rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                isHigh ? 'bg-rose-600' : p.risk_category === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, p.churn_probability)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <RiskBadge category={p.risk_category} />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <ChurnBadge prediction={p.churn_prediction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50">
            <span className="font-mono text-[11px]">
              Page <strong>{currentPage}</strong> of <strong>{pages}</strong>
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
                disabled={currentPage === pages}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
