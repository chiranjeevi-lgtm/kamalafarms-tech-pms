const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/targets
router.get('/', async (req, res) => {
  try {
    const { month, year, employee_id } = req.query;
    const params = [];
    let sql = `
      SELECT t.*, e.name AS employee_name, e.department,
        u.name AS set_by_name
      FROM targets t
      JOIN employees e ON t.employee_id = e.id
      LEFT JOIN users u ON t.set_by = u.id
      WHERE 1=1
    `;

    // Role-based filtering: employees only see their own targets
    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND t.employee_id = $${params.length}`;
      } else {
        return res.json([]);
      }
    } else if (employee_id) {
      params.push(parseInt(employee_id, 10));
      sql += ` AND t.employee_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      sql += ` AND t.month = $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      sql += ` AND t.year = $${params.length}`;
    }

    sql += ' ORDER BY t.year DESC, t.month DESC, t.created_at DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List targets error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/targets
router.post('/', async (req, res) => {
  try {
    const { employee_id, month, year, target_type, target_value, notes } = req.body;

    if (!employee_id || !month || !year || !target_type) {
      return res.status(400).json({
        error: 'employee_id, month, year, and target_type are required.',
      });
    }

    // Determine status based on role
    let status = 'pending';
    let setBy = req.user.id;

    if (req.user.role === 'admin' || req.user.role === 'manager') {
      status = 'approved';
    } else {
      // Employees can only create targets for themselves
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length === 0 || empRows[0].id !== parseInt(employee_id, 10)) {
        return res.status(403).json({ error: 'You can only set targets for yourself.' });
      }
    }

    const { rows } = await query(
      `INSERT INTO targets (employee_id, month, year, target_type, target_value, status, set_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [employee_id, month, year, target_type, target_value || 0, status, setBy, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'A target with this type already exists for the employee in the specified month.',
      });
    }
    console.error('Create target error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/targets/:id
router.put('/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { target_value, notes, target_type } = req.body;

    const { rows: existing } = await query('SELECT * FROM targets WHERE id = $1', [targetId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Target not found.' });
    }

    const target = existing[0];

    // Employees can only update their own pending targets
    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length === 0 || empRows[0].id !== target.employee_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      if (target.status !== 'pending') {
        return res.status(400).json({ error: 'You can only edit pending targets.' });
      }
    }

    const { rows } = await query(
      `UPDATE targets SET
        target_value = $1, notes = $2, target_type = $3
       WHERE id = $4
       RETURNING *`,
      [
        target_value ?? target.target_value,
        notes ?? target.notes,
        target_type ?? target.target_type,
        targetId,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update target error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/targets/:id/approve  (admin/manager only)
router.put('/:id/approve', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    const { rows: existing } = await query('SELECT * FROM targets WHERE id = $1', [targetId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Target not found.' });
    }

    if (existing[0].status === 'approved') {
      return res.status(400).json({ error: 'Target is already approved.' });
    }

    const { rows } = await query(
      `UPDATE targets SET status = 'approved', set_by = $1 WHERE id = $2 RETURNING *`,
      [req.user.id, targetId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Approve target error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
