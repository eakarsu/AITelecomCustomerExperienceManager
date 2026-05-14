const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/customers/:name/360-view — aggregate all data for a customer by name
router.get('/:name/360-view', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { name } = req.params;
    const searchPattern = `%${name}%`;

    // Fetch all related records in parallel
    const [
      profileResult,
      callQualityResult,
      droppedCallsResult,
      churnResult,
      npsResult,
      sentimentResult,
      billingResult,
      ticketsResult,
      paymentResult,
      usageResult,
      outreachResult,
    ] = await Promise.all([
      pool.query('SELECT * FROM customer_profiles WHERE customer_name ILIKE $1 LIMIT 5', [searchPattern]),
      pool.query('SELECT * FROM call_quality WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]),
      pool.query('SELECT * FROM dropped_calls WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]),
      pool.query('SELECT * FROM churn_analysis WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 5', [searchPattern]),
      pool.query('SELECT * FROM nps_predictions WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 5', [searchPattern]),
      pool.query('SELECT * FROM customer_sentiment WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]),
      pool.query('SELECT * FROM billing_disputes WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]),
      pool.query('SELECT * FROM support_tickets WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]).catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM payment_history WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]).catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM usage_tracking WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 10', [searchPattern]).catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM outreach_campaigns WHERE customer_name ILIKE $1 ORDER BY created_at DESC LIMIT 5', [searchPattern]).catch(() => ({ rows: [] })),
    ]);

    // Compute summary stats
    const callQualityScores = callQualityResult.rows.filter(r => r.quality_score != null).map(r => parseFloat(r.quality_score));
    const avgQualityScore = callQualityScores.length > 0 ? (callQualityScores.reduce((a, b) => a + b, 0) / callQualityScores.length).toFixed(1) : null;

    const latestChurn = churnResult.rows[0];
    const latestNps = npsResult.rows[0];

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    sentimentResult.rows.forEach(s => {
      const label = (s.sentiment_label || '').toLowerCase();
      if (label.includes('positive')) sentimentCounts.positive++;
      else if (label.includes('negative')) sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const profile360 = {
      customer_name: name,
      search_pattern: searchPattern,
      profile: profileResult.rows[0] || null,
      risk_summary: {
        churn_probability: latestChurn?.churn_probability || null,
        churn_risk_level: latestChurn?.risk_level || null,
        predicted_nps: latestNps?.predicted_nps || null,
        nps_category: latestNps?.nps_category || null,
        avg_call_quality_score: avgQualityScore,
        total_billing_disputes: billingResult.rows.length,
        total_dropped_calls: droppedCallsResult.rows.length,
      },
      sentiment_summary: sentimentCounts,
      data: {
        call_quality: callQualityResult.rows,
        dropped_calls: droppedCallsResult.rows,
        churn_analysis: churnResult.rows,
        nps_predictions: npsResult.rows,
        customer_sentiment: sentimentResult.rows,
        billing_disputes: billingResult.rows,
        support_tickets: ticketsResult.rows,
        payment_history: paymentResult.rows,
        usage_tracking: usageResult.rows,
        outreach_campaigns: outreachResult.rows,
      },
      record_counts: {
        call_quality: callQualityResult.rows.length,
        dropped_calls: droppedCallsResult.rows.length,
        churn_records: churnResult.rows.length,
        nps_records: npsResult.rows.length,
        sentiment_records: sentimentResult.rows.length,
        billing_disputes: billingResult.rows.length,
        support_tickets: ticketsResult.rows.length,
        payment_records: paymentResult.rows.length,
        usage_records: usageResult.rows.length,
        outreach_campaigns: outreachResult.rows.length,
      },
    };

    res.json(profile360);
  } catch (err) {
    console.error('Customer 360 error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers — list all unique customers from customer_profiles
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM customer_profiles');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM customer_profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
