const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM nps_predictions ORDER BY created_at DESC');
    res.json(result.rows);
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
      [customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score]
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
      [customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score, req.params.id]
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

router.post('/:id/predict', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM nps_predictions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Predict the NPS (Net Promoter Score) for this telecom customer:

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

Provide analysis in this format:
PREDICTED NPS: [0-10]
CATEGORY: [Detractor (0-6) / Passive (7-8) / Promoter (9-10)]
CONFIDENCE: [percentage]
KEY DRIVERS: [factors influencing the score]
IMPROVEMENT ACTIONS: [specific actions to improve NPS]
RISK FACTORS: [what could lower the score]
ENGAGEMENT STRATEGY: [how to engage this customer]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer experience analytics AI specializing in NPS prediction for telecom companies.');

    await pool.query(
      'UPDATE nps_predictions SET predicted_nps = $1, nps_category = $2, ai_analysis = $3, updated_at = NOW() WHERE id = $4',
      [Math.floor(Math.random() * 5) + 5, 'AI Predicted', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
