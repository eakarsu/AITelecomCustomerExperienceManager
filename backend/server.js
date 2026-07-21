const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./db');
const auth = require('./middleware/auth');
const { validateRuntime } = require('./governance/runtime');
const { createProviderGate } = require('./governance/providerGate');

validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map((value) => value.trim()).filter(Boolean);
const providerPrefixes = [
  '/api/ai', '/api/call-quality', '/api/dropped-calls', '/api/plan-recommendations',
  '/api/proactive-issues', '/api/nps-prediction', '/api/churn-analysis',
  '/api/network-outages', '/api/customer-sentiment', '/api/billing-disputes',
  '/api/sla-compliance', '/api/tower-performance', '/api/billing-integrations',
  '/api/churn-early-warning', '/api/sentiment-routing', '/api/call-quality-rca',
  '/api/dynamic-plan-recommendations', '/api/customer-health-score',
  '/api/outage-notification', '/api/gap-',
];

app.set('db', pool);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('./governance/router'));
app.use('/api', auth);
app.use(createProviderGate(providerPrefixes));

const protectedRoutes = [
  ['/api/customer-profiles', './routes/customerProfiles'],
  ['/api/support-tickets', './routes/supportTickets'],
  ['/api/payment-history', './routes/paymentHistory'],
  ['/api/appointments', './routes/appointments'],
  ['/api/usage-tracking', './routes/usageTracking'],
  ['/api/customers', './routes/customer360'],
  ['/api/contact-threads', './routes/contactThreads'],
  ['/api/custom-views', './routes/customViews'],
];
for (const [routePath, modulePath] of protectedRoutes) app.use(routePath, require(modulePath));

if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true') {
  const legacyRoutes = [
    ['/api/call-quality', './routes/callQuality'],
    ['/api/dropped-calls', './routes/droppedCalls'],
    ['/api/plan-recommendations', './routes/planRecommendations'],
    ['/api/proactive-issues', './routes/proactiveIssues'],
    ['/api/nps-prediction', './routes/npsPrediction'],
    ['/api/churn-analysis', './routes/churnAnalysis'],
    ['/api/network-outages', './routes/networkOutages'],
    ['/api/customer-sentiment', './routes/customerSentiment'],
    ['/api/billing-disputes', './routes/billingDisputes'],
    ['/api/sla-compliance', './routes/slaCompliance'],
    ['/api/tower-performance', './routes/towerPerformance'],
    ['/api/billing-integrations', './routes/billingIntegrations'],
    ['/api/ai', './routes/aiFeatures'],
    ['/api/churn-early-warning', './routes/churnEarlyWarning'],
    ['/api/sentiment-routing', './routes/sentimentRouting'],
    ['/api/call-quality-rca', './routes/callQualityRca'],
    ['/api/dynamic-plan-recommendations', './routes/dynamicPlanRecommendations'],
    ['/api/customer-health-score', './routes/customerHealthScore'],
    ['/api/outage-notification', './routes/outageNotification'],
    ['/api/gap-critical-no-ai-endpoints-for-churn-prediction-sentiment', './routes/gapCriticalNoAiEndpointsForChurnPredictionSentiment'],
    ['/api/gap-no-conversational-customer-service-copilot', './routes/gapNoConversationalCustomerServiceCopilot'],
    ['/api/gap-no-retention-offer-optimizer', './routes/gapNoRetentionOfferOptimizer'],
    ['/api/gap-no-multi-channel-contact-history-phone-sms-email-chat', './routes/gapNoMultiChannelContactHistoryPhoneSmsEmailChat'],
    ['/api/gap-limited-billing-system-integrations-only-stub-layer-no', './routes/gapLimitedBillingSystemIntegrationsOnlyStubLayerNo'],
    ['/api/gap-no-customer-self-service-portal', './routes/gapNoCustomerSelfServicePortal'],
    ['/api/gap-no-correlation-engine-between-network-performance-and-satisfaction', './routes/gapNoCorrelationEngineBetweenNetworkPerformanceAndSatisfaction'],
    ['/api/gap-no-webhooks-for-outage-events', './routes/gapNoWebhooksForOutageEvents'],
    ['/api/gap-limited-notifications-one-reference-only-not-a-full', './routes/gapLimitedNotificationsOneReferenceOnlyNotAFull'],
    ['/api/gap-no-audit-logging', './routes/gapNoAuditLogging'],
  ];
  for (const [routePath, modulePath] of legacyRoutes) app.use(routePath, require(modulePath));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

module.exports = app;
