import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callQualityAPI, droppedCallsAPI, planRecommendationsAPI, proactiveIssuesAPI, npsPredictionAPI, churnAnalysisAPI, networkOutagesAPI, customerSentimentAPI, billingDisputesAPI, slaComplianceAPI, towerPerformanceAPI, customerProfilesAPI, supportTicketsAPI, paymentHistoryAPI, appointmentsAPI, usageTrackingAPI } from '../services/api';

const features = [
  {
    key: 'call-quality',
    title: 'Call Quality Prediction',
    description: 'AI-powered call quality scoring and prediction. Monitor signal strength, jitter, packet loss, and latency to predict call quality issues.',
    icon: '📞',
    api: callQualityAPI,
  },
  {
    key: 'dropped-calls',
    title: 'Dropped Call Root Cause',
    description: 'Intelligent root cause analysis for dropped calls. Identify tower congestion, signal weakness, and environmental factors.',
    icon: '📵',
    api: droppedCallsAPI,
  },
  {
    key: 'plan-recommendations',
    title: 'Plan Recommendations',
    description: 'Personalized plan recommendations based on usage patterns. Optimize customer value and reduce overspending.',
    icon: '💡',
    api: planRecommendationsAPI,
  },
  {
    key: 'proactive-issues',
    title: 'Proactive Issue Resolution',
    description: 'Detect and resolve customer issues before they escalate. AI-driven prioritization and automated resolution workflows.',
    icon: '🔧',
    api: proactiveIssuesAPI,
  },
  {
    key: 'nps-prediction',
    title: 'NPS Prediction',
    description: 'Predict Net Promoter Scores using customer interaction data. Identify at-risk customers and engagement opportunities.',
    icon: '📈',
    api: npsPredictionAPI,
  },
  {
    key: 'churn-analysis',
    title: 'Churn Analysis',
    description: 'Predict customer churn probability and identify risk factors. Generate retention strategies and win-back offers.',
    icon: '🔄',
    api: churnAnalysisAPI,
  },
  {
    key: 'network-outages',
    title: 'Network Outage Monitoring',
    description: 'Track and analyze network outages across regions. AI-powered impact assessment and recovery planning.',
    icon: '🌐',
    api: networkOutagesAPI,
  },
  {
    key: 'customer-sentiment',
    title: 'Customer Sentiment Analysis',
    description: 'AI-driven sentiment analysis of customer interactions across all channels. Detect emotions and intent.',
    icon: '💬',
    api: customerSentimentAPI,
  },
  {
    key: 'billing-disputes',
    title: 'Billing Dispute Resolution',
    description: 'Automated billing dispute analysis with AI-powered resolution recommendations and credit calculations.',
    icon: '💳',
    api: billingDisputesAPI,
  },
  {
    key: 'sla-compliance',
    title: 'SLA Compliance Tracking',
    description: 'Monitor service level agreement compliance. AI identifies breach risks and improvement opportunities.',
    icon: '📋',
    api: slaComplianceAPI,
  },
  {
    key: 'tower-performance',
    title: 'Tower Performance Analytics',
    description: 'Cell tower health monitoring and capacity planning. AI optimizes network infrastructure performance.',
    icon: '📡',
    api: towerPerformanceAPI,
  },
];

const nonAIFeatures = [
  {
    key: 'customer-profiles',
    title: 'Customer Profiles',
    description: 'Central customer management hub. Track contact info, plans, account status, and customer details.',
    icon: '👤',
    api: customerProfilesAPI,
  },
  {
    key: 'support-tickets',
    title: 'Support Tickets',
    description: 'Track and manage customer support tickets. Assign agents, set priorities, and monitor resolution.',
    icon: '🎫',
    api: supportTicketsAPI,
  },
  {
    key: 'payment-history',
    title: 'Payment History',
    description: 'Payment and invoice records. Track transactions, billing periods, payment methods, and late fees.',
    icon: '💰',
    api: paymentHistoryAPI,
  },
  {
    key: 'appointments',
    title: 'Appointments',
    description: 'Schedule and manage technician visits and service appointments. Track status and assignments.',
    icon: '📅',
    api: appointmentsAPI,
  },
  {
    key: 'usage-tracking',
    title: 'Usage Tracking',
    description: 'Monitor data, call, and SMS usage across customers. Track limits, overages, and roaming usage.',
    icon: '📊',
    api: usageTrackingAPI,
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      const results = {};
      const allFeatures = [...features, ...nonAIFeatures];
      for (const f of allFeatures) {
        try {
          const res = await f.api.getAll();
          results[f.key] = res.data.length;
        } catch {
          results[f.key] = 0;
        }
      }
      setCounts(results);
    };
    loadCounts();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>AI-Powered Telecom Customer Experience Management</p>
      </div>

      <div className="feature-grid">
        {features.map(f => (
          <div key={f.key} className="feature-card" onClick={() => navigate(`/${f.key}`)}>
            <div className="card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <div className="card-stats">
              <div className="card-stat">
                <div className="stat-value">{counts[f.key] ?? '...'}</div>
                <div className="stat-label">Records</div>
              </div>
              <div className="card-stat">
                <div className="stat-value">AI</div>
                <div className="stat-label">Powered</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-header" style={{ marginTop: '2rem' }}>
        <h2>Operations</h2>
        <p>Core Telecom Management Tools</p>
      </div>

      <div className="feature-grid">
        {nonAIFeatures.map(f => (
          <div key={f.key} className="feature-card" onClick={() => navigate(`/${f.key}`)}>
            <div className="card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <div className="card-stats">
              <div className="card-stat">
                <div className="stat-value">{counts[f.key] ?? '...'}</div>
                <div className="stat-label">Records</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
