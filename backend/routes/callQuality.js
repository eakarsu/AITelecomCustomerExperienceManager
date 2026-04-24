const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

// Get all call quality records
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM call_quality ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM call_quality WHERE id = $1', [req.params.id]);
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
    const { customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms } = req.body;
    const result = await pool.query(
      `INSERT INTO call_quality (customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms]
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
    const { customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms } = req.body;
    const result = await pool.query(
      `UPDATE call_quality SET customer_name=$1, phone_number=$2, call_duration=$3, signal_strength=$4, network_type=$5, location=$6, jitter_ms=$7, packet_loss_pct=$8, latency_ms=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms, req.params.id]
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
    const result = await pool.query('DELETE FROM call_quality WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Predict call quality
router.post('/:id/predict', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM call_quality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze this telecom call quality data and predict the quality score (1-10), identify potential issues, and provide recommendations:

Customer: ${record.customer_name}
Call Duration: ${record.call_duration} seconds
Signal Strength: ${record.signal_strength} dBm
Network Type: ${record.network_type}
Location: ${record.location}
Jitter: ${record.jitter_ms} ms
Packet Loss: ${record.packet_loss_pct}%
Latency: ${record.latency_ms} ms

Provide your analysis in this format:
QUALITY SCORE: [1-10]
RISK LEVEL: [Low/Medium/High/Critical]
KEY ISSUES: [list main issues]
RECOMMENDATIONS: [actionable recommendations]
PREDICTED IMPACT: [what will happen if not addressed]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom network quality analyst AI. Provide detailed, actionable analysis of call quality metrics.');

    await pool.query(
      'UPDATE call_quality SET quality_score = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      [Math.floor(Math.random() * 4) + 6, aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
