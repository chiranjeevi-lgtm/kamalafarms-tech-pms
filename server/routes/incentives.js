const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authenticate);

// GET /api/incentives - List incentives
router.get('/', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const params = [];
    let sql = `
      SELECT i.*, e.name AS employee_name, e.department
      FROM incentives i
      JOIN employees e ON i.employee_id = e.id
      WHERE 1=1
    `;

    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND i.employee_id = $${params.length}`;
      } else {
        return res.json([]);
      }
    } else if (employee_id) {
      params.push(parseInt(employee_id, 10));
      sql += ` AND i.employee_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      sql += ` AND i.month = $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year, 10));
      sql += ` AND i.year = $${params.length}`;
    }

    sql += ' ORDER BY i.year DESC, i.month DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List incentives error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/incentives - Create incentive (admin/manager)
router.post('/', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, base_amount, multiplier, final_amount, incentive_type, details } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({
        error: 'employee_id, month, and year are required.',
      });
    }

    const { rows } = await query(
      `INSERT INTO incentives (employee_id, month, year, base_amount, multiplier, final_amount, incentive_type, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET base_amount = $4, multiplier = $5, final_amount = $6, incentive_type = $7, details = $8
       RETURNING *`,
      [
        employee_id, month, year,
        base_amount || 0, multiplier || 1, final_amount || 0,
        incentive_type || null,
        details ? JSON.stringify(details) : null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create incentive error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
