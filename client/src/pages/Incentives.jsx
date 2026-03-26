import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import ZoneBadge from '../components/ZoneBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import {
  DollarSign,
  TrendingUp,
  Calculator,
  AlertCircle,
  Loader2,
  BarChart3,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (amount) => {
  const num = Number(amount || 0);
  return '\u20b9' + num.toLocaleString('en-IN');
};

// --------------- Admin/Manager Incentives ---------------

function AdminIncentives() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [incentives, setIncentives] = useState([]);
  const [increments, setIncrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('final_amount');
  const [sortDir, setSortDir] = useState('desc');
  const [activeTab, setActiveTab] = useState('incentives');
  const [calculatingIncrements, setCalculatingIncrements] = useState(false);

  useEffect(() => {
    fetchIncentives();
  }, [month, year]);

  const fetchIncentives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incentives', { params: { month, year } });
      setIncentives(res.data);
    } catch {
      setIncentives([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateIncrements = async () => {
    setCalculatingIncrements(true);
    try {
      const res = await api.post('/incentives/calculate-increments', { year });
      setIncrements(res.data);
      setActiveTab('increments');
      toast.success('Increments calculated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate increments');
    } finally {
      setCalculatingIncrements(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sortedIncentives = [...incentives].sort((a, b) => {
    const aVal = Number(a[sortBy] || 0);
    const bVal = Number(b[sortBy] || 0);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Summary stats
  const totalIncentives = incentives.reduce((sum, i) => sum + Number(i.final_amount || i.amount || 0), 0);
  const avgIncentive = incentives.length > 0 ? totalIncentives / incentives.length : 0;
  const highest = incentives.length > 0
    ? incentives.reduce((max, i) =>
        Number(i.final_amount || i.amount || 0) > Number(max.final_amount || max.amount || 0) ? i : max,
        incentives[0]
      )
    : null;

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="block w-40 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="block w-28 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-500">Total Incentives Paid</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatINR(totalIncentives)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <p className="text-sm text-gray-500">Average Incentive</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatINR(avgIncentive)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-gray-500">Highest Incentive</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {highest ? formatINR(highest.final_amount || highest.amount) : '\u20b90'}
          </p>
          {highest && (
            <p className="text-xs text-gray-400 mt-1">
              {highest.employee_name || highest.name}
            </p>
          )}
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('incentives')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'incentives'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Monthly Incentives
        </button>
        <button
          onClick={() => setActiveTab('increments')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'increments'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Salary Increments
        </button>
      </div>

      {activeTab === 'incentives' ? (
        /* Incentives Table */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Incentives - {MONTHS[month - 1]} {year}
            </h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : sortedIncentives.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('final_amount')}
                    >
                      Final Amount {sortBy === 'final_amount' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedIncentives.map((inc, idx) => (
                    <tr key={inc.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inc.employee_name || inc.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DepartmentBadge department={inc.department} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatINR(inc.base_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {Number(inc.multiplier || 1).toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatINR(inc.final_amount || inc.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {inc.type || 'performance'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ZoneBadge zone={inc.zone} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No incentives for this month</p>
            </div>
          )}
        </div>
      ) : (
        /* Increments Section */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Quarterly Salary Increments - {year}
            </h3>
            <button
              onClick={handleCalculateIncrements}
              disabled={calculatingIncrements}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {calculatingIncrements ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Calculate Increments
            </button>
          </div>
          {increments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Increment %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fast Track</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {increments.map((inc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inc.employee_name || inc.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        Q{inc.quarter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {Number(inc.avg_score || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {Number(inc.increment_percentage || 0).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatINR(inc.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inc.applied ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <Check className="h-4 w-4" /> Yes
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inc.fast_track ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <TrendingUp className="h-3 w-3" /> Fast Track
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No increment data</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Calculate Increments" to generate quarterly increment data
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// --------------- Employee Incentives ---------------

function EmployeeIncentives() {
  const { user } = useAuth();
  const [incentives, setIncentives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee_id) return;
    const fetchIncentives = async () => {
      try {
        const res = await api.get('/incentives', {
          params: { employee_id: user.employee_id },
        });
        setIncentives(res.data);
      } catch {
        setIncentives([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncentives();
  }, [user?.employee_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentIncentive = incentives.find(
    (i) => i.month === currentMonth && i.year === currentYear
  );

  const chartData = incentives.map((i) => ({
    month: `${MONTHS[(i.month || 1) - 1]?.slice(0, 3)} ${i.year}`,
    amount: Number(i.final_amount || i.amount || 0),
  }));

  return (
    <>
      {/* Current Month Incentive */}
      <div
        className={`rounded-xl shadow-sm p-6 mb-6 border-2 ${
          currentIncentive
            ? 'bg-green-50 border-green-300'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Current Month Incentive
          </h3>
        </div>
        {currentIncentive ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatINR(currentIncentive.final_amount || currentIncentive.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Zone</p>
              <ZoneBadge zone={currentIncentive.zone} size="lg" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-lg font-semibold text-gray-700 capitalize">
                {currentIncentive.type || 'Performance'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            No incentive data for the current month yet
          </p>
        )}
      </div>

      {/* Incentive Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Incentive Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(v) => `\u20b9${v.toLocaleString('en-IN')}`}
              />
              <Tooltip
                formatter={(value) => [formatINR(value), 'Incentive']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Incentive History */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Incentive History</h3>
        </div>
        {incentives.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {incentives.map((inc, idx) => (
              <div
                key={inc.id || idx}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {MONTHS[(inc.month || 1) - 1]} {inc.year}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <ZoneBadge zone={inc.zone} size="sm" />
                    <span className="text-xs text-gray-400 capitalize">
                      {inc.type || 'performance'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatINR(inc.final_amount || inc.amount)}
                  </p>
                  {inc.multiplier && (
                    <p className="text-xs text-gray-400">
                      {Number(inc.multiplier).toFixed(2)}x multiplier
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No incentive history available</p>
          </div>
        )}
      </div>
    </>
  );
}

// --------------- Main Export ---------------

export default function Incentives() {
  const { isAdminOrManager } = useAuth();

  return (
    <Layout>
      {isAdminOrManager ? <AdminIncentives /> : <EmployeeIncentives />}
    </Layout>
  );
}
