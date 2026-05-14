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

function getNpsCategory(score) {
  if (score == null) return 'Unknown';
  if (score <= 6) return 'Detractor';
  if (score <= 8) return 'Passive';
  return 'Promoter';
}

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM nps_predictions');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM nps_predictions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM nps_predictions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score } = req.body;
    const result = await pool.query(
      `INSERT INTO nps_predictions (customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score } = req.body;
    const result = await pool.query(
      `UPDATE nps_predictions SET customer_name=$1, customer_segment=$2, tenure_months=$3, monthly_charges=$4, total_charges=$5, num_support_tickets=$6, avg_response_time_hours=$7, service_outages_30d=$8, billing_issues_90d=$9, feature_adoption_score=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score, req.params.id],
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
    const result = await pool.query('DELETE FROM nps_predictions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM nps_predictions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Predict the NPS for this telecom customer and return ONLY valid JSON:

Customer: ${record.customer_name}
Segment: ${record.customer_segment}
Tenure: ${record.tenure_months} months
Monthly Charges: $${record.monthly_charges}
Total Charges: $${record.total_charges}
Support Tickets: ${record.num_support_tickets}
Avg Response Time: ${record.avg_response_time_hours} hours
Service Outages (30d): ${record.service_outages_30d}
Billing Issues (90d): ${record.billing_issues_90d}
Feature Adoption Score: ${record.feature_adoption_score}/10

Return JSON with this exact structure:
{
  "nps_score": 7,
  "nps_category": "Passive",
  "confidence_pct": 82,
  "key_drivers": ["driver1", "driver2"],
  "improvement_areas": ["area1", "area2"],
  "risk_factors": ["risk1"],
  "engagement_strategy": "specific engagement strategy for this customer"
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer experience analytics AI specializing in NPS prediction. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    // Use parsed NPS score — no Math.random()
    const npsScore = parsed?.nps_score != null ? parseFloat(parsed.nps_score) : null;
    const npsCategory = parsed?.nps_category || getNpsCategory(npsScore);

    await pool.query(
      'UPDATE nps_predictions SET predicted_nps = $1, nps_category = $2, ai_analysis = $3, updated_at = NOW() WHERE id = $4',
      [npsScore, npsCategory, aiResponse.content, req.params.id],
    );

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'nps-prediction/predict', record, parsed || { raw: aiResponse.content });

    res.json({ analysis: aiResponse.content, parsed, nps_score: npsScore, nps_category: npsCategory, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
