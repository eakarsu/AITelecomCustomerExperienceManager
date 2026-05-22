const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { queryOpenRouter, parseAIJson, saveAIResult } = require('./aiHelper');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req),
  message: { error: 'Too many AI requests. Limit: 20 per hour.' },
  standardHeaders: true, legacyHeaders: false,
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM network_outages');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM network_outages ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM network_outages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached } = req.body;
    const result = await pool.query(
      `INSERT INTO network_outages (region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached } = req.body;
    const result = await pool.query(
      `UPDATE network_outages SET region=$1, outage_type=$2, affected_towers=$3, affected_customers=$4, start_time=$5, duration_minutes=$6, severity=$7, root_cause=$8, restoration_status=$9, sla_breached=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached, req.params.id]
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
    const result = await pool.query('DELETE FROM network_outages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM network_outages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Analyze this network outage incident and provide impact assessment and recovery recommendations:

Region: ${r.region}
Outage Type: ${r.outage_type}
Affected Towers: ${r.affected_towers}
Affected Customers: ${r.affected_customers}
Start Time: ${r.start_time}
Duration: ${r.duration_minutes} minutes
Severity: ${r.severity}
Root Cause: ${r.root_cause}
Restoration Status: ${r.restoration_status}
SLA Breached: ${r.sla_breached ? 'Yes' : 'No'}

Provide analysis in this format:
IMPACT ASSESSMENT: [overall impact on customers and services]
SEVERITY CLASSIFICATION: [P1-P4 with justification]
AFFECTED SERVICES: [list all impacted services]
RECOVERY PLAN: [step-by-step recovery actions]
ESTIMATED RECOVERY TIME: [hours/days]
CUSTOMER COMMUNICATION: [recommended notification to customers]
PREVENTIVE MEASURES: [how to prevent recurrence]
FINANCIAL IMPACT: [estimated revenue loss and SLA penalties]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom network operations AI specializing in outage analysis, impact assessment, and recovery planning.');

    await pool.query(
      'UPDATE network_outages SET ai_analysis = $1, updated_at = NOW() WHERE id = $2',
      [aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
