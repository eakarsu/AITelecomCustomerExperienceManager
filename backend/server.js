require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Make pool available to routes
app.set('db', pool);

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
