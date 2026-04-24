const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all usage records
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM usage_tracking ORDER BY usage_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM usage_tracking WHERE id = $1', [req.params.id]);
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
    const { customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type } = req.body;
    const result = await pool.query(
      `INSERT INTO usage_tracking (customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type]
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
    const { customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type } = req.body;
    const result = await pool.query(
      `UPDATE usage_tracking SET customer_name=$1, usage_date=$2, data_used_gb=$3, data_limit_gb=$4, call_minutes_used=$5, call_minutes_limit=$6, sms_sent=$7, sms_limit=$8, roaming_data_mb=$9, hotspot_usage_gb=$10, plan_type=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type, req.params.id]
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
    const result = await pool.query('DELETE FROM usage_tracking WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
