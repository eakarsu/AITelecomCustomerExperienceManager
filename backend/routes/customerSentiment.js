const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { queryOpenRouter, parseAIJson, saveAIResult } = require('./aiHelper');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : req.ip,
  message: { error: 'Too many AI requests. Limit: 20 per hour.' },
  standardHeaders: true, legacyHeaders: false,
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM customer_sentiment');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM customer_sentiment ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM customer_sentiment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language } = req.body;
    const result = await pool.query(
      `INSERT INTO customer_sentiment (customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language } = req.body;
    const result = await pool.query(
      `UPDATE customer_sentiment SET customer_name=$1, channel=$2, feedback_text=$3, interaction_type=$4, agent_name=$5, resolution_provided=$6, wait_time_minutes=$7, call_duration_seconds=$8, language=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language, req.params.id]
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
    const result = await pool.query('DELETE FROM customer_sentiment WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM customer_sentiment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    const r = result.rows[0];
    const prompt = `Perform sentiment analysis on this customer interaction:

Customer: ${r.customer_name}
Channel: ${r.channel}
Interaction Type: ${r.interaction_type}
Feedback: "${r.feedback_text}"
Agent: ${r.agent_name}
Resolution Provided: ${r.resolution_provided ? 'Yes' : 'No'}
Wait Time: ${r.wait_time_minutes} minutes
Call Duration: ${r.call_duration_seconds} seconds
Language: ${r.language}

Provide analysis in this format:
SENTIMENT SCORE: [-1.0 to 1.0]
SENTIMENT LABEL: [Very Negative / Negative / Neutral / Positive / Very Positive]
EMOTION DETECTED: [primary emotion - anger, frustration, satisfaction, etc.]
KEY THEMES: [main topics/concerns mentioned]
CUSTOMER INTENT: [what the customer is trying to achieve]
URGENCY LEVEL: [Low/Medium/High/Critical]
RECOMMENDED ACTION: [next best action for this customer]
AGENT PERFORMANCE: [assessment of how agent handled the interaction]
ESCALATION NEEDED: [Yes/No with reason]`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer sentiment analysis AI for a telecom company. Provide nuanced emotional and intent analysis of customer feedback.');

    await pool.query(
      'UPDATE customer_sentiment SET sentiment_score = $1, sentiment_label = $2, ai_analysis = $3, updated_at = NOW() WHERE id = $4',
      [0, 'AI Analyzed', aiResponse.content, req.params.id]
    );

    res.json({ analysis: aiResponse.content, model: aiResponse.model, usage: aiResponse.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
