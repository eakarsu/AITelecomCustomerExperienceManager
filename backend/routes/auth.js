const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Local demo sign-in uses the configured account without exposing its password.
// It never creates an account or changes credentials.
router.post('/demo-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return res.status(503).json({ error: 'Demo account credentials are not configured.' });
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(503).json({ error: 'Configured demo account is unavailable.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (_error) {
    return res.status(503).json({ error: 'Configured demo account is unavailable.' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Session user no longer exists' });
    res.json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ error: 'Unable to verify persisted session' });
  }
});

module.exports = router;
