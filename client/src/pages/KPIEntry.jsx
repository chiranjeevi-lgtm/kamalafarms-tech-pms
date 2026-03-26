import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import ZoneBadge from '../components/ZoneBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import {
  BarChart3,
  Calculator,
  Save,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEPARTMENT_FIELDS = {
  sales: {
    label: 'Sales',
    sections: [
      {
        title: 'Lead Management',
        fields: [
          { key: 'leads_assigned', label: 'Leads Assigned' },
          { key: 'leads_contacted', label: 'Leads Contacted' },
          { key: 'site_visits', label: 'Site Visits' },
        ],
      },
      {
        title: 'Revenue',
        fields: [
          { key: 'deals_closed', label: 'Deals Closed' },
          { key: 'revenue_generated', label: 'Revenue Generated' },
          { key: 'revenue_target', label: 'Revenue Target' },
        ],
      },
      {
        title: 'Efficiency',
        fields: [
          { key: 'collection_efficiency', label: 'Collection Efficiency (%)' },
          { key: 'crm_updates', label: 'CRM Updates (%)' },
        ],
      },
    ],
  },
  farm_ops: {
    label: 'Farm Ops',
    sections: [
      {
        title: 'Yield & Cost',
        fields: [
          { key: 'yield_achieved', label: 'Yield Achieved (kg)' },
          { key: 'target_yield', label: 'Target Yield (kg)' },
          { key: 'input_cost', label: 'Input Cost (\u20b9)' },
          { key: 'budget_cost', label: 'Budget Cost (\u20b9)' },
        ],
      },
      {
        title: 'Quality & Efficiency',
        fields: [
          { key: 'contamination_incidents', label: 'Contamination Incidents' },
          { key: 'max_allowed_contamination', label: 'Max Allowed Contamination' },
          { key: 'harvest_efficiency', label: 'Harvest Efficiency (%)' },
          { key: 'downtime_hours', label: 'Downtime Hours' },
          { key: 'max_allowed_downtime', label: 'Max Allowed Downtime' },
        ],
      },
    ],
  },
  technical: {
    label: 'Technical',
    sections: [
      {
        title: 'Installations & Tickets',
        fields: [
          { key: 'installations_completed', label: 'Installations Completed' },
          { key: 'target_installations', label: 'Target Installations' },
          { key: 'tickets_resolved', label: 'Tickets Resolved' },
          { key: 'total_tickets', label: 'Total Tickets' },
        ],
      },
      {
        title: 'Performance',
        fields: [
          { key: 'avg_resolution_time', label: 'Avg Resolution Time (hrs)' },
          { key: 'target_resolution_time', label: 'Target Resolution Time (hrs)' },
          { key: 'csat_score', label: 'CSAT Score (%)' },
          { key: 'system_uptime', label: 'System Uptime (%)' },
        ],
      },
    ],
  },
  marketing: {
    label: 'Marketing',
    sections: [
      {
        title: 'Lead Generation',
        fields: [
          { key: 'leads_generated', label: 'Leads Generated' },
          { key: 'target_leads', label: 'Target Leads' },
          { key: 'cost_per_lead', label: 'Cost per Lead (\u20b9)' },
          { key: 'target_cpl', label: 'Target CPL (\u20b9)' },
        ],
      },
      {
        title: 'Performance',
        fields: [
          { key: 'roi', label: 'ROI (%)' },
          { key: 'content_output_score', label: 'Content Output Score' },
          { key: 'engagement_rate', label: 'Engagement Rate (%)' },
        ],
      },
    ],
  },
};

function getDefaultMetrics(department) {
  const config = DEPARTMENT_FIELDS[department];
  if (!config) return {};
  const metrics = {};
  config.sections.forEach((section) => {
    section.fields.forEach((field) => {
      metrics[field.key] = '';
    });
  });
  return metrics;
}

// --------------- Admin/Manager KPI Entry ---------------

function AdminKPIEntry() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [metrics, setMetrics] = useState({});
  const [entries, setEntries] = useState([]);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewBreakdown, setViewBreakdown] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [month, year]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kpi/entries', { params: { month, year } });
      setEntries(res.data);
    } catch {
      // entries might not exist yet
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (empId) => {
    setSelectedEmployee(empId);
    setResult(null);
    if (empId) {
      const emp = employees.find((e) => e.id === parseInt(empId));
      if (emp) {
        setSelectedDepartment(emp.department);
        setMetrics(getDefaultMetrics(emp.department));
      }
    } else {
      setSelectedDepartment('');
      setMetrics({});
    }
  };

  const handleMetricChange = (key, value) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(selectedEmployee),
        month,
        year,
        metrics: Object.fromEntries(
          Object.entries(metrics).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
        ),
      };
      const res = await api.post('/kpi/entries', payload);
      setResult(res.data);
      toast.success('KPI entry saved successfully');
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save KPI entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setCalculating(true);
    try {
      const payload = {
        employee_id: parseInt(selectedEmployee),
        department: selectedDepartment,
        metrics: Object.fromEntries(
          Object.entries(metrics).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
        ),
      };
      const res = await api.post('/kpi/calculate', payload);
      setResult(res.data);
      toast.success('Score calculated (not saved)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate score');
    } finally {
      setCalculating(false);
    }
  };

  // Group employees by department
  const grouped = employees.reduce((acc, emp) => {
    const dept = emp.department || 'other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  const deptConfig = DEPARTMENT_FIELDS[selectedDepartment];

  return (
    <>
      {/* Month/Year Selector */}
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
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              <option value="">Select Employee...</option>
              {Object.entries(grouped).map(([dept, emps]) => (
                <optgroup key={dept} label={DEPARTMENT_FIELDS[dept]?.label || dept}>
                  {emps.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Form */}
      {deptConfig && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            {deptConfig.label} KPI Metrics
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Enter performance metrics for {MONTHS[month - 1]} {year}
          </p>

          {deptConfig.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                {section.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={metrics[field.key] ?? ''}
                      onChange={(e) => handleMetricChange(field.key, e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      placeholder="0"
                      step="any"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting ? 'Saving...' : 'Submit Entry'}
            </button>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {calculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {calculating ? 'Calculating...' : 'Calculate Score'}
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div
          className={`rounded-xl shadow-sm p-6 mb-6 border-2 ${
            result.zone === 'green'
              ? 'bg-green-50 border-green-300'
              : result.zone === 'yellow'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Check className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Score Result</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">KPI Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {Number(result.score).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Zone</p>
              <ZoneBadge zone={result.zone} size="lg" />
            </div>
            {result.incentive != null && (
              <div>
                <p className="text-sm text-gray-500">Incentive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {'\u20b9'}{Number(result.incentive).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            KPI Entries - {MONTHS[month - 1]} {year}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.employee_name || entry.name || `Employee #${entry.employee_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DepartmentBadge department={entry.department} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(entry.score).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ZoneBadge zone={entry.zone} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setViewBreakdown(viewBreakdown === entry.id ? null : entry.id)}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        {viewBreakdown === entry.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No KPI entries for this month</p>
          </div>
        )}
      </div>

      {/* Breakdown Modal */}
      {viewBreakdown && (
        <BreakdownCard
          entry={entries.find((e) => e.id === viewBreakdown)}
          onClose={() => setViewBreakdown(null)}
        />
      )}
    </>
  );
}

// --------------- Employee KPI View ---------------

function EmployeeKPIView() {
  const { user } = useAuth();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee_id) return;
    const fetchEntry = async () => {
      try {
        const res = await api.get('/kpi/entries', {
          params: { month, year, employee_id: user.employee_id },
        });
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setEntry(data || null);
      } catch {
        setEntry(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [user?.employee_id, month, year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          My KPI - {MONTHS[month - 1]} {year}
        </h3>
        <p className="text-sm text-gray-500 mb-4">Your performance metrics for the current month</p>

        {entry ? (
          <>
            <div
              className={`rounded-xl p-6 border-2 ${
                entry.zone === 'green'
                  ? 'bg-green-50 border-green-300'
                  : entry.zone === 'yellow'
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">KPI Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Number(entry.score).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Zone</p>
                  <ZoneBadge zone={entry.zone} size="lg" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {entry.finalized ? 'Finalized' : 'In Progress'}
                  </p>
                </div>
              </div>
            </div>

            {entry.metrics && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Metric Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(entry.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No KPI entry found for this month</p>
            <p className="text-xs text-gray-400 mt-1">
              Your manager will enter your KPI data
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// --------------- Breakdown Card ---------------

function BreakdownCard({ entry, onClose }) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">KPI Breakdown</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="font-semibold text-gray-900">
                {entry.employee_name || entry.name}
              </p>
              <DepartmentBadge department={entry.department} />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-2xl font-bold">{Number(entry.score).toFixed(1)}</p>
            </div>
            <ZoneBadge zone={entry.zone} size="lg" />
          </div>
          {entry.metrics && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(entry.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------- Main Export ---------------

export default function KPIEntry() {
  const { isAdminOrManager } = useAuth();

  return (
    <Layout>
      {isAdminOrManager ? <AdminKPIEntry /> : <EmployeeKPIView />}
    </Layout>
  );
}
