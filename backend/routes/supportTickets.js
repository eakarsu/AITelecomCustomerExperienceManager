const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all support tickets
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new record
router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, subject, description, category, priority, status, assigned_agent, channel, resolution_notes } = req.body;
    const ticket_number = 'TKT-' + Date.now().toString(36).toUpperCase();
    const result = await pool.query(
      `INSERT INTO support_tickets (ticket_number, customer_name, subject, description, category, priority, status, assigned_agent, channel, resolution_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [ticket_number, customer_name, subject, description, category, priority, status || 'Open', assigned_agent, channel, resolution_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update record
router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, subject, description, category, priority, status, assigned_agent, channel, resolution_notes } = req.body;
    const result = await pool.query(
      `UPDATE support_tickets SET customer_name=$1, subject=$2, description=$3, category=$4, priority=$5, status=$6, assigned_agent=$7, channel=$8, resolution_notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, subject, description, category, priority, status, assigned_agent, channel, resolution_notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete record
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('DELETE FROM support_tickets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
