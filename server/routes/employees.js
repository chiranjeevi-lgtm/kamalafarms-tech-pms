const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    const params = [];
    let sql = `
      SELECT e.*,
        ks.total_score AS latest_score,
        ks.zone AS latest_zone,
        ks.month AS score_month,
        ks.year AS score_year
      FROM employees e
      LEFT JOIN kpi_scores ks ON ks.employee_id = e.id
        AND ks.id = (
          SELECT id FROM kpi_scores
          WHERE employee_id = e.id
          ORDER BY year DESC, month DESC LIMIT 1
        )
      WHERE e.is_active = 1
    `;

    // Role-based filtering: employees only see themselves
    if (req.user.role === 'employee') {
      params.push(req.user.id);
      sql += ` AND e.user_id = $${params.length}`;
    }

    if (department) {
      params.push(department);
      sql += ` AND e.department = $${params.length}`;
    }

    sql += ' ORDER BY e.name ASC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);

    // Employees can only view their own record
    if (req.user.role === 'employee') {
      const { rows: check } = await query(
        'SELECT id FROM employees WHERE id = $1 AND user_id = $2',
        [employeeId, req.user.id]
      );
      if (check.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const { rows } = await query(
      `SELECT e.*,
        u.email AS user_email,
        m.name AS manager_name
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN employees m ON e.reporting_manager_id = m.id
       WHERE e.id = $1`,
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const employee = rows[0];

    // Fetch latest KPI scores
    const { rows: scores } = await query(
      `SELECT * FROM kpi_scores
       WHERE employee_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 6`,
      [employeeId]
    );

    // Fetch recent performance history
    const { rows: history } = await query(
      `SELECT * FROM performance_history
       WHERE employee_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 12`,
      [employeeId]
    );

    res.json({ ...employee, kpi_scores: scores, performance_history: history });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/employees  (admin only)
router.post('/', roleCheck('admin'), async (req, res) => {
  try {
    const {
      name, email, role_title, department, phone,
      joining_date, reporting_manager_id,
      salary_fixed, salary_variable, salary_incentive,
      password,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Check if email already exists
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    // Create user account
    const passwordHash = await bcrypt.hash(password || 'changeme123', 10);
    const { rows: userRows } = await query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, 'employee', $3)
       RETURNING id`,
      [email, passwordHash, name]
    );
    const userId = userRows[0].id;

    // Create employee record
    const { rows: empRows } = await query(
      `INSERT INTO employees
        (user_id, name, role_title, department, email, phone, joining_date,
         reporting_manager_id, salary_fixed, salary_variable, salary_incentive)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId, name, role_title || null, department || null,
        email, phone || null, joining_date || null,
        reporting_manager_id || null,
        salary_fixed || 0, salary_variable || 0, salary_incentive || 0,
      ]
    );

    res.status(201).json(empRows[0]);
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/employees/:id  (admin only)
router.put('/:id', roleCheck('admin'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const {
      name, role_title, department, phone,
      reporting_manager_id, salary_fixed, salary_variable,
      salary_incentive, is_active,
    } = req.body;

    const { rows: existing } = await query(
      'SELECT * FROM employees WHERE id = $1',
      [employeeId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const emp = existing[0];

    const { rows } = await query(
      `UPDATE employees SET
        name = $1, role_title = $2, department = $3, phone = $4,
        reporting_manager_id = $5, salary_fixed = $6, salary_variable = $7,
        salary_incentive = $8, is_active = $9
       WHERE id = $10
       RETURNING *`,
      [
        name ?? emp.name,
        role_title ?? emp.role_title,
        department ?? emp.department,
        phone ?? emp.phone,
        reporting_manager_id ?? emp.reporting_manager_id,
        salary_fixed ?? emp.salary_fixed,
        salary_variable ?? emp.salary_variable,
        salary_incentive ?? emp.salary_incentive,
        is_active ?? emp.is_active,
        employeeId,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/employees/:id  (admin only)
router.delete('/:id', roleCheck('admin'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);

    const { rows: existing } = await query(
      'SELECT * FROM employees WHERE id = $1',
      [employeeId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const emp = existing[0];

    // Delete employee (cascades to kpi_scores, targets, incentives, etc.)
    await query('DELETE FROM employees WHERE id = $1', [employeeId]);

    // Also delete the linked user account
    if (emp.user_id) {
      await query('DELETE FROM users WHERE id = $1', [emp.user_id]);
    }

    res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/employees/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);

    // Employees can only view their own history
    if (req.user.role === 'employee') {
      const { rows: check } = await query(
        'SELECT id FROM employees WHERE id = $1 AND user_id = $2',
        [employeeId, req.user.id]
      );
      if (check.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const { rows } = await query(
      `SELECT ph.*,
        ks.breakdown AS kpi_breakdown,
        i.final_amount AS incentive_amount
       FROM performance_history ph
       LEFT JOIN kpi_scores ks ON ks.employee_id = ph.employee_id
         AND ks.month = ph.month AND ks.year = ph.year
       LEFT JOIN incentives i ON i.employee_id = ph.employee_id
         AND i.month = ph.month AND i.year = ph.year
       WHERE ph.employee_id = $1
       ORDER BY ph.year DESC, ph.month DESC`,
      [employeeId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get employee history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
