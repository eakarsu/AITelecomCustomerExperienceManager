const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all customer profiles
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM customer_profiles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM customer_profiles WHERE id = $1', [req.params.id]);
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
    const { customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact } = req.body;
    const result = await pool.query(
      `INSERT INTO customer_profiles (customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact]
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
    const { customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact } = req.body;
    const result = await pool.query(
      `UPDATE customer_profiles SET customer_name=$1, email=$2, phone_number=$3, address=$4, city=$5, state=$6, zip_code=$7, plan_type=$8, account_status=$9, join_date=$10, monthly_bill=$11, preferred_contact=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact, req.params.id]
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
    const result = await pool.query('DELETE FROM customer_profiles WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
