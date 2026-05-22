const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const auth = require('../middleware/auth');
const { queryOpenRouter, parseAIJson, saveAIResult } = require('./aiHelper');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req),
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
    const countResult = await pool.query('SELECT COUNT(*) FROM call_quality');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM call_quality ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms } = req.body;
    const result = await pool.query(
      `INSERT INTO call_quality (customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms } = req.body;
    const result = await pool.query(
      `UPDATE call_quality SET customer_name=$1, phone_number=$2, call_duration=$3, signal_strength=$4, network_type=$5, location=$6, jitter_ms=$7, packet_loss_pct=$8, latency_ms=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms, req.params.id],
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
    const result = await pool.query('DELETE FROM call_quality WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM call_quality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze this telecom call quality data and return ONLY valid JSON:

Customer: ${record.customer_name}
Call Duration: ${record.call_duration} seconds
Signal Strength: ${record.signal_strength} dBm
Network Type: ${record.network_type}
Location: ${record.location}
Jitter: ${record.jitter_ms} ms
Packet Loss: ${record.packet_loss_pct}%
Latency: ${record.latency_ms} ms

Return JSON with this exact structure:
{
  "quality_score": 7,
  "risk_level": "Medium",
  "issues": ["issue1", "issue2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "predicted_impact": "description of impact if not addressed",
  "root_cause": "primary root cause"
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom network quality analyst AI. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    // Use parsed score — no Math.random()
    const qualityScore = parsed?.quality_score != null ? parseFloat(parsed.quality_score) : null;
    const riskLevel = parsed?.risk_level || 'Unknown';

    await pool.query(
      'UPDATE call_quality SET quality_score = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      [qualityScore, aiResponse.content, req.params.id],
    );

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'call-quality/predict', record, parsed || { raw: aiResponse.content });

    res.json({ analysis: aiResponse.content, parsed, quality_score: qualityScore, risk_level: riskLevel, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
