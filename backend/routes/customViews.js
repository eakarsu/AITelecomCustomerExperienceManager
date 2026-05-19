// Custom Views — 4 endpoints for telecom CX:
//   GET  /api/custom-views/nps-trend            — VIZ: NPS rolling trend (last 12 weeks)
//   GET  /api/custom-views/journey-heatmap      — VIZ: touchpoint x sentiment matrix
//   GET  /api/custom-views/monthly-report       — NON-VIZ: monthly CX report as PDF
//   GET  /api/custom-views/escalation-rules     — NON-VIZ: list escalation rules
//   POST /api/custom-views/escalation-rules     — NON-VIZ: create escalation rule
//   PUT  /api/custom-views/escalation-rules/:id — NON-VIZ: update escalation rule
//   DELETE /api/custom-views/escalation-rules/:id — NON-VIZ: delete escalation rule
//
// Schema is created lazily via CREATE TABLE IF NOT EXISTS so this route is
// safe to mount before migrations have run. All seed values are deterministic
// for reproducible demos.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const TOUCHPOINTS = ['Onboarding', 'Billing', 'Support Call', 'Outage', 'Plan Change', 'Renewal'];
const SENTIMENTS = ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'];
const ALLOWED_TRIGGERS = ['nps_drop', 'churn_risk', 'negative_sentiment', 'sla_breach', 'outage', 'billing_dispute'];
const ALLOWED_CHANNELS = ['email', 'sms', 'phone', 'manager', 'retention_team', 'tier2_support', 'tier3_support'];

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS escalation_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      trigger VARCHAR(80) NOT NULL,
      threshold NUMERIC,
      route_to VARCHAR(80) NOT NULL,
      priority VARCHAR(20) DEFAULT 'medium',
      enabled BOOLEAN DEFAULT true,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM escalation_rules');
  if (rows[0].n === 0) {
    const seeds = [
      ['NPS Drop > 15 pts', 'nps_drop', 15, 'retention_team', 'high', true, 'Auto-escalate when weekly NPS drops > 15 pts'],
      ['Churn Risk > 0.7', 'churn_risk', 0.7, 'retention_team', 'critical', true, 'High-value account churn risk'],
      ['Very Negative Call', 'negative_sentiment', -0.6, 'tier2_support', 'high', true, 'Sentiment score <= -0.6'],
      ['SLA Breach (P1)', 'sla_breach', 1, 'manager', 'critical', true, 'P1 ticket past SLA'],
      ['Tower Outage > 30m', 'outage', 30, 'tier3_support', 'high', true, 'Outage duration in minutes'],
    ];
    for (const s of seeds) {
      await pool.query(
        `INSERT INTO escalation_rules (name, trigger, threshold, route_to, priority, enabled, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        s,
      );
    }
  }
}

// Deterministic pseudo-random based on string seed
function seeded(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return (h % 1000) / 1000;
  };
}

// ---------- VIZ 1: NPS trend ----------
router.get('/nps-trend', auth, async (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks, 10) || 12, 52);
    const segments = ['Consumer', 'Business', 'Enterprise'];
    const rng = seeded('nps-trend-v1');
    const labels = [];
    const today = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      labels.push(`W${weeks - i}`);
    }
    const series = segments.map((seg, sIdx) => {
      const base = 38 + sIdx * 9;
      const data = labels.map((_, i) => {
        const wobble = (rng() - 0.5) * 14;
        const trend = i * 0.4;
        return Math.round(Math.max(0, Math.min(80, base + trend + wobble)));
      });
      return { segment: seg, values: data };
    });
    const overall = labels.map((_, i) => {
      const avg = series.reduce((acc, s) => acc + s.values[i], 0) / series.length;
      return Math.round(avg);
    });
    res.json({
      weeks,
      labels,
      series,
      overall,
      summary: {
        latest: overall[overall.length - 1],
        previous: overall[overall.length - 2],
        delta: overall[overall.length - 1] - overall[overall.length - 2],
        average: Math.round(overall.reduce((a, b) => a + b, 0) / overall.length),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- VIZ 2: Customer journey heatmap (touchpoint x sentiment) ----------
router.get('/journey-heatmap', auth, async (req, res) => {
  try {
    const rng = seeded('journey-heatmap-v1');
    const cells = [];
    let total = 0;
    for (const tp of TOUCHPOINTS) {
      const row = { touchpoint: tp, values: {} };
      for (const sent of SENTIMENTS) {
        const v = Math.floor(rng() * 90) + 5;
        row.values[sent] = v;
        total += v;
        cells.push({ touchpoint: tp, sentiment: sent, count: v });
      }
      rows_push: row;
    }
    // Build grid by touchpoint
    const grid = TOUCHPOINTS.map(tp => ({
      touchpoint: tp,
      values: SENTIMENTS.reduce((acc, s) => {
        const cell = cells.find(c => c.touchpoint === tp && c.sentiment === s);
        acc[s] = cell ? cell.count : 0;
        return acc;
      }, {}),
    }));
    // Find hottest cell (highest count)
    const hottest = cells.reduce((a, b) => (b.count > a.count ? b : a));
    res.json({
      touchpoints: TOUCHPOINTS,
      sentiments: SENTIMENTS,
      grid,
      cells,
      total,
      hottest,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 1: Monthly CX report PDF ----------
function buildPdfBuffer(report) {
  // Minimal hand-rolled PDF (single page, Helvetica) — no external dep.
  const lines = [];
  lines.push(`AI Telecom CX — Monthly Report`);
  lines.push(`Period: ${report.period}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(``);
  lines.push(`Net Promoter Score (avg):  ${report.npsAvg}`);
  lines.push(`NPS delta vs prior month:  ${report.npsDelta >= 0 ? '+' : ''}${report.npsDelta}`);
  lines.push(`Churn rate:                ${report.churnRate}%`);
  lines.push(`Customer health score:     ${report.healthScore}/100`);
  lines.push(`Open tickets:              ${report.openTickets}`);
  lines.push(`Closed tickets:            ${report.closedTickets}`);
  lines.push(`Avg handle time:           ${report.avgHandleTimeMin} min`);
  lines.push(`SLA compliance:            ${report.slaCompliance}%`);
  lines.push(``);
  lines.push(`Top issues:`);
  report.topIssues.forEach((it, i) => lines.push(`  ${i + 1}. ${it.title} — ${it.count} cases`));
  lines.push(``);
  lines.push(`Recommendations:`);
  report.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));

  // Escape PDF strings
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  let stream = 'BT\n/F1 14 Tf\n50 780 Td\n';
  stream += `(${esc(lines[0])}) Tj\n`;
  stream += '/F1 10 Tf\n0 -22 TD\n';
  for (let i = 1; i < lines.length; i++) {
    stream += `(${esc(lines[i])}) Tj\nT*\n`;
  }
  stream += 'ET';

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.forEach(o => {
    pdf += String(o).padStart(10, '0') + ' 00000 n \n';
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

router.get('/monthly-report', auth, async (req, res) => {
  try {
    const now = new Date();
    const period = req.query.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rng = seeded(`monthly-report-${period}`);
    const report = {
      period,
      generatedAt: now.toISOString(),
      npsAvg: 42 + Math.floor(rng() * 18),
      npsDelta: Math.floor(rng() * 10) - 4,
      churnRate: (rng() * 3 + 1.2).toFixed(2),
      healthScore: 60 + Math.floor(rng() * 25),
      openTickets: 110 + Math.floor(rng() * 80),
      closedTickets: 380 + Math.floor(rng() * 150),
      avgHandleTimeMin: (rng() * 4 + 3).toFixed(1),
      slaCompliance: (90 + rng() * 9).toFixed(1),
      topIssues: [
        { title: 'Dropped calls (urban tower-22)', count: 47 + Math.floor(rng() * 20) },
        { title: 'Billing dispute — auto-pay', count: 32 + Math.floor(rng() * 15) },
        { title: 'Slow 5G data — region NE', count: 28 + Math.floor(rng() * 12) },
        { title: 'Plan upgrade friction', count: 21 + Math.floor(rng() * 10) },
        { title: 'SIM swap delays', count: 14 + Math.floor(rng() * 8) },
      ],
      recommendations: [
        'Prioritize tower-22 RF re-optimization within 14 days',
        'Auto-credit billing disputes < $25 to deflect tickets',
        'Push proactive 5G refresh to NE region segment',
        'Launch retention offer for churn-risk > 0.7',
      ],
    };
    if (req.query.format === 'json') {
      return res.json(report);
    }
    const pdf = buildPdfBuffer(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cx-report-${period}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 2: Escalation rules CRUD ----------
router.get('/escalation-rules', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const result = await pool.query('SELECT * FROM escalation_rules ORDER BY priority DESC, id ASC');
    res.json({
      rules: result.rows,
      allowedTriggers: ALLOWED_TRIGGERS,
      allowedChannels: ALLOWED_CHANNELS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/escalation-rules', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const { name, trigger, threshold, route_to, priority, enabled, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!trigger || !ALLOWED_TRIGGERS.includes(trigger)) {
      return res.status(400).json({ error: `trigger must be one of ${ALLOWED_TRIGGERS.join(', ')}` });
    }
    if (!route_to || !ALLOWED_CHANNELS.includes(route_to)) {
      return res.status(400).json({ error: `route_to must be one of ${ALLOWED_CHANNELS.join(', ')}` });
    }
    const result = await pool.query(
      `INSERT INTO escalation_rules (name, trigger, threshold, route_to, priority, enabled, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, trigger, threshold ?? null, route_to, priority || 'medium', enabled !== false, notes || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/escalation-rules/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const { name, trigger, threshold, route_to, priority, enabled, notes } = req.body || {};
    if (trigger && !ALLOWED_TRIGGERS.includes(trigger)) {
      return res.status(400).json({ error: `trigger must be one of ${ALLOWED_TRIGGERS.join(', ')}` });
    }
    if (route_to && !ALLOWED_CHANNELS.includes(route_to)) {
      return res.status(400).json({ error: `route_to must be one of ${ALLOWED_CHANNELS.join(', ')}` });
    }
    const result = await pool.query(
      `UPDATE escalation_rules
         SET name      = COALESCE($1, name),
             trigger   = COALESCE($2, trigger),
             threshold = COALESCE($3, threshold),
             route_to  = COALESCE($4, route_to),
             priority  = COALESCE($5, priority),
             enabled   = COALESCE($6, enabled),
             notes     = COALESCE($7, notes),
             updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name ?? null, trigger ?? null, threshold ?? null, route_to ?? null, priority ?? null, enabled ?? null, notes ?? null, req.params.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/escalation-rules/:id', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const result = await pool.query('DELETE FROM escalation_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
