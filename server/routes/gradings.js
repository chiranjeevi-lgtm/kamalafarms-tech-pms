const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();
router.use(authenticate);

// All grading parameters stored as JSON in a TEXT column
const COMMON_PARAMS = ['attendance', 'punctuality', 'teamwork', 'communication', 'discipline'];

const DEPT_PARAMS = {
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

function clamp(val) {
  const n = Number(val) || 0;
  return Math.min(5, Math.max(0, n));
}

function calcGrade(scores, dept) {
  const params = [...COMMON_PARAMS, ...(DEPT_PARAMS[dept] || [])];
  const vals = params.map(p => clamp(scores[p]));
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

// GET /api/gradings - list gradings
router.get('/', async (req, res) => {
  try {
    const { month, year, employee_id, department } = req.query;
    let sql = `
      SELECT g.*, e.name AS employee_name, e.department AS employee_department,
             e.employee_category, e.role_title, u.name AS grader_name
      FROM gradings g
      JOIN employees e ON e.id = g.employee_id
      JOIN users u ON u.id = g.graded_by
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'employee') {
      const { rows: empRows } = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND g.employee_id = $${params.length}`;
      } else return res.json([]);
    }

    if (month) { params.push(parseInt(month)); sql += ` AND g.month = $${params.length}`; }
    if (year) { params.push(parseInt(year)); sql += ` AND g.year = $${params.length}`; }
    if (employee_id) { params.push(parseInt(employee_id)); sql += ` AND g.employee_id = $${params.length}`; }
    if (department) { params.push(department); sql += ` AND e.department = $${params.length}`; }

    sql += ' ORDER BY g.updated_at DESC';
    const { rows } = await query(sql, params);

    // Parse scores JSON
    const results = rows.map(r => {
      const scores = r.scores ? JSON.parse(r.scores) : {};
      return { ...r, ...scores };
    });

    res.json(results);
  } catch (err) {
    console.error('List gradings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/gradings/cumulative - cumulative view for an employee
router.get('/cumulative', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    if (!employee_id || !month || !year) {
      return res.status(400).json({ error: 'employee_id, month, year required.' });
    }

    const { rows: empRows } = await query(
      'SELECT id, name, department, employee_category, role_title, email FROM employees WHERE id = $1',
      [employee_id]
    );
    if (empRows.length === 0) return res.status(404).json({ error: 'Employee not found.' });
    const emp = empRows[0];

    const { rows: gradingRows } = await query(
      `SELECT g.*, u.name AS grader_name FROM gradings g
       JOIN users u ON u.id = g.graded_by
       WHERE g.employee_id = $1 AND g.month = $2 AND g.year = $3
       ORDER BY g.created_at`,
      [employee_id, month, year]
    );

    const managerGradings = gradingRows.map(g => {
      const scores = g.scores ? JSON.parse(g.scores) : {};
      return { ...g, ...scores };
    });

    const cumulativeGrade = managerGradings.length > 0
      ? managerGradings.reduce((s, g) => s + (g.total_grade || 0), 0) / managerGradings.length
      : 0;

    res.json({
      employee_id: emp.id,
      employee_name: emp.name,
      department: emp.department,
      employee_category: emp.employee_category,
      role_title: emp.role_title,
      email: emp.email,
      grading_count: managerGradings.length,
      cumulative_grade: Math.round(cumulativeGrade * 100) / 100,
      manager_gradings: managerGradings,
    });
  } catch (err) {
    console.error('Cumulative gradings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/gradings - create grading
router.post('/', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, remarks, ...paramScores } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({ error: 'employee_id, month, year required.' });
    }

    const { rows: empRows } = await query('SELECT department FROM employees WHERE id = $1', [employee_id]);
    if (empRows.length === 0) return res.status(404).json({ error: 'Employee not found.' });
    const dept = empRows[0].department;

    // Check if this manager already graded this employee this month
    const { rows: existing } = await query(
      'SELECT id FROM gradings WHERE employee_id = $1 AND graded_by = $2 AND month = $3 AND year = $4',
      [employee_id, req.user.id, month, year]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already graded this employee for this month. Use edit instead.' });
    }

    const scores = {};
    [...COMMON_PARAMS, ...(DEPT_PARAMS[dept] || [])].forEach(p => {
      scores[p] = clamp(paramScores[p]);
    });
    const total_grade = calcGrade(scores, dept);

    const { rows } = await query(
      `INSERT INTO gradings (employee_id, graded_by, month, year, department, scores, total_grade, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [employee_id, req.user.id, month, year, dept, JSON.stringify(scores), total_grade, remarks || null]
    );

    res.status(201).json(rows[0] || { employee_id, month, year, total_grade });
  } catch (err) {
    console.error('Create grading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/gradings/:id
router.put('/:id', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const gradingId = parseInt(req.params.id, 10);
    const { rows: existing } = await query('SELECT * FROM gradings WHERE id = $1', [gradingId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Grading not found.' });

    const old = existing[0];
    const { remarks, ...paramScores } = req.body;
    const dept = old.department;
    const oldScores = old.scores ? JSON.parse(old.scores) : {};

    const scores = {};
    [...COMMON_PARAMS, ...(DEPT_PARAMS[dept] || [])].forEach(p => {
      scores[p] = clamp(paramScores[p] != null ? paramScores[p] : oldScores[p]);
    });
    const total_grade = calcGrade(scores, dept);

    await query(
      `UPDATE gradings SET scores=$1, total_grade=$2, remarks=$3, updated_at=datetime('now') WHERE id=$4`,
      [JSON.stringify(scores), total_grade, remarks ?? old.remarks, gradingId]
    );

    const { rows } = await query(
      `SELECT g.*, e.name AS employee_name, e.department AS employee_department, u.name AS grader_name
       FROM gradings g JOIN employees e ON e.id=g.employee_id JOIN users u ON u.id=g.graded_by WHERE g.id=$1`,
      [gradingId]
    );
    const result = rows[0];
    if (result?.scores) {
      const s = JSON.parse(result.scores);
      Object.assign(result, s);
    }
    res.json(result);
  } catch (err) {
    console.error('Update grading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/gradings/:id
router.delete('/:id', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM gradings WHERE id = $1', [parseInt(req.params.id, 10)]);
    if (rowCount === 0) return res.status(404).json({ error: 'Grading not found.' });
    res.json({ message: 'Grading deleted.' });
  } catch (err) {
    console.error('Delete grading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Shared: build audit report data ──
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEPT_DISPLAY = {
  operations: 'Operations', farm_execution: 'Farm Execution', farm_agronomy: 'Farm Agronomy',
  hr_admin: 'HR & Admin', field_sales: 'Field Sales', inhouse_sales: 'Inhouse Sales',
  marketing: 'Marketing', computer_engineering: 'Computer Engineering', research_development: 'R&D',
};

async function buildAuditData(employee_id, month, year) {
  const { rows: empRows } = await query('SELECT * FROM employees WHERE id = $1', [employee_id]);
  if (empRows.length === 0) throw Object.assign(new Error('Employee not found.'), { status: 404 });
  const emp = empRows[0];

  const { rows: gradingRows } = await query(
    `SELECT g.*, u.name AS grader_name, u.email AS grader_email FROM gradings g
     JOIN users u ON u.id = g.graded_by
     WHERE g.employee_id = $1 AND g.month = $2 AND g.year = $3
     ORDER BY g.created_at`,
    [employee_id, month, year]
  );

  const managerGradings = gradingRows.map(g => {
    const scores = g.scores ? JSON.parse(g.scores) : {};
    return { ...g, ...scores };
  });

  const cumulativeGrade = managerGradings.length > 0
    ? managerGradings.reduce((s, g) => s + (g.total_grade || 0), 0) / managerGradings.length
    : 0;

  const deptParams = [...COMMON_PARAMS, ...(DEPT_PARAMS[emp.department] || [])];

  // Build parameter averages
  const paramBreakdown = deptParams.map(p => {
    const label = PARAM_LABELS[p] || p;
    const scores = managerGradings.map(g => ({ grader: g.grader_name, score: g[p] || 0 }));
    const avg = scores.length > 0
      ? scores.reduce((s, x) => s + x.score, 0) / scores.length
      : 0;
    return { key: p, label, scores, average: Math.round(avg * 10) / 10 };
  });

  // Collect remarks
  const remarks = managerGradings.filter(g => g.remarks).map(g => ({
    grader: g.grader_name,
    text: g.remarks,
  }));

  return {
    employee: {
      id: emp.id,
      name: emp.name,
      department: emp.department,
      department_label: DEPT_DISPLAY[emp.department] || emp.department,
      role_title: emp.role_title,
      email: emp.email,
      employee_category: emp.employee_category || 'permanent',
    },
    month: parseInt(month),
    year: parseInt(year),
    month_name: MONTH_NAMES[month - 1],
    grading_count: managerGradings.length,
    cumulative_grade: Math.round(cumulativeGrade * 100) / 100,
    manager_gradings: managerGradings,
    param_breakdown: paramBreakdown,
    remarks,
    generated_at: new Date().toISOString(),
  };
}

function buildAuditHtml(data) {
  const { employee: emp, month_name, year, cumulative_grade: cg, manager_gradings: mgs, param_breakdown, remarks } = data;
  const gradeColor = cg >= 4 ? '#16a34a' : cg >= 3 ? '#2563eb' : cg >= 2 ? '#ca8a04' : '#dc2626';

  let paramRows = '';
  param_breakdown.forEach(pb => {
    paramRows += `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${pb.label}</td>
      ${pb.scores.map(s => `<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${s.score}/5</td>`).join('')}
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:bold;background:#f9fafb;">${pb.average}/5</td>
    </tr>`;
  });

  let remarksHtml = '';
  remarks.forEach(r => {
    remarksHtml += `<div style="margin:8px 0;padding:10px 14px;background:#f9fafb;border-left:3px solid #16a34a;border-radius:0 6px 6px 0;">
      <strong style="color:#374151;">${r.grader}:</strong>
      <span style="color:#6b7280;"> "${r.text}"</span>
    </div>`;
  });

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:750px;margin:0 auto;padding:20px;color:#111827;">
    <div style="background:linear-gradient(135deg,#16a34a 0%,#059669 50%,#047857 100%);padding:28px 32px;border-radius:12px 12px 0 0;color:white;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;">🌿</div>
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Kamalafarms Tech PMS</h1>
          <p style="margin:2px 0 0;opacity:0.85;font-size:13px;">Performance Audit Report</p>
        </div>
      </div>
    </div>

    <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">Audit Report — ${month_name} ${year}</h2>

      <table style="width:100%;margin:0 0 20px;font-size:14px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:120px;">Employee</td><td style="padding:4px 0;font-weight:600;">${emp.name}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Department</td><td style="padding:4px 0;">${emp.department_label}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Role</td><td style="padding:4px 0;">${emp.role_title || 'N/A'}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Category</td><td style="padding:4px 0;">
          <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${emp.employee_category === 'intern' ? '#fef3c7' : '#d1fae5'};color:${emp.employee_category === 'intern' ? '#92400e' : '#065f46'};">
            ${emp.employee_category === 'intern' ? 'Intern' : 'Permanent'}
          </span>
        </td></tr>
      </table>

      <div style="text-align:center;margin:24px 0;padding:20px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:10px;border:1px solid #bbf7d0;">
        <p style="margin:0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Cumulative Grade</p>
        <p style="margin:10px 0 0;font-size:40px;font-weight:800;color:${gradeColor};letter-spacing:-1px;">
          ${cg.toFixed(2)} <span style="font-size:20px;font-weight:400;color:#9ca3af;">/ 5.00</span>
        </p>
        <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">Based on ${mgs.length} manager review${mgs.length !== 1 ? 's' : ''}</p>
      </div>

      <h3 style="margin:24px 0 12px;font-size:15px;color:#374151;">📊 Parameter-wise Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;font-weight:600;">Parameter</th>
            ${mgs.map(g => `<th style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;font-size:12px;">${g.grader_name}</th>`).join('')}
            <th style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;background:#ecfdf5;">Average</th>
          </tr>
        </thead>
        <tbody>${paramRows}</tbody>
      </table>

      ${remarks.length > 0 ? `
        <h3 style="margin:24px 0 12px;font-size:15px;color:#374151;">💬 Manager Remarks</h3>
        ${remarksHtml}
      ` : ''}

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:11px;text-align:center;">
        This is an automated audit report from Kamalafarms Tech Performance Management System.<br/>
        Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </p>
    </div>
  </div>`;
}

// GET /api/gradings/audit-report/preview - preview report without sending
router.get('/audit-report/preview', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    if (!employee_id || !month || !year) {
      return res.status(400).json({ error: 'employee_id, month, year required.' });
    }

    const data = await buildAuditData(employee_id, month, year);
    if (data.grading_count < 3) {
      return res.status(400).json({ error: `Only ${data.grading_count} of 3 required manager reviews completed.` });
    }

    const html = buildAuditHtml(data);
    res.json({ ...data, report_html: html });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Audit preview error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/gradings/audit-report - generate and send audit report
router.post('/audit-report', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;

    const data = await buildAuditData(employee_id, month, year);
    if (data.grading_count < 3) {
      return res.status(400).json({ error: `Only ${data.grading_count} of 3 required manager reviews completed.` });
    }

    const html = buildAuditHtml(data);

    // Try to send email
    try {
      const emailService = require('../services/emailService');
      const emailer = new emailService();
      if (emailer.transporter) {
        await emailer.transporter.sendMail({
          from: emailer.fromAddress,
          to: data.employee.email,
          subject: `Performance Audit Report — ${data.month_name} ${data.year} | Kamalafarms Tech PMS`,
          html,
        });
      }
    } catch (emailErr) {
      console.log('Email send skipped (SMTP not configured):', emailErr.message);
    }

    // Store audit as a review
    const remarksText = data.remarks.map(r => `${r.grader}: "${r.text}"`).join('; ');
    await query(
      `INSERT INTO reviews (employee_id, month, year, kpi_score, zone, incentive_earned, manager_comments, ai_feedback, email_sent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
       ON CONFLICT(employee_id, month, year) DO UPDATE SET
       kpi_score=$4, zone=$5, manager_comments=$7, ai_feedback=$8, email_sent=1, sent_at=datetime('now')`,
      [
        employee_id, month, year,
        data.cumulative_grade * 20,
        data.cumulative_grade >= 4 ? 'green' : data.cumulative_grade >= 2.5 ? 'yellow' : 'red',
        0,
        remarksText,
        `Cumulative grade: ${data.cumulative_grade.toFixed(2)}/5 from ${data.grading_count} managers.`,
      ]
    );

    res.json({ message: 'Audit report generated and sent.', cumulative_grade: data.cumulative_grade });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Audit report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
