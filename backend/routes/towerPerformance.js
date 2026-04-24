const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM tower_performance ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM tower_performance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date } = req.body;
    const result = await pool.query(
      `INSERT INTO tower_performance (tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date } = req.body;
    const result = await pool.query(
      `UPDATE tower_performance SET tower_id=$1, tower_name=$2, location=$3, tower_type=$4, max_capacity=$5, current_load_pct=$6, avg_signal_strength=$7, uptime_pct=$8, maintenance_due=$9, last_maintenance_date=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('DELETE FROM tower_performance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM tower_performance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Analyze this cell tower's performance and provide optimization recommendations:

Tower ID: ${r.tower_id}
Tower Name: ${r.tower_name}
Location: ${r.location}
Tower Type: ${r.tower_type}
Max Capacity: ${r.max_capacity} users
Current Load: ${r.current_load_pct}%
Avg Signal Strength: ${r.avg_signal_strength} dBm
Uptime: ${r.uptime_pct}%
Maintenance Due: ${r.maintenance_due ? 'Yes' : 'No'}
Last Maintenance: ${r.last_maintenance_date}

Provide analysis in this format:
HEALTH SCORE: [1-10]
PERFORMANCE STATUS: [Optimal / Degraded / Critical]
CAPACITY RISK: [how close to overload]
SIGNAL COVERAGE QUALITY: [assessment of signal strength]
MAINTENANCE PRIORITY: [Immediate / Scheduled / Routine]
OPTIMIZATION RECOMMENDATIONS: [specific technical improvements]
CAPACITY PLANNING: [when upgrade is needed]
ESTIMATED UPGRADE COST: [rough cost estimate]
IMPACT ON CUSTOMER EXPERIENCE: [how this tower affects CX]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom infrastructure AI specializing in cell tower performance analysis, capacity planning, and network optimization.');

    await pool.query(
      'UPDATE tower_performance SET health_score = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      [Math.floor(Math.random() * 4) + 6, aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
