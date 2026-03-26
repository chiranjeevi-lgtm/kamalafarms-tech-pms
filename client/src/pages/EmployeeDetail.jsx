import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import DepartmentBadge from '../components/DepartmentBadge';
import ZoneBadge from '../components/ZoneBadge';
import KPIChart from '../components/KPIChart';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Users,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

const statusStyles = {
  active: 'bg-green-100 text-green-700',
  at_risk: 'bg-orange-100 text-orange-700',
  layoff_recommended: 'bg-red-100 text-red-700',
  recovered: 'bg-blue-100 text-blue-700',
};

const statusLabels = {
  active: 'Active',
  at_risk: 'At Risk',
  layoff_recommended: 'Layoff Recommended',
  recovered: 'Recovered',
};

const zoneScoreColors = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
};

function generateInsights(employee, history) {
  const insights = [];
  if (!history || history.length === 0) {
    insights.push({ type: 'info', message: 'No performance history available yet. Insights will appear once data is recorded.' });
    return insights;
  }

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  if (latest.zone === 'green') {
    insights.push({ type: 'positive', message: `Performing well in the Green zone with a score of ${latest.score}. Keep up the great work!` });
  }

  if (latest.zone === 'red') {
    insights.push({ type: 'warning', message: `Currently in the Red zone. Immediate attention and a performance improvement plan are recommended.` });
  }

  if (previous && latest.score > previous.score) {
    const diff = (latest.score - previous.score).toFixed(1);
    insights.push({ type: 'positive', message: `Score improved by ${diff} points compared to last month.` });
  } else if (previous && latest.score < previous.score) {
    const diff = (previous.score - latest.score).toFixed(1);
    insights.push({ type: 'warning', message: `Score dropped by ${diff} points compared to last month. Consider scheduling a check-in.` });
  }

  const redCount = history.filter((h) => h.zone === 'red').length;
  if (redCount >= 3) {
    insights.push({ type: 'warning', message: `Has been in the Red zone ${redCount} times over the tracked period. Review ongoing support measures.` });
  }

  const recentThree = history.slice(-3);
  if (recentThree.length === 3 && recentThree.every((h) => h.zone === 'green')) {
    insights.push({ type: 'positive', message: 'Consistently in the Green zone for the last 3 months. Consider for recognition or additional responsibilities.' });
  }

  if (insights.length === 0) {
    insights.push({ type: 'info', message: 'Performance is stable. Continue monitoring monthly trends.' });
  }

  return insights;
}

const insightIcons = {
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
  positive: <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />,
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await api.get(`/employees/${id}`);
        setEmployee(res.data);
      } catch (err) {
        console.error('Failed to fetch employee:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-24">
          <p className="text-gray-500">Employee not found.</p>
          <button onClick={() => navigate('/employees')} className="mt-4 text-sm text-indigo-600 hover:underline">
            Back to Employees
          </button>
        </div>
      </Layout>
    );
  }

  const history = employee.performance_history || [];
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const kpiBreakdown = latest?.breakdown || latest?.kpi_breakdown || null;
  const incentives = employee.incentive_history || [];
  const insights = generateInsights(employee, history);

  const chartData = history.map((h) => ({
    month: h.month,
    score: h.score,
    zone: h.zone,
  }));

  return (
    <Layout>
      {/* Back button */}
      <button
        onClick={() => navigate('/employees')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
            <p className="text-gray-500 mt-1">{employee.role_title || employee.role}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <DepartmentBadge department={employee.department} />
              <ZoneBadge zone={employee.current_zone || latest?.zone || 'green'} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              {employee.email}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              {employee.phone || '--'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              Joined {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '--'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              Reports to {employee.manager_name || '--'}
            </div>
          </div>
        </div>
        {/* Salary breakdown */}
        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-gray-100 text-sm">
          <div>
            <span className="text-gray-400">Fixed Salary</span>
            <p className="font-semibold text-gray-800">
              {employee.salary_fixed != null ? `$${Number(employee.salary_fixed).toLocaleString()}` : '--'}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Variable Salary</span>
            <p className="font-semibold text-gray-800">
              {employee.salary_variable != null ? `$${Number(employee.salary_variable).toLocaleString()}` : '--'}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Latest Incentive</span>
            <p className="font-semibold text-gray-800">
              {latest?.incentive != null ? `$${Number(latest.incentive).toLocaleString()}` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Current Score</p>
          <p className={`text-4xl font-bold ${zoneScoreColors[latest?.zone] || 'text-gray-800'}`}>
            {latest?.score ?? '--'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 mb-2">Current Zone</p>
          <ZoneBadge zone={latest?.zone || 'green'} size="lg" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Status</p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusStyles[latest?.status || employee.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {statusLabels[latest?.status || employee.status] || 'Active'}
          </span>
        </div>
      </div>

      {/* Performance History Chart */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <KPIChart data={chartData} title="Performance History" />
        </div>
      )}

      {/* Performance History Table */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Zone</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Incentive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...history].reverse().map((h, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">{h.month}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{h.score}</td>
                    <td className="px-6 py-3"><ZoneBadge zone={h.zone} size="sm" /></td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[h.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[h.status] || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {h.incentive != null ? `$${Number(h.incentive).toLocaleString()}` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Breakdown */}
      {kpiBreakdown && typeof kpiBreakdown === 'object' && Object.keys(kpiBreakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">KPI Breakdown (Current Month)</h3>
          <div className="space-y-4">
            {Object.entries(kpiBreakdown).map(([key, value]) => {
              const numValue = Number(value) || 0;
              const percentage = Math.min(100, Math.max(0, numValue));
              let barColor = 'bg-green-500';
              if (percentage < 50) barColor = 'bg-red-500';
              else if (percentage < 80) barColor = 'bg-yellow-500';

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{numValue}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incentive History */}
      {incentives.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Incentive History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Base Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Multiplier</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Final Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incentives.map((inc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">{inc.month}</td>
                    <td className="px-6 py-3 text-gray-600">${Number(inc.base_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-600">{inc.multiplier ?? '--'}x</td>
                    <td className="px-6 py-3 font-medium text-gray-900">${Number(inc.final_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                        {inc.type || '--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Insights
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {insights.map((insight, idx) => (
            <div key={idx} className="px-6 py-4 flex items-start gap-3">
              {insightIcons[insight.type] || insightIcons.info}
              <p className="text-sm text-gray-700">{insight.message}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
