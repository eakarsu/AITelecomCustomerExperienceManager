# Production readiness

The governed API at `/api/governance` is the supported customer-experience recovery path. It persists tenant-scoped correlation evidence, constraints, proposals, operator approvals, execution receipts, failures, outcome measurements, an idempotent connector outbox, bounded retry scheduling, immutable attempts, and dead-letter state. It never dispatches work or contacts customers automatically.

## Deployment sequence

1. Review and back up the database, then apply `backend/migrations/001_governed_customer_experience.sql` separately with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/001_governed_customer_experience.sql`.
2. Copy `.env.example` to `.env`, replace placeholders, and configure a unique 32-plus-character JWT secret and explicit production CORS allowlist.
3. Install locked backend/frontend dependencies explicitly. `start.sh` does not install, seed, mutate schema, or kill unrelated processes.
4. Provision tenant memberships and deploy separately reviewed workers for telemetry, CRM/billing, ERP/WMS/TMS, read-only SCADA/device, GIS, weather, maintenance, and notification outbox items.

Production rejects legacy provider routes, mock/demo flags, wildcard CORS, weak secrets, and startup schema mutation. Generated AI/gap handlers are evaluation-only and quarantined by default.

## Required external validation

Replay versioned historical fixtures and measure freshness, forecast error, constraint violations, latency, missed events, and realized outcomes. Validate offline behavior, idempotency, retry exhaustion, dead-letter recovery, provider contracts, asset/site authorization, and manual fallback with operations owners. No live dispatch, customer contact, or provider contract has been validated by this repository-only change.
