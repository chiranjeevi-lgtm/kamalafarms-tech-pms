const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

// All dashboard routes require admin or manager role
router.use(authenticate);
router.use(roleCheck('admin', 'manager'));

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const totalResult = await query(
      'SELECT COUNT(*) AS total FROM employees WHERE is_active = 1'
    );

    const zoneResult = await query(`
      SELECT ks.zone, COUNT(DISTINCT ks.employee_id) AS count
      FROM kpi_scores ks
      INNER JOIN (
        SELECT employee_id, MAX(year * 100 + month) AS max_period
        FROM kpi_scores GROUP BY employee_id
      ) latest ON ks.employee_id = latest.employee_id
        AND (ks.year * 100 + ks.month) = latest.max_period
      JOIN employees e ON e.id = ks.employee_id AND e.is_active = 1
      GROUP BY ks.zone
    `);

    const atRiskResult = await query(`
      SELECT COUNT(DISTINCT employee_id) AS count
      FROM performance_history
      WHERE status = 'at_risk'
        AND (year * 100 + month) = (
          SELECT MAX(year * 100 + month) FROM performance_history
        )
    `);

    const layoffResult = await query(`
      SELECT COUNT(DISTINCT employee_id) AS count
      FROM performance_history
      WHERE status = 'layoff_recommended'
        AND (year * 100 + month) = (
          SELECT MAX(year * 100 + month) FROM performance_history
        )
    `);

    const zoneDistribution = {};
    zoneResult.rows.forEach((r) => {
      zoneDistribution[r.zone] = parseInt(r.count, 10);
    });

    res.json({
      total_employees: parseInt(totalResult.rows[0].total, 10),
      zone_distribution: zoneDistribution,
      at_risk_count: parseInt(atRiskResult.rows[0].count, 10),
      layoff_recommended_count: parseInt(layoffResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const { rows } = await query(
      `SELECT e.name, e.department, ks.total_score AS score, ks.zone
       FROM kpi_scores ks
       INNER JOIN (
         SELECT employee_id, MAX(year * 100 + month) AS max_period
         FROM kpi_scores GROUP BY employee_id
       ) latest ON ks.employee_id = latest.employee_id
         AND (ks.year * 100 + ks.month) = latest.max_period
       JOIN employees e ON e.id = ks.employee_id AND e.is_active = 1
       ORDER BY ks.total_score DESC
       LIMIT $1`,
      [limit]
    );

    res.json(rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/trends
router.get('/trends', async (req, res) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;

    const { rows } = await query(
      `SELECT ks.month, ks.year,
        ROUND(AVG(ks.total_score), 2) AS avg_score,
        COUNT(DISTINCT ks.employee_id) AS employee_count
       FROM kpi_scores ks
       JOIN employees e ON e.id = ks.employee_id AND e.is_active = 1
       GROUP BY ks.year, ks.month
       ORDER BY ks.year DESC, ks.month DESC
       LIMIT $1`,
      [months]
    );

    res.json(rows.reverse());
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/zone-distribution
router.get('/zone-distribution', async (req, res) => {
  try {
    const { month, year } = req.query;
    let sql;
    let params = [];

    if (month && year) {
      sql = `
        SELECT ks.zone, COUNT(DISTINCT ks.employee_id) AS count
        FROM kpi_scores ks
        JOIN employees e ON e.id = ks.employee_id AND e.is_active = 1
        WHERE ks.month = $1 AND ks.year = $2
        GROUP BY ks.zone
      `;
      params = [parseInt(month, 10), parseInt(year, 10)];
    } else {
      sql = `
        SELECT ks.zone, COUNT(DISTINCT ks.employee_id) AS count
        FROM kpi_scores ks
        INNER JOIN (
          SELECT employee_id, MAX(year * 100 + month) AS max_period
          FROM kpi_scores GROUP BY employee_id
        ) latest ON ks.employee_id = latest.employee_id
          AND (ks.year * 100 + ks.month) = latest.max_period
        JOIN employees e ON e.id = ks.employee_id AND e.is_active = 1
        GROUP BY ks.zone
      `;
    }

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Zone distribution error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT ph.*, e.name, e.department, e.email
      FROM performance_history ph
      JOIN employees e ON e.id = ph.employee_id AND e.is_active = 1
      WHERE ph.status IN ('at_risk', 'layoff_recommended')
        AND (ph.year * 100 + ph.month) = (
          SELECT MAX(year * 100 + month) FROM performance_history
        )
      ORDER BY ph.status DESC, ph.score ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
