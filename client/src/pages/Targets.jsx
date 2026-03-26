import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import DepartmentBadge from '../components/DepartmentBadge';
import {
  Plus,
  Edit,
  Check,
  X,
  Target,
  Calendar,
  Loader2,
} from 'lucide-react';

const TARGET_TYPES = [
  { value: 'revenue_target', label: 'Revenue Target' },
  { value: 'leads_target', label: 'Leads Target' },
  { value: 'yield_target', label: 'Yield Target' },
  { value: 'installation_target', label: 'Installation Target' },
  { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
  { value: 'project_completion', label: 'Project Completion' },
];

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

export default function Targets() {
  const { user, isAdmin, isManager, isAdminOrManager } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({
    employee_id: '',
    target_type: 'revenue_target',
    target_value: '',
    notes: '',
  });

  // Employee self-declare form
  const [selfForm, setSelfForm] = useState({
    target_type: 'revenue_target',
    target_value: '',
    notes: '',
  });
  const [selfSaving, setSelfSaving] = useState(false);

  useEffect(() => {
    fetchTargets();
    if (isAdminOrManager) fetchEmployees();
  }, [month, year]);

  async function fetchTargets() {
    setLoading(true);
    try {
      const res = await api.get('/targets', { params: { month, year } });
      setTargets(res.data);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }

  function openAssignModal(target = null) {
    if (target) {
      setEditTarget(target);
      setForm({
        employee_id: target.employee_id || '',
        target_type: target.target_type || 'revenue_target',
        target_value: target.target_value || '',
        notes: target.notes || '',
      });
    } else {
      setEditTarget(null);
      setForm({
        employee_id: '',
        target_type: 'revenue_target',
        target_value: '',
        notes: '',
      });
    }
    setShowModal(true);
  }

  async function handleSaveTarget(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        target_value: Number(form.target_value),
        month,
        year,
      };
      if (editTarget) {
        await api.put(`/targets/${editTarget.id}`, payload);
      } else {
        await api.post('/targets', payload);
      }
      setShowModal(false);
      fetchTargets();
    } catch (err) {
      console.error('Failed to save target:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(targetId) {
    try {
      await api.put(`/targets/${targetId}`, { status: 'approved' });
      fetchTargets();
    } catch (err) {
      console.error('Failed to approve target:', err);
    }
  }

  async function handleReject(targetId) {
    try {
      await api.put(`/targets/${targetId}`, { status: 'rejected' });
      fetchTargets();
    } catch (err) {
      console.error('Failed to reject target:', err);
    }
  }

  async function handleSelfDeclare(e) {
    e.preventDefault();
    setSelfSaving(true);
    try {
      await api.post('/targets', {
        employee_id: user.employee_id,
        target_type: selfForm.target_type,
        target_value: Number(selfForm.target_value),
        notes: selfForm.notes,
        month,
        year,
        status: 'pending',
      });
      setSelfForm({ target_type: 'revenue_target', target_value: '', notes: '' });
      fetchTargets();
    } catch (err) {
      console.error('Failed to submit target:', err);
    } finally {
      setSelfSaving(false);
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="h-6 w-6 text-green-600" />
          Targets
        </h2>
        {isAdminOrManager && (
          <button
            onClick={() => openAssignModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Assign Target
          </button>
        )}
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-5 w-5 text-gray-400" />
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {getYearOptions().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Admin/Manager View */}
      {isAdminOrManager ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Target className="h-12 w-12 mb-3" />
              <p className="text-sm">No targets found for {MONTHS[month - 1]} {year}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Target Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Target Value</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {targets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{t.employee_name || t.employee_id}</td>
                      <td className="px-6 py-4">
                        {t.department ? <DepartmentBadge department={t.department} /> : '--'}
                      </td>
                      <td className="px-6 py-4 text-gray-700 capitalize whitespace-nowrap">
                        {(t.target_type || '').replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{Number(t.target_value).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[t.status] || 'bg-gray-100 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(t.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                title="Approve"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(t.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                title="Reject"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openAssignModal(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Employee View */
        <div className="space-y-6">
          {/* Self-declare form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit a Target</h3>
            <form onSubmit={handleSelfDeclare} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                  <select
                    value={selfForm.target_type}
                    onChange={(e) => setSelfForm({ ...selfForm, target_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {TARGET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={selfForm.target_value}
                    onChange={(e) => setSelfForm({ ...selfForm, target_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={selfForm.notes}
                  onChange={(e) => setSelfForm({ ...selfForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Optional notes about this target..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={selfSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {selfSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Target
                </button>
              </div>
            </form>
          </div>

          {/* Employee targets list */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">My Targets</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : targets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Target className="h-12 w-12 mb-3" />
                <p className="text-sm">No targets for {MONTHS[month - 1]} {year}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Target Type</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Target Value</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {targets.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700 capitalize whitespace-nowrap">
                          {(t.target_type || '').replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{Number(t.target_value).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[t.status] || 'bg-gray-100 text-gray-600'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{t.notes || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign/Edit Target Modal (Admin/Manager) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editTarget ? 'Edit Target' : 'Assign Target'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTarget} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  required
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                <select
                  value={form.target_type}
                  onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {TARGET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editTarget ? 'Update Target' : 'Assign Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
