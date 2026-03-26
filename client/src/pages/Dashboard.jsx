import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import KPIChart from '../components/KPIChart';
import Leaderboard from '../components/Leaderboard';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  Bell,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const ZONE_COLORS = {
  green: '#16a34a',
  yellow: '#ca8a04',
  red: '#dc2626',
};

const statusBadgeStyles = {
  at_risk: 'bg-orange-100 text-orange-700',
  layoff_recommended: 'bg-red-100 text-red-700',
};

// --------------- Admin / Manager Dashboard ---------------

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, leaderboardRes, trendsRes, alertsRes] =
          await Promise.all([
            api.get('/dashboard/summary'),
            api.get('/dashboard/leaderboard'),
            api.get('/dashboard/trends'),
            api.get('/dashboard/alerts'),
          ]);
        setSummary(summaryRes.data);
        setLeaderboard(leaderboardRes.data);
        setTrends(trendsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const zd = summary?.zone_distribution || {};
  const greenCount = zd.green || 0;
  const yellowCount = zd.yellow || 0;
  const redCount = zd.red || 0;

  const pieData = summary
    ? [
        { name: 'Green', value: greenCount, color: ZONE_COLORS.green },
        { name: 'Yellow', value: yellowCount, color: ZONE_COLORS.yellow },
        { name: 'Red', value: redCount, color: ZONE_COLORS.red },
      ]
    : [];

  return (
    <>
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={summary?.total_employees ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Green Zone"
          value={greenCount}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Yellow Zone"
          value={yellowCount}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Red Zone"
          value={redCount}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Row 2: Performance Trend + Zone Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Company Performance Trend
          </h3>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={trends}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="avgScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)}`, 'Avg Score']}
                />
                <Area
                  type="monotone"
                  dataKey="avg_score"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#avgScoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No trend data available" />
          )}
        </div>

        {/* Zone Distribution Pie */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Zone Distribution
          </h3>
          {pieData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No distribution data available" />
          )}
        </div>
      </div>

      {/* Row 3: Leaderboard + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Leaderboard data={leaderboard} />

        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Performance Alerts
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {alert.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {alert.department} &middot; {alert.consecutive_red_count}{' '}
                      consecutive red
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      statusBadgeStyles[alert.status] ||
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {alert.status === 'layoff_recommended'
                      ? 'Layoff Recommended'
                      : 'At Risk'}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No performance alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --------------- Employee Dashboard ---------------

function EmployeeDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.employee_id) return;
      try {
        const res = await api.get(`/employees/${user.employee_id}/history`);
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch employee history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.employee_id]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const latest = history.length > 0 ? history[history.length - 1] : null;

  const zoneColorMap = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const zoneBgMap = {
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
  };

  return (
    <>
      {/* Employee Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500">Current Score</p>
          <p className="text-3xl font-bold text-gray-900">
            {latest?.score ?? '--'}
          </p>
        </div>
        <div
          className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            latest?.zone === 'green'
              ? 'border-green-500'
              : latest?.zone === 'yellow'
              ? 'border-yellow-500'
              : latest?.zone === 'red'
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">Current Zone</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                zoneBgMap[latest?.zone] || 'bg-gray-300'
              }`}
            />
            <p
              className={`text-xl font-bold capitalize ${
                zoneColorMap[latest?.zone] || 'text-gray-500'
              }`}
            >
              {latest?.zone ?? 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Award className="h-4 w-4" /> Incentives
          </p>
          <p className="text-xl font-bold text-gray-900">
            {latest?.incentive != null
              ? `$${Number(latest.incentive).toLocaleString()}`
              : '--'}
          </p>
        </div>
      </div>

      {/* Performance Trend */}
      <KPIChart
        data={history.map((h) => ({
          month: h.month,
          score: h.score,
          zone: h.zone,
        }))}
        title="My Performance Trend"
      />
    </>
  );
}

// --------------- Shared Components ---------------

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">
      {message}
    </div>
  );
}

// --------------- Main Dashboard ---------------

export default function Dashboard() {
  const { isAdminOrManager } = useAuth();

  return (
    <Layout>
      {isAdminOrManager ? <AdminDashboard /> : <EmployeeDashboard />}
    </Layout>
  );
}
