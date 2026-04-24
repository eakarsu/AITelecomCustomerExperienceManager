const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all payment records
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM payment_history ORDER BY payment_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM payment_history WHERE id = $1', [req.params.id]);
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
    const { customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO payment_history (customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes]
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
    const { customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes } = req.body;
    const result = await pool.query(
      `UPDATE payment_history SET customer_name=$1, account_number=$2, payment_date=$3, amount=$4, payment_method=$5, transaction_id=$6, billing_period=$7, plan_type=$8, payment_status=$9, late_fee=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes, req.params.id]
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
    const result = await pool.query('DELETE FROM payment_history WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
