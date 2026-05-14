require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Make pool available to routes
app.set('db', pool);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/call-quality', require('./routes/callQuality'));
app.use('/api/dropped-calls', require('./routes/droppedCalls'));
app.use('/api/plan-recommendations', require('./routes/planRecommendations'));
app.use('/api/proactive-issues', require('./routes/proactiveIssues'));
app.use('/api/nps-prediction', require('./routes/npsPrediction'));
app.use('/api/churn-analysis', require('./routes/churnAnalysis'));
app.use('/api/network-outages', require('./routes/networkOutages'));
app.use('/api/customer-sentiment', require('./routes/customerSentiment'));
app.use('/api/billing-disputes', require('./routes/billingDisputes'));
app.use('/api/sla-compliance', require('./routes/slaCompliance'));
app.use('/api/tower-performance', require('./routes/towerPerformance'));
app.use('/api/customer-profiles', require('./routes/customerProfiles'));
app.use('/api/support-tickets', require('./routes/supportTickets'));
app.use('/api/payment-history', require('./routes/paymentHistory'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/usage-tracking', require('./routes/usageTracking'));

// New feature routes
app.use('/api/ai', require('./routes/aiFeatures'));
app.use('/api/customers', require('./routes/customer360'));

// Apply pass 5 — additive routes (multi-channel contact threads, billing integrations).
app.use('/api/contact-threads', require('./routes/contactThreads'));
app.use('/api/billing-integrations', require('./routes/billingIntegrations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('/api/churn-early-warning', require('./routes/churnEarlyWarning')); app.use('/api/sentiment-routing', require('./routes/sentimentRouting')); app.use('/api/call-quality-rca', require('./routes/callQualityRca')); app.use('/api/dynamic-plan-recommendations', require('./routes/dynamicPlanRecommendations')); app.use('/api/customer-health-score', require('./routes/customerHealthScore')); app.use('/api/outage-notification', require('./routes/outageNotification'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-critical-no-ai-endpoints-for-churn-prediction-sentiment', require('./routes/gapCriticalNoAiEndpointsForChurnPredictionSentiment'));
app.use('/api/gap-no-conversational-customer-service-copilot', require('./routes/gapNoConversationalCustomerServiceCopilot'));
app.use('/api/gap-no-retention-offer-optimizer', require('./routes/gapNoRetentionOfferOptimizer'));
app.use('/api/gap-no-multi-channel-contact-history-phone-sms-email-chat', require('./routes/gapNoMultiChannelContactHistoryPhoneSmsEmailChat'));
app.use('/api/gap-limited-billing-system-integrations-only-stub-layer-no', require('./routes/gapLimitedBillingSystemIntegrationsOnlyStubLayerNo'));
app.use('/api/gap-no-customer-self-service-portal', require('./routes/gapNoCustomerSelfServicePortal'));
app.use('/api/gap-no-correlation-engine-between-network-performance-and-satisfaction', require('./routes/gapNoCorrelationEngineBetweenNetworkPerformanceAndSatisfaction'));
app.use('/api/gap-no-webhooks-for-outage-events', require('./routes/gapNoWebhooksForOutageEvents'));
app.use('/api/gap-limited-notifications-one-reference-only-not-a-full', require('./routes/gapLimitedNotificationsOneReferenceOnlyNotAFull'));
app.use('/api/gap-no-audit-logging', require('./routes/gapNoAuditLogging'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
