# Audit Note — AITelecomCustomerExperienceManager

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 14).

## Original Recommendations

### Missing AI Counterparts (critical)
- AI for churn prediction
- Sentiment analysis
- Call quality assessment
- NPS prediction

### Missing Non-AI Features
- Multi-channel contact history
- Billing system integration (Comtech, Openet)
- Self-service portal/chatbot
- Network–CX correlation

### Custom Feature Suggestions
- Churn early warning system
- Sentiment-driven routing
- Call quality root cause analysis
- Dynamic plan recommendations
- Customer health score

## Implemented (this round)
1. `POST /api/ai/churn-predict` — DB-grounded churn scoring with retention actions.
2. `POST /api/ai/call-quality-rca` — root-cause analysis across calls/towers/outages.

Pattern reused: `queryOpenRouter` + `parseAIJson` + `saveAIResult` + `aiRateLimiter` from `aiHelper.js`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Sentiment-driven routing endpoint.
2. **MECHANICAL** Customer health score endpoint.
3. **MECHANICAL** Dynamic plan recommendations endpoint.
4. **NEEDS-CREDS** Billing system integrations (Comtech/Openet).
5. **NEEDS-PRODUCT-DECISION** Multi-channel contact thread persistence schema.

## Apply pass 3 (frontend)

Verified the React (CRA) frontend already exposes pages for the pass-2
endpoints and all other AI features:

- `frontend/src/pages/ChurnPredict.js` → `/api/ai/churn-predict` (pass 2)
- `frontend/src/pages/CallQualityRCA.js` → `/api/ai/call-quality-rca` (pass 2)
- `frontend/src/pages/NPSForecast.js` → `/api/ai/nps-forecast`
- `frontend/src/pages/ProactiveCare.js` → `/api/ai/proactive-care`
- `frontend/src/pages/CustomerProfile360.js` → 360 profile

Pages POST directly via `axios` with `Authorization: Bearer ${token}` from
`localStorage`, matching the project's existing pattern.

Action: LEFT-AS-IS (FE already wired).

## Apply pass 4 (mechanical backlog)

Closed all three MECHANICAL backlog items.

### New endpoints (all in `routes/aiFeatures.js`)

- `POST /api/ai/sentiment-routing` — sentiment-driven routing rule
  recommendations from `customer_sentiment` + `support_tickets`.
- `POST /api/ai/customer-health-score` — composite health score across
  loyalty / financial / engagement / satisfaction / service-experience
  for a `customerId`.
- `POST /api/ai/dynamic-plan-recommendations` — 3-5 plans tailored to a
  `customerId`'s actual usage and payment history.

All three endpoints reuse `auth`, `aiRateLimiter`, `queryOpenRouter`,
`parseAIJson`, and `saveAIResult`. All explicitly 503 when
`OPENROUTER_API_KEY` is missing.

### New frontend pages (CRA, axios, JWT bearer from `localStorage`)

- `frontend/src/pages/SentimentRouting.js` → POST `/ai/sentiment-routing`
- `frontend/src/pages/CustomerHealthScore.js` → POST `/ai/customer-health-score`
- `frontend/src/pages/DynamicPlanRecommendations.js` → POST `/ai/dynamic-plan-recommendations`

All pages render a JSON result block (matching the existing
`ChurnPredict.js` / `CallQualityRCA.js` pattern), and surface a clear
"AI is not configured" message on 503.

Wiring: registered in `App.js` `Routes` and the `AI Insights` section
of `components/Layout.js`.

### Smoke test

PASS. Started `node server.js` on port 3001; `POST
/api/ai/sentiment-routing` without a token returned 401 (route
mounted, auth middleware running). Cleaned up.

### Files touched

- `backend/routes/aiFeatures.js`
- `frontend/src/App.js`
- `frontend/src/components/Layout.js`
- `frontend/src/pages/SentimentRouting.js` (new)
- `frontend/src/pages/CustomerHealthScore.js` (new)
- `frontend/src/pages/DynamicPlanRecommendations.js` (new)

### Remaining backlog

(empty — see pass 5 below)

## Apply pass 5 (all backlog)

Closed both remaining backlog items.

### New endpoints

- `GET/POST /api/contact-threads`, `GET/POST /api/contact-threads/:id/messages`
  — multi-channel contact thread persistence. PRODUCT-DECISION: a thread
  spans channels (phone/email/sms/chat/social), customer_id is the join
  key, agent_id is optional. Schemas created on demand via
  `CREATE TABLE IF NOT EXISTS`.
- `GET /api/billing-integrations/status`,
  `GET /api/billing-integrations/:provider/customer/:customerId`,
  `POST /api/billing-integrations/:provider/reconcile` — Comtech / Openet
  adapters. NEEDS-CREDS gated: 503 + `missing` when env vars unset.

### Schema additions

- `contact_threads(id, customer_id, subject, status, created_at, updated_at)`
- `contact_messages(id, thread_id, channel, direction, agent_id, body, metadata, created_at)`

### New frontend pages

- `frontend/src/pages/ContactThreads.js`
- `frontend/src/pages/BillingIntegrations.js`

`App.js` Routes + `components/Layout.js` sidebar both updated.

### Smoke test

**PASS.** Started `node server.js` on port 3001. Logged in as
`admin@telecom.com / admin123`. Authenticated calls:

- `GET /api/contact-threads` → 200 `{"threads":[]}`
- `GET /api/billing-integrations/status` → 200 with both providers
  `not configured` and per-provider `missing` arrays
- `GET /api/billing-integrations/comtech/customer/1` → 503
  `{"error":"comtech credentials not configured","missing":[...]}`

### Files touched

- `backend/routes/contactThreads.js` (new)
- `backend/routes/billingIntegrations.js` (new)
- `backend/server.js` (2 new `app.use` lines)
- `frontend/src/App.js`
- `frontend/src/components/Layout.js`
- `frontend/src/pages/ContactThreads.js` (new)
- `frontend/src/pages/BillingIntegrations.js` (new)

### Remaining backlog after pass 5

(empty)
