// Apply pass 5 — multi-channel contact thread persistence.
// PRODUCT-DECISION: a contact_thread is a logical conversation that may span
// multiple channels (phone, email, sms, chat, social). It owns N
// contact_messages, each with channel + direction + body. customer_id is the
// primary join key; agent_id is optional (system messages have agent_id NULL).
// Schema is created on demand via CREATE TABLE IF NOT EXISTS so it is safe to
// roll out without a separate migration.
// No required env vars.
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const ALLOWED_CHANNELS = ['phone', 'email', 'sms', 'chat', 'social'];
const ALLOWED_DIRECTIONS = ['inbound', 'outbound'];

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_threads (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER,
      subject VARCHAR(255),
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER REFERENCES contact_threads(id) ON DELETE CASCADE,
      channel VARCHAR(50),
      direction VARCHAR(20),
      agent_id INTEGER,
      body TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const customerId = req.query.customerId;
    const where = customerId ? 'WHERE customer_id = $1' : '';
    const params = customerId ? [customerId] : [];
    const result = await pool.query(
      `SELECT * FROM contact_threads ${where} ORDER BY updated_at DESC LIMIT 200`,
      params,
    );
    res.json({ threads: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const { customer_id, subject } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
    const result = await pool.query(
      'INSERT INTO contact_threads (customer_id, subject) VALUES ($1, $2) RETURNING *',
      [customer_id, subject || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/messages', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const result = await pool.query(
      'SELECT * FROM contact_messages WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.id],
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', auth, async (req, res) => {
  try {
    const pool = req.app.get('db');
    await ensureSchema(pool);
    const { channel, direction, body, metadata, agent_id } = req.body;
    if (!channel || !ALLOWED_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of ${ALLOWED_CHANNELS.join(', ')}` });
    }
    if (!direction || !ALLOWED_DIRECTIONS.includes(direction)) {
      return res.status(400).json({ error: `direction must be one of ${ALLOWED_DIRECTIONS.join(', ')}` });
    }
    if (!body) return res.status(400).json({ error: 'body is required' });
    const result = await pool.query(
      `INSERT INTO contact_messages (thread_id, channel, direction, agent_id, body, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, channel, direction, agent_id || null, body, metadata || {}],
    );
    await pool.query('UPDATE contact_threads SET updated_at = NOW() WHERE id = $1', [req.params.id]).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
