const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM plan_recommendations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM plan_recommendations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score } = req.body;
    const result = await pool.query(
      `INSERT INTO plan_recommendations (customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score } = req.body;
    const result = await pool.query(
      `UPDATE plan_recommendations SET customer_name=$1, current_plan=$2, monthly_bill=$3, data_usage_gb=$4, call_minutes=$5, sms_count=$6, roaming_usage=$7, contract_end_date=$8, satisfaction_score=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score, req.params.id]
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
    const result = await pool.query('DELETE FROM plan_recommendations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/recommend', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM plan_recommendations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze this telecom customer's usage and recommend the best plan:

Customer: ${record.customer_name}
Current Plan: ${record.current_plan}
Monthly Bill: $${record.monthly_bill}
Data Usage: ${record.data_usage_gb} GB/month
Call Minutes: ${record.call_minutes} min/month
SMS Count: ${record.sms_count}/month
Roaming Usage: ${record.roaming_usage}
Contract End Date: ${record.contract_end_date}
Satisfaction Score: ${record.satisfaction_score}/10

Available Plans: Basic ($29.99, 5GB, 500min), Standard ($49.99, 15GB, unlimited calls), Premium ($79.99, 50GB, unlimited everything), Unlimited ($99.99, unlimited everything + roaming), Family ($129.99, shared 100GB, 5 lines)

Provide analysis in this format:
RECOMMENDED PLAN: [plan name and price]
MONTHLY SAVINGS: [estimated savings]
FIT SCORE: [1-10 how well it matches usage]
KEY REASONS: [why this plan is best]
UPGRADE BENEFITS: [what they gain]
POTENTIAL CONCERNS: [any downsides]
RETENTION OFFER: [special offer to retain customer]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom plan optimization AI. Recommend the best value plan based on usage patterns.');

    await pool.query(
      'UPDATE plan_recommendations SET recommended_plan = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      ['AI Recommended', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
