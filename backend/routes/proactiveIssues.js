const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM proactive_issues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM proactive_issues WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason } = req.body;
    const result = await pool.query(
      `INSERT INTO proactive_issues (customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason } = req.body;
    const result = await pool.query(
      `UPDATE proactive_issues SET customer_name=$1, issue_type=$2, severity=$3, affected_service=$4, region=$5, ticket_count_30d=$6, avg_resolution_hours=$7, customer_tenure_months=$8, is_premium=$9, last_contact_reason=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason, req.params.id]
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
    const result = await pool.query('DELETE FROM proactive_issues WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/resolve', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM proactive_issues WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const record = result.rows[0];
    const prompt = `Analyze this customer issue and propose a proactive resolution strategy:

Customer: ${record.customer_name}
Issue Type: ${record.issue_type}
Severity: ${record.severity}
Affected Service: ${record.affected_service}
Region: ${record.region}
Tickets in Last 30 Days: ${record.ticket_count_30d}
Avg Resolution Time: ${record.avg_resolution_hours} hours
Customer Tenure: ${record.customer_tenure_months} months
Premium Customer: ${record.is_premium ? 'Yes' : 'No'}
Last Contact Reason: ${record.last_contact_reason}

Provide analysis in this format:
PROACTIVE ACTION: [immediate action to take]
PRIORITY: [P1/P2/P3/P4]
ESTIMATED RESOLUTION: [hours/days]
CUSTOMER COMMUNICATION: [recommended message to customer]
ESCALATION PATH: [if needed]
PREVENTIVE MEASURES: [long-term prevention]
CUSTOMER IMPACT SCORE: [1-10]
RECOMMENDED COMPENSATION: [if applicable]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a proactive customer experience AI for a telecom company. Focus on resolving issues before they escalate.');

    await pool.query(
      'UPDATE proactive_issues SET resolution_plan = $1, ai_analysis = $2, status = $3, updated_at = NOW() WHERE id = $4',
      ['AI Generated', aiResponse.content, 'In Progress', req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
