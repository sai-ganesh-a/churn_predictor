import React, { useState, useEffect } from 'react';
import {
  Users,
  UserX,
  UserCheck,
  TrendingDown,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  CreditCard
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge, { ChurnBadge } from '../components/RiskBadge';
import {
  getAnalyticsOverview,
  getChurnDistribution,
  getChurnFactors,
  getPredictions
} from '../services/api';

const ATTRITION_COLORS = ['#0f766e', '#e11d48']; // Teal (Retained), Rose (Churned)

export default function DashboardPage({ setActivePage }) {
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [factors, setFactors] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ovData, distData, factorData, predData] = await Promise.all([
          getAnalyticsOverview(),
          getChurnDistribution(),
          getChurnFactors(),
          getPredictions(1, 6)
        ]);

        setOverview(ovData);
        setDistribution(distData.distribution || []);
        setFactors(factorData);
        setRecentPredictions(predData.predictions || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to fetch analytics from backend API. Ensure Flask server is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 text-xs">
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total customer records"
          value={overview?.total_customers !== undefined ? overview.total_customers.toLocaleString() : '—'}
          subtitle="Total number of customers in the currently loaded dataset."
          icon={Users}
        />
        <StatCard
          title="Retained customers"
          value={overview?.retained_customers !== undefined ? overview.retained_customers.toLocaleString() : '—'}
          subtitle="Customers whose Churn value is No."
          icon={UserCheck}
          trend={overview?.total_customers ? { text: `${(((overview.retained_customers || 0) / overview.total_customers) * 100).toFixed(1)}%`, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' } : undefined}
        />
        <StatCard
          title="Churned customers"
          value={overview?.churned_customers !== undefined ? overview.churned_customers.toLocaleString() : '—'}
          subtitle="Customers whose Churn value is Yes."
          icon={UserX}
          trend={overview?.total_customers ? { text: `${overview.churn_rate}%`, color: 'bg-rose-50 text-rose-700 border border-rose-200' } : undefined}
        />
        <StatCard
          title="Churn rate in current dataset"
          value={overview?.churn_rate !== undefined ? `${overview.churn_rate}%` : '—'}
          subtitle="Percentage of customers marked as churned in the currently loaded dataset."
          icon={TrendingDown}
        />
      </div>

      {/* 2. Charts Row: Distribution & Churn by Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overall Churn Donut */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Attrition Proportion
            </h3>
            <span className="text-[11px] text-slate-500">Retained vs. departed accounts</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ATTRITION_COLORS[index % ATTRITION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} accounts`, 'Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value, entry, index) => (
                    <span className="text-xs text-slate-600">
                      {value} ({((distribution[index]?.value / (overview?.total_customers || 1)) * 100).toFixed(1)}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Contract Type (Span 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Churn Rate by Contract Agreement
              </h3>
              <span className="text-[11px] text-slate-500">Month-to-month contracts exhibit highest attrition</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">3 Contract Types</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factors?.by_contract || []}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="contract" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'churn_rate' ? `${val}%` : val,
                    name === 'churn_rate' ? 'Churn Rate' : name
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="churn_rate" fill="#0f172a" radius={[2, 2, 0, 0]} name="Churn Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Charts Row 2: Tenure Cohort & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tenure Cohort */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Churn by Tenure Bracket
              </h3>
              <span className="text-[11px] text-slate-500">Attrition risk declines sharply with account age</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factors?.by_tenure || []}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tenure_group" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="churn_rate" fill="#334155" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Churn by Payment Channel
              </h3>
              <span className="text-[11px] text-slate-500">Manual payment channels correlate with higher attrition</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={factors?.by_payment_method || []}
                margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="payment_method" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={115} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="churn_rate" fill="#475569" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Recent Evaluated Accounts */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Recent Predictions
            </h3>
            <span className="text-[11px] text-slate-500">Evaluated accounts from SQLite history</span>
          </div>
          <button
            onClick={() => setActivePage('high-risk')}
            className="inline-flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <span>Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPredictions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No predictions stored in history yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Customer ID</th>
                  <th className="py-2.5 px-4">Model</th>
                  <th className="py-2.5 px-4 text-right">Probability</th>
                  <th className="py-2.5 px-4">Risk Category</th>
                  <th className="py-2.5 px-4">Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      {pred.customer_identifier}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {pred.model_name}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                      {pred.churn_probability}%
                    </td>
                    <td className="py-2.5 px-4">
                      <RiskBadge category={pred.risk_category} />
                    </td>
                    <td className="py-2.5 px-4">
                      <ChurnBadge prediction={pred.churn_prediction} />
                    </td>
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
