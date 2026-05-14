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
    const countResult = await pool.query('SELECT COUNT(*) FROM tower_performance');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM tower_performance ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
      [tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date],
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
      [tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date, req.params.id],
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

router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM tower_performance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Analyze this cell tower performance and return ONLY valid JSON:

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

Return JSON with this exact structure:
{
  "health_score": 8,
  "performance_status": "Optimal",
  "capacity_risk": "Low - 30% headroom available",
  "signal_coverage_quality": "Good signal coverage",
  "maintenance_priority": "Scheduled",
  "optimization_recommendations": ["rec1", "rec2"],
  "capacity_planning": "Upgrade recommended in 18 months",
  "estimated_upgrade_cost": "$45000",
  "customer_experience_impact": "Minimal impact on customer experience"
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom infrastructure AI specializing in cell tower performance analysis. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    // Use parsed health_score — no Math.random()
    const healthScore = parsed?.health_score != null ? parseFloat(parsed.health_score) : null;

    await pool.query(
      'UPDATE tower_performance SET health_score = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      [healthScore, aiResponse.content, req.params.id],
    );

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'tower-performance/analyze', r, parsed || { raw: aiResponse.content });

    res.json({ analysis: aiResponse.content, parsed, health_score: healthScore, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
