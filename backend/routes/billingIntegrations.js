// Apply pass 5 — billing system integration adapters (Comtech / Openet).
// NEEDS-CREDS: each provider requires credentials. Routes return 503 with the
// missing env var names when credentials are absent. With credentials present
// they would call the respective provider; for now they return 501 so the
// gating contract is testable without making outbound calls.
//
// Required env vars (per-provider):
//   Comtech:  COMTECH_API_URL,  COMTECH_API_KEY
//   Openet:   OPENET_API_URL,   OPENET_CLIENT_ID, OPENET_CLIENT_SECRET
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const PROVIDER_CREDS = {
  comtech: ['COMTECH_API_URL', 'COMTECH_API_KEY'],
  openet: ['OPENET_API_URL', 'OPENET_CLIENT_ID', 'OPENET_CLIENT_SECRET'],
};

function findMissing(provider) {
  const required = PROVIDER_CREDS[provider];
  if (!required) return ['unknown-provider'];
  return required.filter((k) => !process.env[k]);
}

router.get('/status', auth, async (req, res) => {
  const status = {};
  for (const p of Object.keys(PROVIDER_CREDS)) {
    const missing = findMissing(p);
    status[p] = { configured: missing.length === 0, missing };
  }
  res.json({ success: true, status });
});

// Pull customer billing snapshot from upstream provider
router.get('/:provider/customer/:customerId', auth, async (req, res) => {
  const provider = String(req.params.provider).toLowerCase();
  if (!PROVIDER_CREDS[provider]) {
    return res.status(400).json({ error: 'Unsupported provider', supported: Object.keys(PROVIDER_CREDS) });
  }
  const missing = findMissing(provider);
  if (missing.length > 0) {
    return res.status(503).json({ error: `${provider} credentials not configured`, missing });
  }
  return res.status(501).json({ error: 'Adapter present but upstream call not enabled in this build', provider });
});

// Reconcile payment via upstream provider
router.post('/:provider/reconcile', auth, async (req, res) => {
  const provider = String(req.params.provider).toLowerCase();
  if (!PROVIDER_CREDS[provider]) {
    return res.status(400).json({ error: 'Unsupported provider', supported: Object.keys(PROVIDER_CREDS) });
  }
  const missing = findMissing(provider);
  if (missing.length > 0) {
    return res.status(503).json({ error: `${provider} credentials not configured`, missing });
  }
  return res.status(501).json({ error: 'Adapter present but upstream call not enabled in this build', provider });
});

module.exports = router;
