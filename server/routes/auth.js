const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id, email, role, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRows[0];

    // Fetch linked employee record if one exists
    const { rows: empRows } = await query(
      `SELECT e.*, ks.total_score AS latest_score, ks.zone AS latest_zone
       FROM employees e
       LEFT JOIN kpi_scores ks ON ks.employee_id = e.id
         AND ks.id = (
           SELECT id FROM kpi_scores
           WHERE employee_id = e.id
           ORDER BY year DESC, month DESC LIMIT 1
         )
       WHERE e.user_id = $1`,
      [req.user.id]
    );

    res.json({
      ...user,
      employee: empRows.length > 0 ? empRows[0] : null,
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
