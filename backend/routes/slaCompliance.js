const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryOpenRouter } = require('./aiHelper');

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM sla_compliance ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM sla_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause } = req.body;
    const result = await pool.query(
      `INSERT INTO sla_compliance (service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause } = req.body;
    const result = await pool.query(
      `UPDATE sla_compliance SET service_name=$1, sla_target_pct=$2, actual_uptime_pct=$3, measurement_period=$4, region=$5, downtime_minutes=$6, incidents_count=$7, mttr_minutes=$8, customer_tier=$9, penalty_clause=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause, req.params.id]
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
    const result = await pool.query('DELETE FROM sla_compliance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM sla_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Analyze this SLA compliance record and provide improvement recommendations:

Service: ${r.service_name}
SLA Target: ${r.sla_target_pct}%
Actual Uptime: ${r.actual_uptime_pct}%
Period: ${r.measurement_period}
Region: ${r.region}
Total Downtime: ${r.downtime_minutes} minutes
Incidents: ${r.incidents_count}
MTTR: ${r.mttr_minutes} minutes
Customer Tier: ${r.customer_tier}
Penalty Clause: ${r.penalty_clause}

Provide analysis in this format:
COMPLIANCE STATUS: [Compliant / At Risk / Breached]
UPTIME GAP: [difference from target]
FINANCIAL EXPOSURE: [estimated penalty cost]
TOP CONTRIBUTING INCIDENTS: [what caused downtime]
IMPROVEMENT ROADMAP: [specific steps to improve uptime]
MTTR OPTIMIZATION: [how to reduce mean time to repair]
RISK FORECAST: [next period prediction]
EXECUTIVE SUMMARY: [brief summary for leadership]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom SLA compliance analyst AI. Provide data-driven analysis of service level agreement adherence and actionable improvement plans.');

    await pool.query(
      'UPDATE sla_compliance SET compliance_status = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      ['AI Reviewed', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
