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
    const countResult = await pool.query('SELECT COUNT(*) FROM billing_disputes');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM billing_disputes ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM billing_disputes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes } = req.body;
    const result = await pool.query(
      `INSERT INTO billing_disputes (customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes } = req.body;
    const result = await pool.query(
      `UPDATE billing_disputes SET customer_name=$1, account_number=$2, dispute_type=$3, disputed_amount=$4, billing_period=$5, plan_type=$6, overage_charges=$7, roaming_charges=$8, disputed_services=$9, previous_disputes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes, req.params.id]
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
    const result = await pool.query('DELETE FROM billing_disputes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/resolve', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM billing_disputes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Analyze this billing dispute and recommend a resolution:

Customer: ${r.customer_name}
Account: ${r.account_number}
Dispute Type: ${r.dispute_type}
Disputed Amount: $${r.disputed_amount}
Billing Period: ${r.billing_period}
Plan Type: ${r.plan_type}
Overage Charges: $${r.overage_charges}
Roaming Charges: $${r.roaming_charges}
Disputed Services: ${r.disputed_services}
Previous Disputes: ${r.previous_disputes}

Provide analysis in this format:
DISPUTE VALIDITY: [Valid / Partially Valid / Invalid]
RECOMMENDED RESOLUTION: [specific resolution]
CREDIT AMOUNT: [recommended credit if applicable]
JUSTIFICATION: [why this resolution is fair]
ROOT CAUSE: [what caused the billing issue]
PROCESS FIX: [how to prevent similar disputes]
CUSTOMER RETENTION RISK: [Low/Medium/High]
GOODWILL OFFER: [additional offer to retain customer]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a telecom billing dispute resolution AI. Analyze disputes fairly and recommend balanced resolutions that satisfy customers while protecting revenue.');

    await pool.query(
      'UPDATE billing_disputes SET resolution_status = $1, ai_analysis = $2, updated_at = NOW() WHERE id = $3',
      ['AI Reviewed', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
