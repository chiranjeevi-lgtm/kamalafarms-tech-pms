import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import DepartmentBadge from '../components/DepartmentBadge';
import { DEPARTMENTS, DEPT_LABELS } from '../config/departments';
import {
  Star,
  Plus,
  X,
  Loader2,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  User,
  FileText,
  Send,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Department-specific grading parameters ──
const COMMON_PARAMS = ['attendance', 'punctuality', 'teamwork', 'communication', 'discipline'];

const DEPT_SPECIFIC_PARAMS = {
  operations: ['process_management', 'resource_optimization', 'quality_control', 'logistics_planning', 'vendor_management'],
  farm_execution: ['planting_execution', 'irrigation_management', 'harvest_efficiency', 'equipment_handling', 'safety_compliance'],
  farm_agronomy: ['crop_knowledge', 'soil_analysis', 'pest_management', 'yield_optimization', 'research_application'],
  hr_admin: ['recruitment_efficiency', 'policy_compliance', 'employee_relations', 'documentation', 'payroll_accuracy'],
  field_sales: ['lead_conversion', 'client_visits', 'revenue_achievement', 'negotiation_skills', 'territory_coverage'],
  inhouse_sales: ['call_handling', 'lead_followup', 'crm_management', 'upselling', 'customer_retention'],
  marketing: ['campaign_execution', 'content_quality', 'analytics_skills', 'brand_consistency', 'roi_achievement'],
  computer_engineering: ['coding_quality', 'system_architecture', 'bug_resolution', 'documentation', 'innovation'],
  research_development: ['research_depth', 'experiment_design', 'data_analysis', 'publication_output', 'innovation'],
};

const PARAM_LABELS = {
  attendance: 'Attendance', punctuality: 'Punctuality', teamwork: 'Teamwork',
  communication: 'Communication', discipline: 'Discipline',
  process_management: 'Process Management', resource_optimization: 'Resource Optimization',
  quality_control: 'Quality Control', logistics_planning: 'Logistics Planning', vendor_management: 'Vendor Management',
  planting_execution: 'Planting Execution', irrigation_management: 'Irrigation Management',
  harvest_efficiency: 'Harvest Efficiency', equipment_handling: 'Equipment Handling', safety_compliance: 'Safety Compliance',
  crop_knowledge: 'Crop Knowledge', soil_analysis: 'Soil Analysis',
  pest_management: 'Pest Management', yield_optimization: 'Yield Optimization', research_application: 'Research Application',
  recruitment_efficiency: 'Recruitment Efficiency', policy_compliance: 'Policy Compliance',
  employee_relations: 'Employee Relations', documentation: 'Documentation', payroll_accuracy: 'Payroll Accuracy',
  lead_conversion: 'Lead Conversion', client_visits: 'Client Visits',
  revenue_achievement: 'Revenue Achievement', negotiation_skills: 'Negotiation Skills', territory_coverage: 'Territory Coverage',
  call_handling: 'Call Handling', lead_followup: 'Lead Follow-up',
  crm_management: 'CRM Management', upselling: 'Upselling', customer_retention: 'Customer Retention',
  campaign_execution: 'Campaign Execution', content_quality: 'Content Quality',
  analytics_skills: 'Analytics Skills', brand_consistency: 'Brand Consistency', roi_achievement: 'ROI Achievement',
  coding_quality: 'Coding Quality', system_architecture: 'System Architecture',
  bug_resolution: 'Bug Resolution', innovation: 'Innovation',
  research_depth: 'Research Depth', experiment_design: 'Experiment Design',
  data_analysis: 'Data Analysis', publication_output: 'Publication Output',
};

// ── Reusable Components ──

function GradeStars({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" disabled={readonly}
          onClick={() => onChange && onChange(s)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          <Star className={`h-5 w-5 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

function GradeBadge({ grade }) {
  let color = 'bg-red-100 text-red-700';
  if (grade >= 4) color = 'bg-green-100 text-green-700';
  else if (grade >= 3) color = 'bg-blue-100 text-blue-700';
  else if (grade >= 2) color = 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${color}`}>
      <Star className="h-3.5 w-3.5 fill-current" /> {Number(grade).toFixed(1)} / 5
    </span>
  );
}

function CategoryBadge({ category }) {
  const isIntern = category === 'intern';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isIntern ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
      {isIntern ? 'Intern' : 'Permanent'}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function Gradings() {
  const { user, isAdminOrManager } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [gradings, setGradings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState('');
  const [viewEmployee, setViewEmployee] = useState(null);
  const [cumulativeData, setCumulativeData] = useState(null);
  const [sendingAudit, setSendingAudit] = useState(false);
  const [auditReport, setAuditReport] = useState(null); // { data, html }
  const [loadingReport, setLoadingReport] = useState(false);

  // Form state
  const initForm = () => {
    const f = { employee_id: '', remarks: '' };
    [...COMMON_PARAMS, ...Object.values(DEPT_SPECIFIC_PARAMS).flat()].forEach(p => f[p] = 0);
    return f;
  };
  const [form, setForm] = useState(initForm());
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => { fetchGradings(); }, [month, year, deptFilter]);
  useEffect(() => { if (isAdminOrManager) fetchEmployees(); }, []);

  async function fetchGradings() {
    setLoading(true);
    try {
      const params = { month, year };
      if (deptFilter) params.department = deptFilter;
      const res = await api.get('/gradings', { params });
      setGradings(res.data);
    } catch (err) {
      console.error('Failed to fetch gradings:', err);
    } finally { setLoading(false); }
  }

  async function fetchEmployees() {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.filter(e => e.department));
    } catch (err) { console.error('Failed to fetch employees:', err); }
  }

  async function fetchCumulativeView(empId) {
    try {
      const res = await api.get('/gradings/cumulative', { params: { employee_id: empId, month, year } });
      setCumulativeData(res.data);
      const emp = employees.find(e => e.id === empId) || gradings.find(g => g.employee_id === empId);
      setViewEmployee(emp);
    } catch (err) {
      toast.error('Failed to load cumulative data');
    }
  }

  async function openAuditPreview(empId) {
    setLoadingReport(true);
    setAuditReport(null);
    try {
      const res = await api.get('/gradings/audit-report/preview', { params: { employee_id: empId, month, year } });
      setAuditReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load audit report');
    } finally { setLoadingReport(false); }
  }

  async function handleSendAudit(empId) {
    setSendingAudit(true);
    try {
      await api.post('/gradings/audit-report', { employee_id: empId, month, year });
      toast.success('Audit report sent to employee');
      setAuditReport(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send audit report');
    } finally { setSendingAudit(false); }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(initForm());
    setSelectedDept('');
    setShowModal(true);
  }

  function openEditModal(grading) {
    setEditingId(grading.id);
    setSelectedDept(grading.department || grading.employee_department || '');
    const f = initForm();
    f.employee_id = grading.employee_id;
    f.remarks = grading.remarks || '';
    [...COMMON_PARAMS, ...Object.values(DEPT_SPECIFIC_PARAMS).flat()].forEach(p => {
      if (grading[p] != null) f[p] = grading[p];
    });
    setForm(f);
    setShowModal(true);
  }

  function handleEmployeeChange(empId) {
    const emp = employees.find(e => e.id === parseInt(empId, 10));
    setForm({ ...form, employee_id: empId });
    setSelectedDept(emp?.department || '');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/gradings/${editingId}`, { ...form });
        toast.success('Grading updated');
      } else {
        await api.post('/gradings', { ...form, month, year });
        toast.success('Grading saved');
      }
      setShowModal(false);
      fetchGradings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this grading?')) return;
    try {
      await api.delete(`/gradings/${id}`);
      toast.success('Grading deleted');
      fetchGradings();
    } catch (err) { toast.error('Failed to delete'); }
  }

  // Group gradings by employee for cumulative view
  const grouped = {};
  gradings.forEach(g => {
    if (!grouped[g.employee_id]) {
      grouped[g.employee_id] = {
        employee_id: g.employee_id,
        employee_name: g.employee_name,
        employee_department: g.employee_department,
        employee_category: g.employee_category,
        role_title: g.role_title,
        gradings: [],
      };
    }
    grouped[g.employee_id].gradings.push(g);
  });

  const employeeList = Object.values(grouped).map(emp => {
    const avg = emp.gradings.reduce((s, g) => s + (g.total_grade || 0), 0) / emp.gradings.length;
    return { ...emp, cumulative_grade: avg, grading_count: emp.gradings.length };
  }).sort((a, b) => b.cumulative_grade - a.cumulative_grade);

  const totalPages = Math.max(1, Math.ceil(employeeList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = employeeList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const applicableParams = selectedDept
    ? [...COMMON_PARAMS, ...(DEPT_SPECIFIC_PARAMS[selectedDept] || [])]
    : COMMON_PARAMS;

  function getPreviewGrade() {
    const values = applicableParams.map(p => Number(form[p]) || 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-7 w-7 text-yellow-500 fill-yellow-500" />
            Employee Gradings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cumulative grading by CEO, CSO & CTO — scores out of 5
          </p>
        </div>
        {isAdminOrManager && (
          <button onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Grade Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-xs text-gray-500 font-medium">Month</span>
          <select value={month} onChange={e => { setMonth(parseInt(e.target.value, 10)); setPage(1); }}
            className="text-sm border-0 focus:ring-0 bg-transparent font-medium text-gray-700">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-xs text-gray-500 font-medium">Year</span>
          <select value={year} onChange={e => { setYear(parseInt(e.target.value, 10)); setPage(1); }}
            className="text-sm border-0 focus:ring-0 bg-transparent font-medium text-gray-700">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-xs text-gray-500 font-medium">Dept</span>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="text-sm border-0 focus:ring-0 bg-transparent font-medium text-gray-700">
            <option value="">All</option>
            {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cumulative Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : employeeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Star className="h-12 w-12 mb-3" />
            <p className="text-sm">No gradings for {MONTHS[month - 1]} {year}</p>
            {isAdminOrManager && (
              <button onClick={openCreateModal} className="mt-3 text-green-600 text-sm font-medium hover:underline">
                + Grade an employee
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dept</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reviews</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cumulative Grade</th>
                    {isAdminOrManager && (
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(emp => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{emp.employee_name}</div>
                        <div className="text-xs text-gray-500">{emp.role_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <DepartmentBadge department={emp.employee_department} />
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge category={emp.employee_category} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm font-medium ${emp.grading_count >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                            {emp.grading_count} / 3
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {emp.gradings.map(g => (
                            <span key={g.id} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {g.grader_name?.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <GradeBadge grade={emp.cumulative_grade} />
                      </td>
                      {isAdminOrManager && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => fetchCumulativeView(emp.employee_id)}
                              className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View Breakdown">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            {emp.grading_count >= 3 && (
                              <button onClick={() => openAuditPreview(emp.employee_id)}
                                disabled={loadingReport}
                                className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors" title="View & Send Audit Report">
                                <FileText className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, employeeList.length)} of {employeeList.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">Page {safePage} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Individual Gradings Below */}
      {gradings.length > 0 && isAdminOrManager && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Individual Gradings</h3>
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Grader</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gradings.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{g.employee_name}</td>
                    <td className="px-5 py-3 text-gray-600">{g.grader_name}</td>
                    <td className="px-5 py-3"><GradeBadge grade={g.total_grade} /></td>
                    <td className="px-5 py-3 text-gray-500 max-w-[180px] truncate">{g.remarks || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditModal(g)}
                          className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100" title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(g.id)}
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cumulative View Modal */}
      {viewEmployee && cumulativeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {cumulativeData.employee_name} — Cumulative Review
              </h3>
              <button onClick={() => { setViewEmployee(null); setCumulativeData(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DepartmentBadge department={cumulativeData.department} />
                  <CategoryBadge category={cumulativeData.employee_category} />
                </div>
                <GradeBadge grade={cumulativeData.cumulative_grade} />
              </div>

              <p className="text-sm text-gray-500">
                {cumulativeData.grading_count} of 3 managers have graded — {MONTHS[month - 1]} {year}
              </p>

              {/* Per-manager breakdown */}
              {cumulativeData.manager_gradings?.map((mg, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">{mg.grader_name}</span>
                    <GradeBadge grade={mg.total_grade} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[...COMMON_PARAMS, ...(DEPT_SPECIFIC_PARAMS[cumulativeData.department] || [])].map(p => (
                      <div key={p} className="flex items-center justify-between">
                        <span className="text-gray-600">{PARAM_LABELS[p] || p}</span>
                        <GradeStars value={mg[p] || 0} readonly />
                      </div>
                    ))}
                  </div>
                  {mg.remarks && (
                    <p className="mt-2 text-sm text-gray-600 italic border-t pt-2">"{mg.remarks}"</p>
                  )}
                </div>
              ))}

              {/* View Audit Report */}
              {isAdminOrManager && cumulativeData.grading_count >= 3 && (
                <button onClick={() => { setViewEmployee(null); setCumulativeData(null); openAuditPreview(cumulativeData.employee_id); }}
                  disabled={loadingReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  View Full Audit Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Grading' : `Grade Employee — ${MONTHS[month - 1]} ${year}`}
              </h3>
              <div className="flex items-center gap-3">
                {selectedDept && <GradeBadge grade={getPreviewGrade()} />}
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select value={form.employee_id} onChange={e => handleEmployeeChange(e.target.value)}
                  disabled={!!editingId} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {DEPT_LABELS[emp.department] || emp.department}
                      {emp.employee_category === 'intern' ? ' (Intern)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDept && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Common Parameters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {COMMON_PARAMS.map(param => (
                        <div key={param} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-sm font-medium text-gray-700">{PARAM_LABELS[param]}</span>
                          <GradeStars value={form[param]} onChange={val => setForm({ ...form, [param]: val })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {DEPT_LABELS[selectedDept]} Parameters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(DEPT_SPECIFIC_PARAMS[selectedDept] || []).map(param => (
                        <div key={param} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-sm font-medium text-gray-700">{PARAM_LABELS[param]}</span>
                          <GradeStars value={form[param]} onChange={val => setForm({ ...form, [param]: val })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea rows={3} value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Performance remarks, improvement suggestions, or appreciation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving || !selectedDept}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Update Grading' : 'Save Grading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Audit Report Preview Modal ── */}
      {(auditReport || loadingReport) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Audit Report Preview</h3>
                  <p className="text-xs text-gray-500">
                    {auditReport ? `${auditReport.employee?.name} — ${auditReport.month_name} ${auditReport.year}` : 'Loading...'}
                  </p>
                </div>
              </div>
              <button onClick={() => setAuditReport(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-3" />
                  <p className="text-sm text-gray-500">Generating audit report...</p>
                </div>
              ) : auditReport?.report_html ? (
                <div
                  className="audit-report-container"
                  dangerouslySetInnerHTML={{ __html: auditReport.report_html }}
                />
              ) : null}
            </div>

            {/* Footer with actions */}
            {auditReport && !loadingReport && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">To:</span> {auditReport.employee?.email}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAuditReport(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Close
                  </button>
                  <button onClick={() => handleSendAudit(auditReport.employee?.id)}
                    disabled={sendingAudit}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    {sendingAudit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send to Employee
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
