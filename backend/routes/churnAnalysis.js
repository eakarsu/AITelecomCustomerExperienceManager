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
    const countResult = await pool.query('SELECT COUNT(*) FROM churn_analysis');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM churn_analysis ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM churn_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days } = req.body;
    const result = await pool.query(
      `INSERT INTO churn_analysis (customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days } = req.body;
    const result = await pool.query(
      `UPDATE churn_analysis SET customer_name=$1, account_age_months=$2, contract_type=$3, monthly_charges=$4, total_charges=$5, num_complaints=$6, payment_delays=$7, competitor_offers=$8, usage_decline_pct=$9, last_interaction_days=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days, req.params.id],
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
    const result = await pool.query('DELETE FROM churn_analysis WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM churn_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze the churn risk for this telecom customer and return ONLY valid JSON:

Customer: ${record.customer_name}
Account Age: ${record.account_age_months} months
Contract Type: ${record.contract_type}
Monthly Charges: $${record.monthly_charges}
Total Charges: $${record.total_charges}
Number of Complaints: ${record.num_complaints}
Payment Delays: ${record.payment_delays}
Competitor Offers Received: ${record.competitor_offers}
Usage Decline: ${record.usage_decline_pct}%
Days Since Last Interaction: ${record.last_interaction_days}

Return JSON with this exact structure:
{
  "churn_probability": 65,
  "risk_level": "High",
  "churn_timeline": "Within 60 days",
  "top_risk_factors": ["factor1", "factor2", "factor3"],
  "retention_strategy": "specific retention strategy",
  "recommended_offer": "specific offer details",
  "expected_lifetime_value": 2400,
  "win_back_difficulty": "Hard"
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer churn prediction AI for telecom. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    // Use parsed scores — no Math.random()
    const churnProbability = parsed?.churn_probability != null ? parseFloat(parsed.churn_probability) : null;
    const riskLevel = parsed?.risk_level || 'Unknown';

    await pool.query(
      'UPDATE churn_analysis SET churn_probability = $1, risk_level = $2, ai_analysis = $3, updated_at = NOW() WHERE id = $4',
      [churnProbability, riskLevel, aiResponse.content, req.params.id],
    );

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'churn-analysis/analyze', record, parsed || { raw: aiResponse.content });

    res.json({ analysis: aiResponse.content, parsed, churn_probability: churnProbability, risk_level: riskLevel, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
