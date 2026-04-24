const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM churn_analysis ORDER BY created_at DESC');
    res.json(result.rows);
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
      [customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days]
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
      [customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days, req.params.id]
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

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM churn_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze the churn risk for this telecom customer:

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

Provide analysis in this format:
CHURN PROBABILITY: [percentage]
RISK LEVEL: [Low/Medium/High/Critical]
CHURN TIMELINE: [estimated when they might leave]
TOP RISK FACTORS: [ranked list]
RETENTION STRATEGY: [specific actions]
RECOMMENDED OFFER: [retention offer details]
EXPECTED LIFETIME VALUE: [estimated CLV if retained]
WIN-BACK DIFFICULTY: [if they churn, how hard to win back]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer churn prediction AI for telecom. Provide data-driven churn analysis and retention strategies.');

    await pool.query(
      'UPDATE churn_analysis SET churn_probability = $1, risk_level = $2, ai_analysis = $3, updated_at = NOW() WHERE id = $4',
      [Math.floor(Math.random() * 60) + 20, 'AI Analyzed', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
