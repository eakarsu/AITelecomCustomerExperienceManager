const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all appointments
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM appointments ORDER BY appointment_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
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
    const { customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status, contact_phone, notes, estimated_duration_min } = req.body;
    const result = await pool.query(
      `INSERT INTO appointments (customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status, contact_phone, notes, estimated_duration_min)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status || 'Scheduled', contact_phone, notes, estimated_duration_min]
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
    const { customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status, contact_phone, notes, estimated_duration_min } = req.body;
    const result = await pool.query(
      `UPDATE appointments SET customer_name=$1, appointment_date=$2, appointment_time=$3, appointment_type=$4, technician_name=$5, location=$6, status=$7, contact_phone=$8, notes=$9, estimated_duration_min=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status, contact_phone, notes, estimated_duration_min, req.params.id]
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
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
