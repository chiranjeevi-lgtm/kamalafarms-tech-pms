const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authenticate);

// GET /api/kpi - List KPI entries with optional filters
router.get('/', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const params = [];
    let sql = `
      SELECT ke.*, e.name AS employee_name, e.department AS emp_department
      FROM kpi_entries ke
      JOIN employees e ON ke.employee_id = e.id
      WHERE 1=1
    `;

    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND ke.employee_id = $${params.length}`;
      } else {
        return res.json([]);
      }
    } else if (employee_id) {
      params.push(parseInt(employee_id, 10));
      sql += ` AND ke.employee_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      sql += ` AND ke.month = $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year, 10));
      sql += ` AND ke.year = $${params.length}`;
    }

    sql += ' ORDER BY ke.year DESC, ke.month DESC, ke.metric_name ASC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List KPI entries error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/kpi/scores - List KPI scores
router.get('/scores', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const params = [];
    let sql = `
      SELECT ks.*, e.name AS employee_name, e.department
      FROM kpi_scores ks
      JOIN employees e ON ks.employee_id = e.id
      WHERE 1=1
    `;

    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND ks.employee_id = $${params.length}`;
      } else {
        return res.json([]);
      }
    } else if (employee_id) {
      params.push(parseInt(employee_id, 10));
      sql += ` AND ks.employee_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      sql += ` AND ks.month = $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year, 10));
      sql += ` AND ks.year = $${params.length}`;
    }

    sql += ' ORDER BY ks.year DESC, ks.month DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List KPI scores error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/kpi/entries - Create KPI entry (admin/manager)
router.post('/entries', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, metric_name, metric_value, department } = req.body;

    if (!employee_id || !month || !year || !metric_name) {
      return res.status(400).json({
        error: 'employee_id, month, year, and metric_name are required.',
      });
    }

    const { rows } = await query(
      `INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employee_id, month, year, department || null, metric_name, metric_value || 0]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'KPI entry already exists for this metric/period.' });
    }
    console.error('Create KPI entry error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/kpi/scores - Create/update KPI score (admin/manager)
router.post('/scores', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, total_score, zone, breakdown } = req.body;

    if (!employee_id || !month || !year || total_score === undefined) {
      return res.status(400).json({
        error: 'employee_id, month, year, and total_score are required.',
      });
    }

    const { rows } = await query(
      `INSERT INTO kpi_scores (employee_id, month, year, total_score, zone, breakdown)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET total_score = $4, zone = $5, breakdown = $6, calculated_at = NOW()
       RETURNING *`,
      [employee_id, month, year, total_score, zone || null, breakdown ? JSON.stringify(breakdown) : null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create KPI score error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/kpi/bulk-entries - Create multiple KPI entries at once (admin/manager)
router.post('/bulk-entries', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, department, metrics } = req.body;

    if (!employee_id || !month || !year || !metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        error: 'employee_id, month, year, and metrics object are required.',
      });
    }

    const results = [];
    for (const [metric_name, metric_value] of Object.entries(metrics)) {
      const { rows } = await query(
        `INSERT INTO kpi_entries (employee_id, month, year, department, metric_name, metric_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (employee_id, month, year, metric_name)
         DO UPDATE SET metric_value = $6
         RETURNING *`,
        [employee_id, month, year, department || null, metric_name, parseFloat(metric_value) || 0]
      );
      results.push(rows[0]);
    }

    res.status(201).json(results);
  } catch (err) {
    console.error('Bulk KPI entry error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/kpi/calculate - Calculate KPI score for an employee (admin/manager)
router.post('/calculate', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({ error: 'employee_id, month, and year are required.' });
    }

    // Get employee department
    const { rows: empRows } = await query('SELECT * FROM employees WHERE id = $1', [employee_id]);
    if (empRows.length === 0) return res.status(404).json({ error: 'Employee not found.' });

    const employee = empRows[0];

    // Get all KPI entries for this employee/month
    const { rows: entries } = await query(
      'SELECT metric_name, metric_value FROM kpi_entries WHERE employee_id = $1 AND month = $2 AND year = $3',
      [employee_id, month, year]
    );

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No KPI entries found for this period.' });
    }

    // Build metrics object
    const metrics = {};
    entries.forEach(e => { metrics[e.metric_name] = parseFloat(e.metric_value); });

    // Calculate score
    const { calculateKpiScore } = require('../services/kpiCalculator');
    const { score, breakdown } = calculateKpiScore(employee.department, metrics);

    // Classify zone
    const { classifyZone, updatePerformanceStatus } = require('../services/zoneClassifier');
    const zone = classifyZone(score);

    // Upsert KPI score
    await query(
      `INSERT INTO kpi_scores (employee_id, month, year, total_score, zone, breakdown)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET total_score = $4, zone = $5, breakdown = $6, calculated_at = NOW()`,
      [employee_id, month, year, score, zone, JSON.stringify(breakdown)]
    );

    // Update performance history
    const { rows: historyRows } = await query(
      `SELECT * FROM performance_history WHERE employee_id = $1 ORDER BY year DESC, month DESC LIMIT 6`,
      [employee_id]
    );

    const { consecutive_red_count, status } = updatePerformanceStatus(zone, historyRows);

    await query(
      `INSERT INTO performance_history (employee_id, month, year, score, zone, consecutive_red_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET score = $4, zone = $5, consecutive_red_count = $6, status = $7`,
      [employee_id, month, year, score, zone, consecutive_red_count, status]
    );

    // Calculate incentive
    const { calculateIncentive } = require('../services/incentiveCalc');
    const incentive = calculateIncentive(employee.department, metrics, score, zone);

    await query(
      `INSERT INTO incentives (employee_id, month, year, base_amount, multiplier, final_amount, incentive_type, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET base_amount = $4, multiplier = $5, final_amount = $6, incentive_type = $7, details = $8`,
      [employee_id, month, year, incentive.base_amount, incentive.multiplier, incentive.final_amount,
       employee.department, JSON.stringify(incentive.details)]
    );

    res.json({
      employee_id,
      month,
      year,
      score,
      zone,
      breakdown,
      status,
      consecutive_red_count,
      incentive
    });
  } catch (err) {
    console.error('Calculate KPI error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
