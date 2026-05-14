const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { queryOpenRouter, parseAIJson, saveAIResult } = require('./aiHelper');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : req.ip,
  message: { error: 'Too many AI requests. Limit: 20 per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM dropped_calls');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM dropped_calls ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM dropped_calls WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users } = req.body;
    const result = await pool.query(
      `INSERT INTO dropped_calls (customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users } = req.body;
    const result = await pool.query(
      `UPDATE dropped_calls SET customer_name=$1, phone_number=$2, call_time=$3, duration_before_drop=$4, location=$5, cell_tower_id=$6, network_type=$7, signal_strength=$8, weather_condition=$9, concurrent_users=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users, req.params.id]
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
    const result = await pool.query('DELETE FROM dropped_calls WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM dropped_calls WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Perform a root cause analysis on this dropped call incident:

Customer: ${record.customer_name}
Call Time: ${record.call_time}
Duration Before Drop: ${record.duration_before_drop} seconds
Location: ${record.location}
Cell Tower ID: ${record.cell_tower_id}
Network Type: ${record.network_type}
Signal Strength: ${record.signal_strength} dBm
Weather: ${record.weather_condition}
Concurrent Users on Tower: ${record.concurrent_users}

Provide analysis in this format:
ROOT CAUSE: [primary cause]
CONTRIBUTING FACTORS: [list of contributing factors]
SEVERITY: [Low/Medium/High/Critical]
RECOMMENDED FIX: [specific technical recommendations]
PREVENTION STRATEGY: [how to prevent recurrence]
ESTIMATED RESOLUTION TIME: [timeframe]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom network engineer AI specializing in root cause analysis of dropped calls. Provide thorough technical analysis.');

    await pool.query(
      'UPDATE dropped_calls SET root_cause = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      [aiResponse.content.substring(0, 200), aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
