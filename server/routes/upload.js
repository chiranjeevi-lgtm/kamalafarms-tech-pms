const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();
router.use(authenticate);
router.use(roleCheck('admin', 'manager'));

// Store in memory (Vercel has no persistent disk for uploads)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const VALID_DEPARTMENTS = [
  'operations', 'farm_execution', 'farm_agronomy', 'hr_admin',
  'field_sales', 'inhouse_sales', 'marketing', 'computer_engineering', 'research_development',
];
const VALID_CATEGORIES = ['permanent', 'intern'];

// Column name aliases — maps various CRM column names to our DB fields
const COLUMN_MAP = {
  // name
  'name': 'name', 'full name': 'name', 'employee name': 'name', 'emp name': 'name', 'fullname': 'name',
  // email
  'email': 'email', 'email address': 'email', 'e-mail': 'email', 'mail': 'email', 'emailid': 'email', 'email id': 'email',
  // phone
  'phone': 'phone', 'phone number': 'phone', 'mobile': 'phone', 'mobile number': 'phone', 'contact': 'phone', 'contact number': 'phone',
  // role_title
  'role': 'role_title', 'role title': 'role_title', 'role_title': 'role_title', 'designation': 'role_title',
  'job title': 'role_title', 'position': 'role_title', 'title': 'role_title',
  // department
  'department': 'department', 'dept': 'department', 'team': 'department',
  // employee_category
  'category': 'employee_category', 'employee category': 'employee_category', 'employee_category': 'employee_category',
  'type': 'employee_category', 'employment type': 'employee_category', 'emp type': 'employee_category',
  // joining_date
  'joining date': 'joining_date', 'joining_date': 'joining_date', 'join date': 'joining_date',
  'date of joining': 'joining_date', 'doj': 'joining_date', 'start date': 'joining_date',
  // salary
  'salary': 'salary_fixed', 'salary fixed': 'salary_fixed', 'salary_fixed': 'salary_fixed',
  'fixed salary': 'salary_fixed', 'base salary': 'salary_fixed', 'ctc': 'salary_fixed',
  'salary variable': 'salary_variable', 'salary_variable': 'salary_variable', 'variable': 'salary_variable',
  'variable salary': 'salary_variable', 'bonus': 'salary_variable',
  'salary incentive': 'salary_incentive', 'salary_incentive': 'salary_incentive', 'incentive': 'salary_incentive',
  // reporting manager
  'reporting manager': 'reporting_manager_name', 'manager': 'reporting_manager_name',
  'reports to': 'reporting_manager_name', 'reporting_manager': 'reporting_manager_name',
};

// Department name normalization
const DEPT_ALIASES = {
  'operations': 'operations', 'ops': 'operations', 'operation': 'operations',
  'farm execution': 'farm_execution', 'farm_execution': 'farm_execution', 'farm exec': 'farm_execution', 'execution': 'farm_execution',
  'farm agronomy': 'farm_agronomy', 'farm_agronomy': 'farm_agronomy', 'agronomy': 'farm_agronomy',
  'hr': 'hr_admin', 'hr & admin': 'hr_admin', 'hr_admin': 'hr_admin', 'hr and admin': 'hr_admin', 'admin': 'hr_admin', 'human resources': 'hr_admin',
  'field sales': 'field_sales', 'field_sales': 'field_sales', 'outside sales': 'field_sales',
  'inhouse sales': 'inhouse_sales', 'inhouse_sales': 'inhouse_sales', 'inside sales': 'inhouse_sales', 'in-house sales': 'inhouse_sales',
  'sales': 'field_sales', // default sales to field_sales
  'marketing': 'marketing', 'mktg': 'marketing',
  'computer engineering': 'computer_engineering', 'computer_engineering': 'computer_engineering',
  'engineering': 'computer_engineering', 'tech': 'computer_engineering', 'technical': 'computer_engineering', 'it': 'computer_engineering', 'software': 'computer_engineering',
  'r&d': 'research_development', 'research': 'research_development', 'research_development': 'research_development',
  'research and development': 'research_development', 'r & d': 'research_development', 'rnd': 'research_development',
};

function normalizeDept(val) {
  if (!val) return null;
  const key = String(val).toLowerCase().trim();
  return DEPT_ALIASES[key] || null;
}

function normalizeCategory(val) {
  if (!val) return 'permanent';
  const key = String(val).toLowerCase().trim();
  if (key === 'intern' || key === 'internship' || key === 'trainee') return 'intern';
  return 'permanent';
}

function parseDate(val) {
  if (!val) return null;
  // Excel serial date number
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  // Try common formats
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  // DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 1900) return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    if (a > 1900) return `${a}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
  }
  return null;
}

// GET /api/upload/template - download template Excel
router.get('/template', (req, res) => {
  const wb = XLSX.utils.book_new();
  const headers = [
    'Name', 'Email', 'Phone', 'Role Title', 'Department', 'Category',
    'Joining Date', 'Fixed Salary', 'Variable Salary', 'Incentive', 'Reporting Manager',
  ];
  const example = [
    'John Doe', 'john@kamalafarms.com', '+91-9876543210', 'Farm Technician',
    'farm_execution', 'permanent', '2025-01-15', 45000, 8000, 0, 'Rajesh Kumar',
  ];
  const deptNote = [
    'Valid Departments:', 'operations, farm_execution, farm_agronomy, hr_admin,',
    'field_sales, inhouse_sales, marketing, computer_engineering, research_development', '', '',
    'Category:', 'permanent or intern', '', '', '', '',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example, [], deptNote]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="employee_upload_template.xlsx"');
  res.send(buf);
});

// POST /api/upload/preview - parse file and return preview (no DB writes)
router.post('/preview', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

    if (rawRows.length === 0) return res.status(400).json({ error: 'File is empty.' });

    // Map columns
    const firstRow = rawRows[0];
    const columnMapping = {};
    Object.keys(firstRow).forEach(col => {
      const key = col.toLowerCase().trim();
      if (COLUMN_MAP[key]) columnMapping[col] = COLUMN_MAP[key];
    });

    const unmappedColumns = Object.keys(firstRow).filter(c => !columnMapping[c]);

    // Parse rows
    const employees = [];
    const errors = [];

    rawRows.forEach((row, idx) => {
      const emp = {};
      Object.entries(columnMapping).forEach(([excelCol, dbField]) => {
        emp[dbField] = row[excelCol];
      });

      // Normalize
      emp.name = String(emp.name || '').trim();
      emp.email = String(emp.email || '').trim().toLowerCase();
      emp.phone = String(emp.phone || '').trim();
      emp.role_title = String(emp.role_title || '').trim();
      emp.department = normalizeDept(emp.department);
      emp.employee_category = normalizeCategory(emp.employee_category);
      emp.joining_date = parseDate(emp.joining_date);
      emp.salary_fixed = parseFloat(emp.salary_fixed) || 0;
      emp.salary_variable = parseFloat(emp.salary_variable) || 0;
      emp.salary_incentive = parseFloat(emp.salary_incentive) || 0;
      emp.reporting_manager_name = String(emp.reporting_manager_name || '').trim();

      const rowErrors = [];
      if (!emp.name) rowErrors.push('Name is required');
      if (!emp.email || !emp.email.includes('@')) rowErrors.push('Valid email is required');
      if (!emp.department) rowErrors.push(`Invalid department: "${row[Object.keys(columnMapping).find(k => columnMapping[k] === 'department')] || ''}"`);

      emp._row = idx + 2; // Excel row (1-indexed header + data)
      emp._errors = rowErrors;
      emp._valid = rowErrors.length === 0;
      employees.push(emp);
    });

    res.json({
      total: employees.length,
      valid: employees.filter(e => e._valid).length,
      invalid: employees.filter(e => !e._valid).length,
      column_mapping: columnMapping,
      unmapped_columns: unmappedColumns,
      employees,
    });
  } catch (err) {
    console.error('Upload preview error:', err);
    res.status(500).json({ error: 'Failed to parse file: ' + err.message });
  }
});

// POST /api/upload/import - actually import employees into DB
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

    if (rawRows.length === 0) return res.status(400).json({ error: 'File is empty.' });

    // Map columns
    const firstRow = rawRows[0];
    const columnMapping = {};
    Object.keys(firstRow).forEach(col => {
      const key = col.toLowerCase().trim();
      if (COLUMN_MAP[key]) columnMapping[col] = COLUMN_MAP[key];
    });

    // Get existing managers for matching
    const { rows: managers } = await query('SELECT id, name FROM employees WHERE role_title IN (\'CEO\', \'CTO\', \'Chief Sales Officer\') OR reporting_manager_id IS NULL');
    const managerMap = {};
    managers.forEach(m => { managerMap[m.name.toLowerCase()] = m.id; });

    const defaultPassword = await bcrypt.hash('password123', 10);

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
      const emp = {};
      Object.entries(columnMapping).forEach(([excelCol, dbField]) => {
        emp[dbField] = row[excelCol];
      });

      emp.name = String(emp.name || '').trim();
      emp.email = String(emp.email || '').trim().toLowerCase();
      emp.phone = String(emp.phone || '').trim();
      emp.role_title = String(emp.role_title || '').trim();
      emp.department = normalizeDept(emp.department);
      emp.employee_category = normalizeCategory(emp.employee_category);
      emp.joining_date = parseDate(emp.joining_date);
      emp.salary_fixed = parseFloat(emp.salary_fixed) || 0;
      emp.salary_variable = parseFloat(emp.salary_variable) || 0;
      emp.salary_incentive = parseFloat(emp.salary_incentive) || 0;
      emp.reporting_manager_name = String(emp.reporting_manager_name || '').trim();

      if (!emp.name || !emp.email || !emp.department) {
        errors.push({ row: idx + 2, name: emp.name || '(empty)', reason: 'Missing name, email, or valid department' });
        skipped++;
        continue;
      }

      // Check if email already exists
      const { rows: existingUser } = await query('SELECT id FROM users WHERE email = $1', [emp.email]);
      if (existingUser.length > 0) {
        errors.push({ row: idx + 2, name: emp.name, reason: `Email ${emp.email} already exists` });
        skipped++;
        continue;
      }

      try {
        // Create user
        const { rows: newUser } = await query(
          'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)',
          [emp.email, defaultPassword, 'employee', emp.name]
        );
        const userId = newUser[0]?.id;

        // Resolve reporting manager
        let managerId = null;
        if (emp.reporting_manager_name) {
          managerId = managerMap[emp.reporting_manager_name.toLowerCase()] || null;
        }

        // Create employee
        await query(
          `INSERT INTO employees (user_id, name, role_title, department, employee_category, email, phone, joining_date, reporting_manager_id, salary_fixed, salary_variable, salary_incentive, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
          [
            userId, emp.name, emp.role_title || null, emp.department, emp.employee_category,
            emp.email, emp.phone || null, emp.joining_date, managerId,
            emp.salary_fixed, emp.salary_variable, emp.salary_incentive,
          ]
        );

        imported++;
      } catch (dbErr) {
        errors.push({ row: idx + 2, name: emp.name, reason: dbErr.message });
        skipped++;
      }
    }

    res.json({
      message: `Import complete: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      total: rawRows.length,
      errors,
    });
  } catch (err) {
    console.error('Upload import error:', err);
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

module.exports = router;
