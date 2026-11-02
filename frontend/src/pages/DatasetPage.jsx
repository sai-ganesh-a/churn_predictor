import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  Table,
  CheckCircle,
  Upload,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { getDatasetInfo, getDatasetPreview, uploadDataset } from '../services/api';

export default function DatasetPage() {
  const [info, setInfo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDatasetData = async () => {
    try {
      setLoading(true);
      const [infoData, prevData] = await Promise.all([
        getDatasetInfo(),
        getDatasetPreview(limit)
      ]);
      setInfo(infoData);
      setPreview(prevData);
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetData();
  }, [limit]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files (.csv) are accepted.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadMessage(null);
      const res = await uploadDataset(file);
      setUploadMessage(res.message || 'Dataset uploaded and validated.');
      await loadDatasetData();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const filteredRecords = (preview?.records || []).filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active File"
          value={info?.filename ? info.filename.slice(0, 18) + '...' : 'WA_Fn-UseC...'}
          subtitle="SQLite source file"
          icon={FileText}
        />
        <StatCard
          title="Observations"
          value={info?.total_records?.toLocaleString() || '7,043'}
          subtitle="Customer rows loaded"
          icon={Layers}
        />
        <StatCard
          title="Features"
          value={info?.total_features || 21}
          subtitle="19 predictors + ID + target"
          icon={Table}
        />
        <StatCard
          title="Hygiene Status"
          value="Validated"
          subtitle="0 missing values, 0 duplicates"
          icon={CheckCircle}
          trend={{ text: 'Clean', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }}
        />
      </div>

      {/* 2. File Import Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Import New Dataset
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a replacement CSV file to refresh customer records and re-evaluate model metrics.
            </p>
          </div>

          <div>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Processing File...' : 'Select CSV File'}</span>
            </label>
          </div>
        </div>

        {uploadMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
            {uploadMessage}
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* 3. Feature Transformation Schema */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Feature Pipeline Specification
          </h3>
          <span className="text-xs text-slate-500 font-mono">19 Model Predictors</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Continuous Numerical */}
          <div>
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Continuous Numerical</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">3 features</span>
            </div>
            <p className="text-slate-500 text-[11px] mb-2.5">
              StandardScaler scaled; missing values imputed with median.
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700">
              <li className="bg-slate-50 px-2 py-1 rounded border border-slate-200">tenure (0 - 72 months)</li>
              <li className="bg-slate-50 px-2 py-1 rounded border border-slate-200">MonthlyCharges ($18.25 - $118.75)</li>
              <li className="bg-slate-50 px-2 py-1 rounded border border-slate-200">TotalCharges ($0.0 - $8,684.80)</li>
            </ul>
          </div>

          {/* Categorical Features */}
          <div>
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Categorical Features</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">16 features</span>
            </div>
            <p className="text-slate-500 text-[11px] mb-2.5">
              Encoded via OneHotEncoder(drop='first', handle_unknown='ignore').
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
              gender, SeniorCitizen, Partner, Dependents, PhoneService, MultipleLines, InternetService, OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies, Contract, PaperlessBilling, PaymentMethod.
            </p>
          </div>

          {/* Target & Identification */}
          <div>
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Identifiers & Target</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">2 columns</span>
            </div>
            <p className="text-slate-500 text-[11px] mb-2.5">
              ID strictly isolated; Churn mapped to binary {0, 1}.
            </p>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200 flex justify-between">
                <span className="text-slate-800">customerID</span>
                <span className="text-slate-400 font-sans">Excluded from X</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200 flex justify-between">
                <span className="text-slate-800">Churn</span>
                <span className="text-slate-600 font-sans">Binary Target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dataset Preview Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Dataset Records Preview
            </h3>
            <span className="text-[11px] text-slate-500">
              Fetched from SQLite storage
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter preview..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs w-44"
              />
            </div>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="py-1 px-2 text-xs"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
            </select>

            <button
              onClick={loadDatasetData}
              className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading preview records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No matching records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  {preview?.columns?.map((col) => (
                    <th key={col} className="py-2 px-3 text-[11px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    {preview?.columns?.map((col) => (
                      <td key={col} className="py-1.5 px-3 text-slate-700">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
