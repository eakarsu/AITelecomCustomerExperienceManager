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

// POST /api/ai/proactive-care — identify at-risk customers and generate personalized outreach
router.post('/proactive-care', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');

    // Create outreach_campaigns table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outreach_campaigns (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_id INTEGER,
        churn_probability NUMERIC,
        risk_level VARCHAR(50),
        outreach_message TEXT,
        channel VARCHAR(50) DEFAULT 'email',
        status VARCHAR(50) DEFAULT 'pending',
        ai_generated BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Fetch high-risk customers from churn_analysis
    const atRiskResult = await pool.query(`
      SELECT * FROM churn_analysis
      WHERE churn_probability >= 50 OR risk_level IN ('High', 'Critical', 'AI Analyzed')
      ORDER BY churn_probability DESC NULLS LAST
      LIMIT 20
    `);

    if (atRiskResult.rows.length === 0) {
      return res.json({ message: 'No at-risk customers found', campaigns: [] });
    }

    const customers = atRiskResult.rows;
    const campaigns = [];

    // Generate personalized outreach for each at-risk customer
    for (const customer of customers.slice(0, 5)) { // limit to 5 to avoid rate limit burn
      const prompt = `Generate a personalized retention outreach message for this at-risk telecom customer. Return ONLY valid JSON:

Customer: ${customer.customer_name}
Account Age: ${customer.account_age_months} months
Contract: ${customer.contract_type}
Monthly Charges: $${customer.monthly_charges}
Churn Probability: ${customer.churn_probability || 'High'}%
Risk Level: ${customer.risk_level || 'High'}
Complaints: ${customer.num_complaints}
Usage Decline: ${customer.usage_decline_pct}%

Return JSON with this exact structure:
{
  "subject_line": "email subject",
  "message": "personalized outreach message (2-3 paragraphs)",
  "offer": "specific retention offer",
  "channel": "Email",
  "urgency": "High",
  "talking_points": ["point1", "point2"]
}`;

      try {
        const aiResponse = await queryOpenRouter(prompt, 'You are a telecom customer retention specialist. Always respond with valid JSON only.');
        const parsed = parseAIJson(aiResponse.content);

        // Save to outreach_campaigns
        const campaignResult = await pool.query(
          `INSERT INTO outreach_campaigns (customer_name, customer_id, churn_probability, risk_level, outreach_message, channel)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            customer.customer_name,
            customer.id,
            customer.churn_probability,
            customer.risk_level || 'High',
            aiResponse.content,
            parsed?.channel || 'Email',
          ],
        );

        campaigns.push({
          customer: customer.customer_name,
          campaign: campaignResult.rows[0],
          parsed,
        });
      } catch (err) {
        console.error(`Outreach generation failed for ${customer.customer_name}:`, err.message);
      }
    }

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'ai/proactive-care', { at_risk_count: customers.length }, { campaigns_generated: campaigns.length });

    res.json({
      at_risk_customers: customers.length,
      campaigns_generated: campaigns.length,
      campaigns,
    });
  } catch (err) {
    console.error('Proactive care error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/outreach-campaigns — get all outreach campaigns
router.get('/outreach-campaigns', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outreach_campaigns (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_id INTEGER,
        churn_probability NUMERIC,
        risk_level VARCHAR(50),
        outreach_message TEXT,
        channel VARCHAR(50) DEFAULT 'email',
        status VARCHAR(50) DEFAULT 'pending',
        ai_generated BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM outreach_campaigns');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM outreach_campaigns ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/nps-forecast — predict NPS trend from sentiment data
router.post('/nps-forecast', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');

    // Fetch last 30 days of customer sentiment
    const sentimentResult = await pool.query(`
      SELECT sentiment_score, sentiment_label, interaction_type, channel, created_at
      FROM customer_sentiment
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    // Fetch recent NPS data
    const npsResult = await pool.query(`
      SELECT predicted_nps, nps_category, customer_segment, created_at
      FROM nps_predictions
      WHERE created_at >= NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const sentimentData = sentimentResult.rows;
    const npsData = npsResult.rows;

    const avgSentiment = sentimentData.length > 0
      ? sentimentData.filter(s => s.sentiment_score != null).reduce((a, b) => a + parseFloat(b.sentiment_score || 0), 0) / sentimentData.length
      : 0;

    const avgNps = npsData.length > 0
      ? npsData.filter(n => n.predicted_nps != null).reduce((a, b) => a + parseFloat(b.predicted_nps || 0), 0) / npsData.length
      : 0;

    const prompt = `Predict the NPS trend for next 30 days based on this telecom data and return ONLY valid JSON:

Recent Sentiment Data (last 30 days):
- Total interactions: ${sentimentData.length}
- Average sentiment score: ${avgSentiment.toFixed(2)}
- Positive: ${sentimentData.filter(s => s.sentiment_label === 'Positive' || s.sentiment_label === 'Very Positive').length}
- Negative: ${sentimentData.filter(s => s.sentiment_label === 'Negative' || s.sentiment_label === 'Very Negative').length}
- Top interaction types: ${[...new Set(sentimentData.map(s => s.interaction_type).filter(Boolean))].slice(0, 5).join(', ')}

Recent NPS Data (last 90 days):
- Total predictions: ${npsData.length}
- Average predicted NPS: ${avgNps.toFixed(2)}
- Promoters: ${npsData.filter(n => n.nps_category === 'Promoter').length}
- Detractors: ${npsData.filter(n => n.nps_category === 'Detractor').length}

Return JSON with this exact structure:
{
  "predicted_nps": 7.2,
  "trend": "Improving",
  "confidence_pct": 75,
  "drivers": ["driver1", "driver2", "driver3"],
  "at_risk_segments": ["segment1", "segment2"],
  "recommended_actions": ["action1", "action2"],
  "forecast_narrative": "2-3 sentence explanation of the forecast"
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a customer experience analytics AI. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'ai/nps-forecast', { sentiment_count: sentimentData.length, nps_count: npsData.length }, parsed || { raw: aiResponse.content });

    res.json({
      forecast: parsed,
      raw_analysis: aiResponse.content,
      data_summary: {
        sentiment_records_analyzed: sentimentData.length,
        nps_records_analyzed: npsData.length,
        avg_current_sentiment: avgSentiment.toFixed(2),
        avg_current_nps: avgNps.toFixed(2),
      },
      model: aiResponse.model,
    });
  } catch (err) {
    console.error('NPS forecast error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/dispatch-plan — optimized field tech dispatch schedule
router.post('/dispatch-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { date } = req.body;

    if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });

    // Fetch support tickets and appointments for the date
    const [ticketsResult, appointmentsResult] = await Promise.all([
      pool.query(
        `SELECT * FROM support_tickets
         WHERE status IN ('Open', 'In Progress')
         ORDER BY created_at ASC LIMIT 30`,
      ),
      pool.query(
        `SELECT * FROM appointments WHERE appointment_date = $1 ORDER BY appointment_time ASC`,
        [date],
      ),
    ]);

    const tickets = ticketsResult.rows;
    const appointments = appointmentsResult.rows;

    const prompt = `Create an optimized field technician dispatch schedule and return ONLY valid JSON:

Date: ${date}

Open Support Tickets (${tickets.length}):
${tickets.slice(0, 10).map(t => `- Ticket #${t.id}: ${t.issue_type || t.category || 'Issue'} (${t.priority || 'Medium'} priority) - Location: ${t.location || t.region || 'Unknown'}`).join('\n')}

Scheduled Appointments (${appointments.length}):
${appointments.slice(0, 10).map(a => `- Appt #${a.id}: ${a.appointment_type || 'Service'} at ${a.appointment_time || 'TBD'} - ${a.location || 'Unknown'}`).join('\n')}

Return JSON with this exact structure:
{
  "dispatch_date": "${date}",
  "recommended_technicians": 3,
  "schedule": [
    {
      "technician": "Tech 1",
      "assignments": [
        {"time": "09:00", "type": "ticket/appointment", "id": "1", "location": "area", "estimated_duration": 60}
      ],
      "total_assignments": 4,
      "coverage_area": "North Zone"
    }
  ],
  "unassigned": [],
  "optimization_notes": "notes about the schedule",
  "estimated_completion_pct": 85
}`;

    const aiResponse = await queryOpenRouter(prompt, 'You are a field operations scheduler AI. Always respond with valid JSON only.');
    const parsed = parseAIJson(aiResponse.content);

    await saveAIResult(pool, req.user?.id || req.user?.userId, 'ai/dispatch-plan', { date, tickets: tickets.length, appointments: appointments.length }, parsed || { raw: aiResponse.content });

    res.json({
      dispatch_plan: parsed,
      raw_plan: aiResponse.content,
      data_summary: {
        open_tickets: tickets.length,
        scheduled_appointments: appointments.length,
      },
      model: aiResponse.model,
    });
  } catch (err) {
    console.error('Dispatch plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/churn-predict — score churn risk for a customer (AI-driven)
router.post('/churn-predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const cust = await pool.query('SELECT * FROM customer_profiles WHERE id = $1', [customerId]).catch(() => ({ rows: [] }));
    const usage = await pool.query('SELECT * FROM usage_tracking WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const tickets = await pool.query('SELECT * FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10', [customerId]).catch(() => ({ rows: [] }));
    const payments = await pool.query('SELECT * FROM payment_history WHERE customer_id = $1 ORDER BY payment_date DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const sentiment = await pool.query('SELECT * FROM customer_sentiment WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5', [customerId]).catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a telecom churn analyst. Always respond with valid JSON only.';
    const prompt = `Score churn risk for the customer using all signals.
Customer: ${JSON.stringify(cust.rows[0] || {})}
Recent usage: ${JSON.stringify(usage.rows)}
Tickets: ${JSON.stringify(tickets.rows)}
Payments: ${JSON.stringify(payments.rows)}
Sentiment: ${JSON.stringify(sentiment.rows)}

Return JSON:
{
  "churn_probability_pct": <0-100>,
  "risk_level": "low|medium|high|critical",
  "top_drivers": ["..."],
  "retention_actions": [{"action": "...", "priority": "low|medium|high", "estimated_impact_pct": <0-100>}],
  "monitoring_signals": ["..."],
  "summary": "..."
}`;
    const aiResponse = await queryOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse.content);
    const result = parsed || { raw: aiResponse.content };
    await saveAIResult(pool, req.user?.id, 'churn-predict', { customerId }, result);
    res.json({ result, model: aiResponse.model });
  } catch (err) {
    console.error('Churn predict error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/call-quality-rca — root cause analysis for call quality issues
router.post('/call-quality-rca', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { towerId, customerId, dateRange } = req.body;

    const calls = await pool.query('SELECT * FROM call_quality ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] }));
    const dropped = await pool.query('SELECT * FROM dropped_calls ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] }));
    const towers = await pool.query('SELECT * FROM tower_performance ORDER BY created_at DESC LIMIT 20').catch(() => ({ rows: [] }));
    const outages = await pool.query('SELECT * FROM network_outages ORDER BY created_at DESC LIMIT 20').catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a telecom network and customer-experience root-cause analyst. Always respond with valid JSON only.';
    const prompt = `Diagnose call quality issues and recommend remediation.
Tower scope: ${towerId || 'all'} | Customer scope: ${customerId || 'all'} | Window: ${dateRange || 'recent'}
Call quality records: ${JSON.stringify(calls.rows.slice(0, 20))}
Dropped calls: ${JSON.stringify(dropped.rows.slice(0, 20))}
Tower performance: ${JSON.stringify(towers.rows.slice(0, 10))}
Outages: ${JSON.stringify(outages.rows.slice(0, 10))}

Return JSON:
{
  "primary_root_causes": [{"cause": "...", "evidence": ["..."], "impact_score": <0-100>}],
  "affected_segments": [{"type": "tower|region|device|plan", "value": "...", "calls_affected": <number>}],
  "remediation_actions": [{"action": "...", "owner": "network|cx|ops", "eta_days": <number>}],
  "customer_outreach_priority": [<customer_id>],
  "summary": "..."
}`;
    const aiResponse = await queryOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse.content);
    const result = parsed || { raw: aiResponse.content };
    await saveAIResult(pool, req.user?.id, 'call-quality-rca', { towerId, customerId, dateRange }, result);
    res.json({ result, model: aiResponse.model });
  } catch (err) {
    console.error('Call quality RCA error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/sentiment-routing — recommend routing rules from sentiment + ticket signals
router.post('/sentiment-routing', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const pool = req.app.get('db');

    const sentiment = await pool.query(
      'SELECT * FROM customer_sentiment ORDER BY created_at DESC LIMIT 60'
    ).catch(() => ({ rows: [] }));
    const tickets = await pool.query(
      'SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 50'
    ).catch(() => ({ rows: [] }));

    if (!sentiment.rows.length && !tickets.rows.length) {
      return res.status(400).json({ error: 'No sentiment or ticket data to analyze' });
    }

    const systemPrompt = 'You are a contact-center routing strategist. Always respond with valid JSON only.';
    const prompt = `Recommend sentiment-driven routing rules for inbound contacts.
Recent sentiment: ${JSON.stringify(sentiment.rows.slice(0, 30))}
Recent tickets: ${JSON.stringify(tickets.rows.slice(0, 25))}

Return JSON:
{
  "routing_rules": [
    {
      "name": "string",
      "condition": "string (e.g. sentiment<-0.5 AND ticket.priority=high)",
      "queue": "vip|retention|tech|billing|general",
      "priority": "low|medium|high|critical",
      "rationale": "string"
    }
  ],
  "queue_capacity_recommendations": [{"queue": "string", "agents_required": <number>, "reason": "string"}],
  "escalation_triggers": ["string"],
  "summary": "string"
}`;

    const aiResponse = await queryOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse.content);
    const result = parsed || { raw: aiResponse.content };
    await saveAIResult(pool, req.user?.id, 'sentiment-routing', {
      sentiment_count: sentiment.rows.length,
      ticket_count: tickets.rows.length,
    }, result);
    res.json({ result, model: aiResponse.model });
  } catch (err) {
    console.error('Sentiment routing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/customer-health-score — composite health score for a customer
router.post('/customer-health-score', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const pool = req.app.get('db');
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const cust = await pool.query('SELECT * FROM customer_profiles WHERE id = $1', [customerId]).catch(() => ({ rows: [] }));
    const usage = await pool.query('SELECT * FROM usage_tracking WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const tickets = await pool.query('SELECT * FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20', [customerId]).catch(() => ({ rows: [] }));
    const payments = await pool.query('SELECT * FROM payment_history WHERE customer_id = $1 ORDER BY payment_date DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const sentiment = await pool.query('SELECT * FROM customer_sentiment WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 8', [customerId]).catch(() => ({ rows: [] }));
    const calls = await pool.query('SELECT * FROM call_quality WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10', [customerId]).catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a customer success analyst. Always respond with valid JSON only.';
    const prompt = `Compute a composite Customer Health Score across loyalty, financial, engagement and experience dimensions.
Customer: ${JSON.stringify(cust.rows[0] || {})}
Usage: ${JSON.stringify(usage.rows)}
Tickets: ${JSON.stringify(tickets.rows)}
Payments: ${JSON.stringify(payments.rows)}
Sentiment: ${JSON.stringify(sentiment.rows)}
Call quality: ${JSON.stringify(calls.rows)}

Return JSON:
{
  "overall_score": <0-100>,
  "tier": "platinum|gold|silver|bronze|at_risk",
  "dimensions": {
    "financial": <0-100>,
    "engagement": <0-100>,
    "satisfaction": <0-100>,
    "loyalty": <0-100>,
    "service_experience": <0-100>
  },
  "drivers": [{"dimension": "string", "signal": "string", "delta": "+|-"}],
  "recommended_actions": [{"action": "string", "owner": "cx|retention|finance|tech", "priority": "low|medium|high"}],
  "summary": "string"
}`;

    const aiResponse = await queryOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse.content);
    const result = parsed || { raw: aiResponse.content };
    await saveAIResult(pool, req.user?.id, 'customer-health-score', { customerId }, result);
    res.json({ result, model: aiResponse.model });
  } catch (err) {
    console.error('Customer health score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/dynamic-plan-recommendations — AI plan recommendations for a customer
router.post('/dynamic-plan-recommendations', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const pool = req.app.get('db');
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const cust = await pool.query('SELECT * FROM customer_profiles WHERE id = $1', [customerId]).catch(() => ({ rows: [] }));
    const usage = await pool.query('SELECT * FROM usage_tracking WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const payments = await pool.query('SELECT * FROM payment_history WHERE customer_id = $1 ORDER BY payment_date DESC LIMIT 12', [customerId]).catch(() => ({ rows: [] }));
    const currentRecs = await pool.query('SELECT * FROM plan_recommendations ORDER BY created_at DESC LIMIT 30').catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a telecom plan recommendation expert. Always respond with valid JSON only.';
    const prompt = `Recommend 3-5 plans tailored to this customer's actual usage and budget signals.
Customer: ${JSON.stringify(cust.rows[0] || {})}
Usage history: ${JSON.stringify(usage.rows)}
Payment history: ${JSON.stringify(payments.rows)}
Available plans (recent recommendations as catalog hints): ${JSON.stringify(currentRecs.rows.slice(0, 10))}

Return JSON:
{
  "recommendations": [
    {
      "plan_name": "string",
      "monthly_price": <number>,
      "data_gb": <number>,
      "features": ["string"],
      "fit_score": <0-100>,
      "expected_savings_pct": <0-100>,
      "rationale": "string"
    }
  ],
  "best_pick": "plan_name",
  "switching_risk": "low|medium|high",
  "summary": "string"
}`;

    const aiResponse = await queryOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse.content);
    const result = parsed || { raw: aiResponse.content };
    await saveAIResult(pool, req.user?.id, 'dynamic-plan-recommendations', { customerId }, result);
    res.json({ result, model: aiResponse.model });
  } catch (err) {
    console.error('Dynamic plan recommendations error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
