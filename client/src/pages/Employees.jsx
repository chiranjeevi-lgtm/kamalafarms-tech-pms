import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import DepartmentBadge from '../components/DepartmentBadge';
import ZoneBadge from '../components/ZoneBadge';
import { Plus, Eye, X, Loader2, Users, ChevronLeft, ChevronRight, Edit3, Trash2, Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { DEPARTMENTS as DEPT_LIST, CATEGORIES } from '../config/departments';
const DEPARTMENTS = ['All', ...DEPT_LIST.map(d => d.label)];
const DEPT_VALUES = { All: '', ...Object.fromEntries(DEPT_LIST.map(d => [d.label, d.value])) };
const PAGE_SIZE = 10;

export default function Employees() {
  const { isAdmin, isAdminOrManager } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role_title: '',
    department: 'operations',
    reporting_to: '',
    salary_fixed: '',
    salary_variable: '',
  });

  // Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [department]);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const params = {};
      if (DEPT_VALUES[department]) params.department = DEPT_VALUES[department];
      const res = await api.get('/employees', { params });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchManagers() {
    try {
      const res = await api.get('/employees');
      setManagers(res.data.filter((e) => e.role === 'manager' || e.role === 'admin'));
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  }

  function openModal() {
    fetchManagers();
    setEditingEmployee(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role_title: '',
      department: 'operations',
      reporting_to: '',
      salary_fixed: '',
      salary_variable: '',
    });
    setShowModal(true);
  }

  function openEditModal(emp) {
    fetchManagers();
    setEditingEmployee(emp);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role_title: emp.role_title || '',
      department: emp.department || 'sales',
      reporting_to: emp.reporting_manager_id || '',
      salary_fixed: emp.salary_fixed || '',
      salary_variable: emp.salary_variable || '',
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, {
          name: form.name,
          role_title: form.role_title,
          department: form.department,
          phone: form.phone,
          reporting_manager_id: form.reporting_to || null,
          salary_fixed: form.salary_fixed ? Number(form.salary_fixed) : 0,
          salary_variable: form.salary_variable ? Number(form.salary_variable) : 0,
        });
        toast.success('Employee updated');
      } else {
        await api.post('/employees', {
          ...form,
          salary_fixed: form.salary_fixed ? Number(form.salary_fixed) : 0,
          salary_variable: form.salary_variable ? Number(form.salary_variable) : 0,
          reporting_to: form.reporting_to || null,
        });
        toast.success('Employee created');
      }
      setShowModal(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emp) {
    if (!confirm(`Delete employee "${emp.name}"? This cannot be undone and will remove all their KPIs, reviews, and scores.`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  }

  // Upload functions
  async function handleFilePreview(file) {
    if (!file) return;
    setUploadFile(file);
    setUploading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to parse file');
      setUploadPreview(null);
    } finally { setUploading(false); }
  }

  async function handleImport() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post('/upload/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data);
      toast.success(`${res.data.imported} employees imported!`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally { setUploading(false); }
  }

  async function downloadTemplate() {
    try {
      const res = await api.get('/upload/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_upload_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download template'); }
  }

  const filtered = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowUploadModal(true); setUploadPreview(null); setUploadFile(null); setImportResult(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Upload className="h-4 w-4" />
              Upload Excel / CSV
            </button>
            <button onClick={openModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Users className="h-12 w-12 mb-3" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{emp.name}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{emp.role_title || emp.role}</td>
                      <td className="px-6 py-4"><DepartmentBadge department={emp.department} /></td>
                      <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4"><ZoneBadge zone={emp.current_zone || 'green'} size="sm" /></td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '--'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
                            className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}
                                className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(emp); }}
                                className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingEmployee}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={form.role_title}
                    onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {DEPT_LIST.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                <select
                  value={form.reporting_to}
                  onChange={(e) => setForm({ ...form, reporting_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Select Manager --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Fixed</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salary_fixed}
                    onChange={(e) => setForm({ ...form, salary_fixed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Variable</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salary_variable}
                    onChange={(e) => setForm({ ...form, salary_variable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
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
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bulk Upload Employees</h3>
                  <p className="text-xs text-gray-500">Upload Excel (.xlsx) or CSV file from your CRM</p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Step 1: Download template */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">📋 Download Template</p>
                  <p className="text-xs text-gray-500 mt-1">Use this template to format your data correctly</p>
                </div>
                <button onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                  <Download className="h-4 w-4" /> Download .xlsx
                </button>
              </div>

              {/* Step 2: Upload file */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  {uploadFile ? (
                    <span className="font-medium text-indigo-600">{uploadFile.name}</span>
                  ) : (
                    'Drag & drop or click to select your file'
                  )}
                </p>
                <input type="file" accept=".xlsx,.xls,.csv"
                  onChange={(e) => { if (e.target.files[0]) handleFilePreview(e.target.files[0]); }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ position: 'relative' }}
                />
                <p className="text-xs text-gray-400">Supports .xlsx, .xls, .csv (max 5MB)</p>
              </div>

              {/* Loading */}
              {uploading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                  <span className="text-sm text-gray-600">Processing file...</span>
                </div>
              )}

              {/* Preview */}
              {uploadPreview && !importResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{uploadPreview.total}</p>
                      <p className="text-xs text-blue-600">Total Rows</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{uploadPreview.valid}</p>
                      <p className="text-xs text-green-600">Valid</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{uploadPreview.invalid}</p>
                      <p className="text-xs text-red-600">Invalid</p>
                    </div>
                  </div>

                  {/* Column mapping */}
                  {uploadPreview.unmapped_columns?.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Unmapped columns (ignored):
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">{uploadPreview.unmapped_columns.join(', ')}</p>
                    </div>
                  )}

                  {/* Employee preview table */}
                  <div className="overflow-x-auto max-h-64 rounded-lg border border-gray-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-medium text-gray-500">Row</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Name</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Email</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Dept</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Category</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {uploadPreview.employees?.map((emp, i) => (
                          <tr key={i} className={emp._valid ? '' : 'bg-red-50'}>
                            <td className="px-3 py-2 text-gray-500">{emp._row}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{emp.name || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{emp.email || '—'}</td>
                            <td className="px-3 py-2">
                              {emp.department ? <DepartmentBadge department={emp.department} /> : <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{emp.employee_category}</td>
                            <td className="px-3 py-2">
                              {emp._valid ? (
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> OK</span>
                              ) : (
                                <span className="text-red-600 text-xs">{emp._errors?.join(', ')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className="space-y-3">
                  <div className={`rounded-lg p-4 ${importResult.imported > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" /> Import Complete
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-700">{importResult.imported}</p>
                        <p className="text-xs text-green-600">Imported</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-amber-700">{importResult.skipped}</p>
                        <p className="text-xs text-amber-600">Skipped</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-700">{importResult.total}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-red-800 mb-2">Errors:</p>
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-700">Row {e.row}: {e.name} — {e.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">
                All imported employees get password: <code className="bg-gray-200 px-1 rounded">password123</code>
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
                  {importResult ? 'Done' : 'Cancel'}
                </button>
                {uploadPreview && !importResult && uploadPreview.valid > 0 && (
                  <button onClick={handleImport} disabled={uploading}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Import {uploadPreview.valid} Employees
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
