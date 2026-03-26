const express = require('express');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authenticate);

// GET /api/reviews - List reviews
router.get('/', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const params = [];
    let sql = `
      SELECT r.*, e.name AS employee_name, e.department
      FROM reviews r
      JOIN employees e ON r.employee_id = e.id
      WHERE 1=1
    `;

    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length > 0) {
        params.push(empRows[0].id);
        sql += ` AND r.employee_id = $${params.length}`;
      } else {
        return res.json([]);
      }
    } else if (employee_id) {
      params.push(parseInt(employee_id, 10));
      sql += ` AND r.employee_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      sql += ` AND r.month = $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year, 10));
      sql += ` AND r.year = $${params.length}`;
    }

    sql += ' ORDER BY r.year DESC, r.month DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reviews/:id - Get single review
router.get('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);

    const { rows } = await query(
      `SELECT r.*, e.name AS employee_name, e.department
       FROM reviews r
       JOIN employees e ON r.employee_id = e.id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Employees can only view their own reviews
    if (req.user.role === 'employee') {
      const { rows: empRows } = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empRows.length === 0 || empRows[0].id !== rows[0].employee_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reviews - Create review (admin/manager)
router.post('/', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { employee_id, month, year, kpi_score, zone, incentive_earned, manager_comments, ai_feedback } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({
        error: 'employee_id, month, and year are required.',
      });
    }

    const { rows } = await query(
      `INSERT INTO reviews (employee_id, month, year, kpi_score, zone, incentive_earned, manager_comments, ai_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (employee_id, month, year)
       DO UPDATE SET kpi_score = $4, zone = $5, incentive_earned = $6, manager_comments = $7, ai_feedback = $8
       RETURNING *`,
      [
        employee_id, month, year,
        kpi_score || null, zone || null, incentive_earned || 0,
        manager_comments || null, ai_feedback || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/reviews/:id - Update review (admin/manager)
router.put('/:id', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { manager_comments, ai_feedback, email_sent } = req.body;

    const { rows: existing } = await query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const review = existing[0];

    const { rows } = await query(
      `UPDATE reviews SET
        manager_comments = $1, ai_feedback = $2, email_sent = $3,
        sent_at = $4
       WHERE id = $5
       RETURNING *`,
      [
        manager_comments ?? review.manager_comments,
        ai_feedback ?? review.ai_feedback,
        email_sent ?? review.email_sent,
        email_sent ? new Date() : review.sent_at,
        reviewId,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reviews/generate - Generate reviews for all employees for a month
router.post('/generate', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year are required.' });
    }

    // Get all active employees
    const { rows: employees } = await query(
      'SELECT * FROM employees WHERE is_active = 1'
    );

    const { generateInsights } = require('../services/aiInsights');
    const results = [];

    for (const emp of employees) {
      // Get KPI score for this month
      const { rows: scoreRows } = await query(
        'SELECT * FROM kpi_scores WHERE employee_id = $1 AND month = $2 AND year = $3',
        [emp.id, month, year]
      );

      if (scoreRows.length === 0) continue;

      const kpiScore = scoreRows[0];

      // Get incentive
      const { rows: incRows } = await query(
        'SELECT * FROM incentives WHERE employee_id = $1 AND month = $2 AND year = $3',
        [emp.id, month, year]
      );

      const incentiveEarned = incRows.length > 0 ? parseFloat(incRows[0].final_amount) : 0;

      // Get KPI history for AI insights
      const { rows: history } = await query(
        'SELECT * FROM kpi_scores WHERE employee_id = $1 ORDER BY year DESC, month DESC LIMIT 6',
        [emp.id]
      );

      // Generate AI feedback
      const insights = generateInsights(emp, history, emp.department);
      const aiFeedback = insights.map(i => `[${i.type.toUpperCase()}] ${i.message}`).join('\n');

      // Upsert review
      const { rows: reviewRows } = await query(
        `INSERT INTO reviews (employee_id, month, year, kpi_score, zone, incentive_earned, ai_feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (employee_id, month, year)
         DO UPDATE SET kpi_score = $4, zone = $5, incentive_earned = $6, ai_feedback = $7
         RETURNING *`,
        [emp.id, month, year, kpiScore.total_score, kpiScore.zone, incentiveEarned, aiFeedback]
      );

      results.push({ ...reviewRows[0], employee_name: emp.name, department: emp.department });
    }

    res.status(201).json({ generated: results.length, reviews: results });
  } catch (err) {
    console.error('Generate reviews error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reviews/:id/send-email - Send review email
router.post('/:id/send-email', roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);

    const { rows } = await query(
      `SELECT r.*, e.name AS employee_name, e.email AS employee_email, e.department
       FROM reviews r JOIN employees e ON r.employee_id = e.id WHERE r.id = $1`,
      [reviewId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Review not found.' });

    const review = rows[0];
    const EmailService = require('../services/emailService');
    const emailService = new EmailService();

    const result = await emailService.sendReviewEmail(
      { name: review.employee_name, email: review.employee_email },
      review
    );

    if (result.success) {
      await query('UPDATE reviews SET email_sent = true, sent_at = NOW() WHERE id = $1', [reviewId]);
      res.json({ success: true, message: 'Email sent successfully.' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
