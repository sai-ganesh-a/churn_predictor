import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';
import RiskBadge, { ChurnBadge } from '../components/RiskBadge';
import { predictSingle } from '../services/api';

const defaultForm = {
  customerID: 'CUST-NEW',
  gender: 'Female',
  SeniorCitizen: '0',
  Partner: 'No',
  Dependents: 'No',
  tenure: 6,
  PhoneService: 'Yes',
  MultipleLines: 'No',
  InternetService: 'Fiber optic',
  OnlineSecurity: 'No',
  OnlineBackup: 'No',
  DeviceProtection: 'No',
  TechSupport: 'No',
  StreamingTV: 'No',
  StreamingMovies: 'No',
  Contract: 'Month-to-month',
  PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check',
  MonthlyCharges: 79.85,
  TotalCharges: 479.10
};

export default function PredictionPage() {
  const [formData, setFormData] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'tenure' || name === 'MonthlyCharges') {
        const tenureNum = Number(name === 'tenure' ? value : updated.tenure) || 0;
        const monthlyNum = Number(name === 'MonthlyCharges' ? value : updated.MonthlyCharges) || 0;
        updated.TotalCharges = (tenureNum * monthlyNum).toFixed(2);
      }
      return updated;
    });
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await predictSingle({
        ...formData,
        tenure: Number(formData.tenure),
        MonthlyCharges: Number(formData.MonthlyCharges),
        TotalCharges: Number(formData.TotalCharges)
      });
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction request failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type) => {
    if (type === 'risk') {
      setFormData({
        customerID: 'CUST-AT-RISK',
        gender: 'Female',
        SeniorCitizen: '0',
        Partner: 'No',
        Dependents: 'No',
        tenure: 2,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'No',
        DeviceProtection: 'No',
        TechSupport: 'No',
        StreamingTV: 'Yes',
        StreamingMovies: 'Yes',
        Contract: 'Month-to-month',
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Electronic check',
        MonthlyCharges: 89.50,
        TotalCharges: 179.00
      });
    } else if (type === 'loyal') {
      setFormData({
        customerID: 'CUST-LOYAL',
        gender: 'Male',
        SeniorCitizen: '0',
        Partner: 'Yes',
        Dependents: 'Yes',
        tenure: 62,
        PhoneService: 'Yes',
        MultipleLines: 'Yes',
        InternetService: 'DSL',
        OnlineSecurity: 'Yes',
        OnlineBackup: 'Yes',
        DeviceProtection: 'Yes',
        TechSupport: 'Yes',
        StreamingTV: 'No',
        StreamingMovies: 'No',
        Contract: 'Two year',
        PaperlessBilling: 'No',
        PaymentMethod: 'Credit card (automatic)',
        MonthlyCharges: 54.20,
        TotalCharges: 3360.40
      });
    } else {
      setFormData(defaultForm);
    }
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Scenario Presets */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Single Customer Prediction
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate individual customer profiles through the trained Decision Tree pipeline.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 text-[11px] hidden md:inline">Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('risk')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors"
          >
            At-Risk Scenario
          </button>
          <button
            type="button"
            onClick={() => loadPreset('loyal')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors"
          >
            Loyal Scenario
          </button>
          <button
            type="button"
            onClick={() => loadPreset('reset')}
            className="p-1 text-slate-400 hover:text-slate-600 rounded border border-slate-200 hover:bg-slate-50"
            title="Reset Form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 2. Customer Attributes Form (2 cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {/* Sub-section 1: Identity & Demographics */}
          <div className="p-5 border-b border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
              Demographics & Identifier
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Customer ID</label>
                <input
                  type="text"
                  name="customerID"
                  value={formData.customerID}
                  onChange={handleChange}
                  className="w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Senior Citizen</label>
                <select name="SeniorCitizen" value={formData.SeniorCitizen} onChange={handleChange} className="w-full">
                  <option value="0">No (Under 65)</option>
                  <option value="1">Yes (Senior Citizen)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Partner</label>
                <select name="Partner" value={formData.Partner} onChange={handleChange} className="w-full">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-section 2: Contract, Tenure & Charges */}
          <div className="p-5 border-b border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
              Contract & Billing
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Contract Type</label>
                <select name="Contract" value={formData.Contract} onChange={handleChange} className="w-full font-medium">
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                <select name="PaymentMethod" value={formData.PaymentMethod} onChange={handleChange} className="w-full">
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Paperless Billing</label>
                <select name="PaperlessBilling" value={formData.PaperlessBilling} onChange={handleChange} className="w-full">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tenure (Months: 0 - 72)</label>
                <input
                  type="number"
                  min="0"
                  max="72"
                  name="tenure"
                  value={formData.tenure}
                  onChange={handleChange}
                  className="w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Monthly Charges ($)</label>
                <input
                  type="number"
                  step="0.05"
                  min="18"
                  max="130"
                  name="MonthlyCharges"
                  value={formData.MonthlyCharges}
                  onChange={handleChange}
                  className="w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Charges ($)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  name="TotalCharges"
                  value={formData.TotalCharges}
                  onChange={handleChange}
                  className="w-full font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sub-section 3: Subscribed Services */}
          <div className="p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
              Subscribed Services
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Internet Service</label>
                <select name="InternetService" value={formData.InternetService} onChange={handleChange} className="w-full">
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">No Internet</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tech Support</label>
                <select name="TechSupport" value={formData.TechSupport} onChange={handleChange} className="w-full">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Online Security</label>
                <select name="OnlineSecurity" value={formData.OnlineSecurity} onChange={handleChange} className="w-full">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Online Backup</label>
                <select name="OnlineBackup" value={formData.OnlineBackup} onChange={handleChange} className="w-full">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Device Protection</label>
                <select name="DeviceProtection" value={formData.DeviceProtection} onChange={handleChange} className="w-full">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone Service</label>
                <select name="PhoneService" value={formData.PhoneService} onChange={handleChange} className="w-full">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors"
            >
              {loading ? 'Evaluating Model...' : 'Calculate Churn Probability'}
            </button>
          </div>
        </form>

        {/* 3. Output Card (1 col) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Evaluation Output
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Decision Tree</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="py-20 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">Awaiting customer submission</p>
                <p className="text-[11px]">Configure customer attributes and click Calculate Churn Probability.</p>
              </div>
            )}

            {loading && (
              <div className="py-20 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Executing model pipeline...</span>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Status Box */}
                <div className={`p-4 rounded border ${
                  result.churn_prediction === 'Yes'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Prediction
                  </span>
                  <div className="text-xl font-bold mt-0.5">
                    {result.churn_prediction === 'Yes' ? 'Likely to Churn' : 'Likely to Stay'}
                  </div>
                  <div className="mt-2">
                    <RiskBadge category={result.risk_category} />
                  </div>
                </div>

                {/* Probability Meter */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700 font-medium">
                    <span>Attrition Probability:</span>
                    <span className="font-mono text-slate-900 text-sm font-bold">
                      {result.churn_probability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        result.risk_category === 'High'
                          ? 'bg-rose-600'
                          : result.risk_category === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, result.churn_probability)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0%</span>
                    <span>35% (Medium)</span>
                    <span>65% (High)</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Factors */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800 text-[11px] uppercase block mb-1">
                    Contributing Factors
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-start space-x-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Statistical risk model estimate for decision support. Not a guaranteed outcome.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
