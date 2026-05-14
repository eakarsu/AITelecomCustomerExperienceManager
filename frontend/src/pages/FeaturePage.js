import React, { useState, useEffect, useCallback } from 'react';
import { callQualityAPI, droppedCallsAPI, planRecommendationsAPI, proactiveIssuesAPI, npsPredictionAPI, churnAnalysisAPI, networkOutagesAPI, customerSentimentAPI, billingDisputesAPI, slaComplianceAPI, towerPerformanceAPI } from '../services/api';
import AIAnalysis from '../components/AIAnalysis';

const featureConfig = {
  'call-quality': {
    title: 'Call Quality Prediction',
    api: callQualityAPI,
    aiAction: 'predict',
    aiLabel: 'Predict Quality',
    columns: ['customer_name', 'phone_number', 'network_type', 'signal_strength', 'jitter_ms', 'packet_loss_pct', 'quality_score'],
    columnLabels: { customer_name: 'Customer', phone_number: 'Phone', network_type: 'Network', signal_strength: 'Signal (dBm)', jitter_ms: 'Jitter (ms)', packet_loss_pct: 'Pkt Loss %', quality_score: 'Score' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'phone_number', label: 'Phone Number', type: 'text' },
      { key: 'call_duration', label: 'Call Duration (sec)', type: 'number' },
      { key: 'signal_strength', label: 'Signal Strength (dBm)', type: 'number' },
      { key: 'network_type', label: 'Network Type', type: 'select', options: ['3G', '4G', '5G'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'jitter_ms', label: 'Jitter (ms)', type: 'number' },
      { key: 'packet_loss_pct', label: 'Packet Loss (%)', type: 'number' },
      { key: 'latency_ms', label: 'Latency (ms)', type: 'number' },
    ],
    detailFields: ['customer_name', 'phone_number', 'call_duration', 'signal_strength', 'network_type', 'location', 'jitter_ms', 'packet_loss_pct', 'latency_ms', 'quality_score'],
  },
  'dropped-calls': {
    title: 'Dropped Call Root Cause Analysis',
    api: droppedCallsAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Root Cause',
    columns: ['customer_name', 'phone_number', 'location', 'cell_tower_id', 'network_type', 'signal_strength', 'weather_condition'],
    columnLabels: { customer_name: 'Customer', phone_number: 'Phone', location: 'Location', cell_tower_id: 'Tower', network_type: 'Network', signal_strength: 'Signal', weather_condition: 'Weather' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'phone_number', label: 'Phone Number', type: 'text' },
      { key: 'call_time', label: 'Call Time', type: 'datetime-local' },
      { key: 'duration_before_drop', label: 'Duration Before Drop (sec)', type: 'number' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'cell_tower_id', label: 'Cell Tower ID', type: 'text' },
      { key: 'network_type', label: 'Network Type', type: 'select', options: ['3G', '4G', '5G'] },
      { key: 'signal_strength', label: 'Signal Strength (dBm)', type: 'number' },
      { key: 'weather_condition', label: 'Weather', type: 'select', options: ['Clear', 'Cloudy', 'Rain', 'Snow', 'Storm', 'Foggy'] },
      { key: 'concurrent_users', label: 'Concurrent Users', type: 'number' },
    ],
    detailFields: ['customer_name', 'phone_number', 'call_time', 'duration_before_drop', 'location', 'cell_tower_id', 'network_type', 'signal_strength', 'weather_condition', 'concurrent_users'],
  },
  'plan-recommendations': {
    title: 'Personalized Plan Recommendations',
    api: planRecommendationsAPI,
    aiAction: 'recommend',
    aiLabel: 'Get AI Recommendation',
    columns: ['customer_name', 'current_plan', 'monthly_bill', 'data_usage_gb', 'call_minutes', 'satisfaction_score'],
    columnLabels: { customer_name: 'Customer', current_plan: 'Plan', monthly_bill: 'Bill ($)', data_usage_gb: 'Data (GB)', call_minutes: 'Minutes', satisfaction_score: 'Satisfaction' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'current_plan', label: 'Current Plan', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Unlimited', 'Family'] },
      { key: 'monthly_bill', label: 'Monthly Bill ($)', type: 'number' },
      { key: 'data_usage_gb', label: 'Data Usage (GB)', type: 'number' },
      { key: 'call_minutes', label: 'Call Minutes', type: 'number' },
      { key: 'sms_count', label: 'SMS Count', type: 'number' },
      { key: 'roaming_usage', label: 'Roaming Usage', type: 'select', options: ['None', 'Occasional', 'Frequent'] },
      { key: 'contract_end_date', label: 'Contract End Date', type: 'date' },
      { key: 'satisfaction_score', label: 'Satisfaction (1-10)', type: 'number' },
    ],
    detailFields: ['customer_name', 'current_plan', 'monthly_bill', 'data_usage_gb', 'call_minutes', 'sms_count', 'roaming_usage', 'contract_end_date', 'satisfaction_score', 'recommended_plan'],
  },
  'proactive-issues': {
    title: 'Proactive Issue Resolution',
    api: proactiveIssuesAPI,
    aiAction: 'resolve',
    aiLabel: 'AI Resolution Plan',
    columns: ['customer_name', 'issue_type', 'severity', 'affected_service', 'region', 'status'],
    columnLabels: { customer_name: 'Customer', issue_type: 'Issue', severity: 'Severity', affected_service: 'Service', region: 'Region', status: 'Status' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'issue_type', label: 'Issue Type', type: 'text' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'affected_service', label: 'Affected Service', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'ticket_count_30d', label: 'Tickets (30 days)', type: 'number' },
      { key: 'avg_resolution_hours', label: 'Avg Resolution (hrs)', type: 'number' },
      { key: 'customer_tenure_months', label: 'Tenure (months)', type: 'number' },
      { key: 'is_premium', label: 'Premium Customer', type: 'select', options: ['true', 'false'] },
      { key: 'last_contact_reason', label: 'Last Contact Reason', type: 'text' },
    ],
    detailFields: ['customer_name', 'issue_type', 'severity', 'affected_service', 'region', 'ticket_count_30d', 'avg_resolution_hours', 'customer_tenure_months', 'is_premium', 'last_contact_reason', 'status'],
  },
  'nps-prediction': {
    title: 'NPS Prediction',
    api: npsPredictionAPI,
    aiAction: 'predict',
    aiLabel: 'Predict NPS',
    columns: ['customer_name', 'customer_segment', 'tenure_months', 'monthly_charges', 'num_support_tickets', 'predicted_nps', 'nps_category'],
    columnLabels: { customer_name: 'Customer', customer_segment: 'Segment', tenure_months: 'Tenure', monthly_charges: 'Monthly ($)', num_support_tickets: 'Tickets', predicted_nps: 'NPS', nps_category: 'Category' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'customer_segment', label: 'Segment', type: 'select', options: ['Consumer', 'SMB', 'Enterprise'] },
      { key: 'tenure_months', label: 'Tenure (months)', type: 'number' },
      { key: 'monthly_charges', label: 'Monthly Charges ($)', type: 'number' },
      { key: 'total_charges', label: 'Total Charges ($)', type: 'number' },
      { key: 'num_support_tickets', label: 'Support Tickets', type: 'number' },
      { key: 'avg_response_time_hours', label: 'Avg Response Time (hrs)', type: 'number' },
      { key: 'service_outages_30d', label: 'Outages (30 days)', type: 'number' },
      { key: 'billing_issues_90d', label: 'Billing Issues (90 days)', type: 'number' },
      { key: 'feature_adoption_score', label: 'Feature Adoption (1-10)', type: 'number' },
    ],
    detailFields: ['customer_name', 'customer_segment', 'tenure_months', 'monthly_charges', 'total_charges', 'num_support_tickets', 'avg_response_time_hours', 'service_outages_30d', 'billing_issues_90d', 'feature_adoption_score', 'predicted_nps', 'nps_category'],
  },
  'churn-analysis': {
    title: 'Customer Churn Analysis',
    api: churnAnalysisAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Churn Risk',
    columns: ['customer_name', 'contract_type', 'monthly_charges', 'num_complaints', 'usage_decline_pct', 'churn_probability', 'risk_level'],
    columnLabels: { customer_name: 'Customer', contract_type: 'Contract', monthly_charges: 'Monthly ($)', num_complaints: 'Complaints', usage_decline_pct: 'Usage Decline %', churn_probability: 'Churn %', risk_level: 'Risk' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'account_age_months', label: 'Account Age (months)', type: 'number' },
      { key: 'contract_type', label: 'Contract Type', type: 'select', options: ['Month-to-Month', 'Annual', 'Biennial'] },
      { key: 'monthly_charges', label: 'Monthly Charges ($)', type: 'number' },
      { key: 'total_charges', label: 'Total Charges ($)', type: 'number' },
      { key: 'num_complaints', label: 'Number of Complaints', type: 'number' },
      { key: 'payment_delays', label: 'Payment Delays', type: 'number' },
      { key: 'competitor_offers', label: 'Competitor Offers', type: 'number' },
      { key: 'usage_decline_pct', label: 'Usage Decline (%)', type: 'number' },
      { key: 'last_interaction_days', label: 'Days Since Last Interaction', type: 'number' },
    ],
    detailFields: ['customer_name', 'account_age_months', 'contract_type', 'monthly_charges', 'total_charges', 'num_complaints', 'payment_delays', 'competitor_offers', 'usage_decline_pct', 'last_interaction_days', 'churn_probability', 'risk_level'],
  },
  'network-outages': {
    title: 'Network Outage Monitoring',
    api: networkOutagesAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Outage Impact',
    columns: ['region', 'outage_type', 'affected_towers', 'affected_customers', 'duration_minutes', 'severity', 'restoration_status'],
    columnLabels: { region: 'Region', outage_type: 'Type', affected_towers: 'Towers', affected_customers: 'Customers', duration_minutes: 'Duration (min)', severity: 'Severity', restoration_status: 'Status' },
    fields: [
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'outage_type', label: 'Outage Type', type: 'select', options: ['Full Outage', 'Partial Degradation', 'Intermittent', 'Data Only', 'Voice Only'] },
      { key: 'affected_towers', label: 'Affected Towers', type: 'number' },
      { key: 'affected_customers', label: 'Affected Customers', type: 'number' },
      { key: 'start_time', label: 'Start Time', type: 'datetime-local' },
      { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'root_cause', label: 'Root Cause', type: 'text' },
      { key: 'restoration_status', label: 'Status', type: 'select', options: ['Ongoing', 'Restored', 'Monitoring'] },
      { key: 'sla_breached', label: 'SLA Breached', type: 'select', options: ['true', 'false'] },
    ],
    detailFields: ['region', 'outage_type', 'affected_towers', 'affected_customers', 'start_time', 'duration_minutes', 'severity', 'root_cause', 'restoration_status', 'sla_breached'],
  },
  'customer-sentiment': {
    title: 'Customer Sentiment Analysis',
    api: customerSentimentAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Sentiment',
    columns: ['customer_name', 'channel', 'interaction_type', 'agent_name', 'resolution_provided', 'sentiment_label'],
    columnLabels: { customer_name: 'Customer', channel: 'Channel', interaction_type: 'Type', agent_name: 'Agent', resolution_provided: 'Resolved', sentiment_label: 'Sentiment' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'channel', label: 'Channel', type: 'select', options: ['Phone', 'Chat', 'Email', 'Social Media'] },
      { key: 'feedback_text', label: 'Feedback Text', type: 'text' },
      { key: 'interaction_type', label: 'Interaction Type', type: 'select', options: ['Complaint', 'Inquiry', 'Feedback', 'Technical Support', 'Upgrade', 'Cancellation', 'Proactive Outreach'] },
      { key: 'agent_name', label: 'Agent Name', type: 'text' },
      { key: 'resolution_provided', label: 'Resolution Provided', type: 'select', options: ['true', 'false'] },
      { key: 'wait_time_minutes', label: 'Wait Time (min)', type: 'number' },
      { key: 'call_duration_seconds', label: 'Duration (sec)', type: 'number' },
      { key: 'language', label: 'Language', type: 'select', options: ['English', 'Spanish', 'French', 'Mandarin'] },
    ],
    detailFields: ['customer_name', 'channel', 'feedback_text', 'interaction_type', 'agent_name', 'resolution_provided', 'wait_time_minutes', 'call_duration_seconds', 'language', 'sentiment_score', 'sentiment_label'],
  },
  'billing-disputes': {
    title: 'Billing Dispute Resolution',
    api: billingDisputesAPI,
    aiAction: 'resolve',
    aiLabel: 'AI Resolve Dispute',
    columns: ['customer_name', 'account_number', 'dispute_type', 'disputed_amount', 'plan_type', 'previous_disputes', 'resolution_status'],
    columnLabels: { customer_name: 'Customer', account_number: 'Account', dispute_type: 'Type', disputed_amount: 'Amount ($)', plan_type: 'Plan', previous_disputes: 'Prev. Disputes', resolution_status: 'Status' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'account_number', label: 'Account Number', type: 'text' },
      { key: 'dispute_type', label: 'Dispute Type', type: 'select', options: ['Overcharge', 'Unauthorized Charge', 'Double Billing', 'Wrong Plan Rate', 'Service Not Received', 'Cancellation Fee'] },
      { key: 'disputed_amount', label: 'Disputed Amount ($)', type: 'number' },
      { key: 'billing_period', label: 'Billing Period', type: 'text' },
      { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Unlimited', 'Family', 'Annual'] },
      { key: 'overage_charges', label: 'Overage Charges ($)', type: 'number' },
      { key: 'roaming_charges', label: 'Roaming Charges ($)', type: 'number' },
      { key: 'disputed_services', label: 'Disputed Services', type: 'text' },
      { key: 'previous_disputes', label: 'Previous Disputes', type: 'number' },
    ],
    detailFields: ['customer_name', 'account_number', 'dispute_type', 'disputed_amount', 'billing_period', 'plan_type', 'overage_charges', 'roaming_charges', 'disputed_services', 'previous_disputes', 'resolution_status'],
  },
  'sla-compliance': {
    title: 'SLA Compliance Tracking',
    api: slaComplianceAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Compliance',
    columns: ['service_name', 'sla_target_pct', 'actual_uptime_pct', 'region', 'incidents_count', 'customer_tier', 'compliance_status'],
    columnLabels: { service_name: 'Service', sla_target_pct: 'SLA Target %', actual_uptime_pct: 'Actual %', region: 'Region', incidents_count: 'Incidents', customer_tier: 'Tier', compliance_status: 'Status' },
    fields: [
      { key: 'service_name', label: 'Service Name', type: 'text' },
      { key: 'sla_target_pct', label: 'SLA Target (%)', type: 'number' },
      { key: 'actual_uptime_pct', label: 'Actual Uptime (%)', type: 'number' },
      { key: 'measurement_period', label: 'Measurement Period', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'downtime_minutes', label: 'Downtime (min)', type: 'number' },
      { key: 'incidents_count', label: 'Incidents Count', type: 'number' },
      { key: 'mttr_minutes', label: 'MTTR (min)', type: 'number' },
      { key: 'customer_tier', label: 'Customer Tier', type: 'select', options: ['Standard', 'Premium', 'Enterprise', 'Critical'] },
      { key: 'penalty_clause', label: 'Penalty Clause', type: 'text' },
    ],
    detailFields: ['service_name', 'sla_target_pct', 'actual_uptime_pct', 'measurement_period', 'region', 'downtime_minutes', 'incidents_count', 'mttr_minutes', 'customer_tier', 'penalty_clause', 'compliance_status'],
  },
  'tower-performance': {
    title: 'Tower Performance Analytics',
    api: towerPerformanceAPI,
    aiAction: 'analyze',
    aiLabel: 'Analyze Tower Health',
    columns: ['tower_id', 'tower_name', 'location', 'tower_type', 'current_load_pct', 'uptime_pct', 'health_score'],
    columnLabels: { tower_id: 'Tower ID', tower_name: 'Name', location: 'Location', tower_type: 'Type', current_load_pct: 'Load %', uptime_pct: 'Uptime %', health_score: 'Health' },
    fields: [
      { key: 'tower_id', label: 'Tower ID', type: 'text' },
      { key: 'tower_name', label: 'Tower Name', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'tower_type', label: 'Tower Type', type: 'select', options: ['Macro', 'Small Cell', 'DAS', 'Micro'] },
      { key: 'max_capacity', label: 'Max Capacity (users)', type: 'number' },
      { key: 'current_load_pct', label: 'Current Load (%)', type: 'number' },
      { key: 'avg_signal_strength', label: 'Avg Signal (dBm)', type: 'number' },
      { key: 'uptime_pct', label: 'Uptime (%)', type: 'number' },
      { key: 'maintenance_due', label: 'Maintenance Due', type: 'select', options: ['true', 'false'] },
      { key: 'last_maintenance_date', label: 'Last Maintenance', type: 'date' },
    ],
    detailFields: ['tower_id', 'tower_name', 'location', 'tower_type', 'max_capacity', 'current_load_pct', 'avg_signal_strength', 'uptime_pct', 'maintenance_due', 'last_maintenance_date', 'health_score'],
  },
};

function getBadgeClass(key, value) {
  if (key === 'severity' || key === 'risk_level') {
    if (value === 'Critical') return 'badge-danger';
    if (value === 'High') return 'badge-warning';
    if (value === 'Medium') return 'badge-info';
    return 'badge-success';
  }
  if (key === 'status' || key === 'restoration_status' || key === 'resolution_status') {
    if (value === 'Open' || value === 'Ongoing') return 'badge-warning';
    if (value === 'In Progress' || value === 'AI Reviewed' || value === 'Monitoring') return 'badge-info';
    if (value === 'Restored' || value === 'Resolved') return 'badge-success';
    return 'badge-purple';
  }
  if (key === 'nps_category' || key === 'sentiment_label') {
    if (value === 'Promoter' || value === 'Very Positive' || value === 'Positive') return 'badge-success';
    if (value === 'Passive' || value === 'Neutral') return 'badge-warning';
    return 'badge-danger';
  }
  if (key === 'compliance_status') {
    if (value === 'Compliant') return 'badge-success';
    if (value === 'At Risk') return 'badge-warning';
    if (value === 'Breached') return 'badge-danger';
    return 'badge-info';
  }
  if (key === 'quality_score' || key === 'health_score') {
    const n = parseInt(value);
    if (n >= 7) return 'badge-success';
    if (n >= 5) return 'badge-warning';
    return 'badge-danger';
  }
  return '';
}

function formatFieldLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace('Pct', '%').replace('Ms', '(ms)').replace('Gb', '(GB)');
}

function FeaturePage({ feature }) {
  const config = featureConfig[feature];
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await config.api.getAll();
      // Handle both paginated { data, pagination } and flat array responses
      setData(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [config.api]);

  useEffect(() => {
    loadData();
    setSelectedItem(null);
    setShowForm(false);
    setAiResult(null);
    setSearchQuery('');
  }, [feature, loadData]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiResult(item.ai_analysis ? { analysis: item.ai_analysis } : null);
    setShowForm(false);
  };

  const handleNew = () => {
    setFormData({});
    setEditItem(null);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleEdit = (item) => {
    const fd = {};
    config.fields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'datetime-local' && val) {
        val = new Date(val).toISOString().slice(0, 16);
      }
      if (['is_premium', 'sla_breached', 'maintenance_due', 'resolution_provided'].includes(f.key)) {
        val = String(val);
      }
      fd[f.key] = val ?? '';
    });
    setFormData(fd);
    setEditItem(item);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleDelete = async (id) => {
    try {
      await config.api.delete(id);
      showToast('Record deleted successfully');
      setShowDeleteConfirm(null);
      setSelectedItem(null);
      loadData();
    } catch {
      showToast('Failed to delete record', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      ['is_premium', 'sla_breached', 'maintenance_due', 'resolution_provided'].forEach(boolKey => {
        if (submitData[boolKey] !== undefined) {
          submitData[boolKey] = submitData[boolKey] === 'true';
        }
      });
      if (editItem) {
        await config.api.update(editItem.id, submitData);
        showToast('Record updated successfully');
      } else {
        await config.api.create(submitData);
        showToast('Record created successfully');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleAI = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await config.api[config.aiAction](item.id);
      setAiResult(res.data);
      loadData();
    } catch (err) {
      showToast('AI analysis failed. Check your OpenRouter API key.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredData = data.filter(item =>
    searchQuery === '' || Object.values(item).some(v =>
      String(v).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const isBadgeField = (key) => ['severity', 'risk_level', 'status', 'nps_category', 'quality_score', 'restoration_status', 'resolution_status', 'sentiment_label', 'compliance_status', 'health_score'].includes(key);

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1>{config.title}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleNew}>+ New Record</button>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search records..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {config.columns.map(col => (
                <th key={col}>{config.columnLabels[col] || formatFieldLabel(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={config.columns.length}>
                <div className="empty-state"><p>No records found</p><button className="btn btn-primary" onClick={handleNew}>Add First Record</button></div>
              </td></tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {config.columns.map(col => (
                    <td key={col}>
                      {isBadgeField(col) && item[col] != null ? (
                        <span className={`badge ${getBadgeClass(col, item[col])}`}>{item[col]}</span>
                      ) : typeof item[col] === 'boolean' ? (
                        item[col] ? 'Yes' : 'No'
                      ) : (
                        String(item[col] ?? '—')
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedItem.customer_name || selectedItem.tower_name || selectedItem.service_name || selectedItem.region || 'Record Details'}</h2>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {config.detailFields.map(key => (
                  <div key={key} className="detail-item">
                    <label>{formatFieldLabel(key)}</label>
                    <span>
                      {['is_premium', 'sla_breached', 'maintenance_due', 'resolution_provided'].includes(key) ? (selectedItem[key] ? 'Yes' : 'No') :
                       key === 'call_time' && selectedItem[key] ? new Date(selectedItem[key]).toLocaleString() :
                       String(selectedItem[key] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Parsed AI Scores — shown after analysis */}
              {aiResult && aiResult.parsed && (
                <div style={{ background: '#0f172a', border: '1px solid #7c3aed', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <div style={{ color: '#7c3aed', fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>AI Parsed Scores</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {Object.entries(aiResult.parsed).filter(([k, v]) => typeof v === 'number' || (typeof v === 'string' && !Array.isArray(v) && v.length < 30)).map(([k, v]) => (
                      <div key={k} style={{ textAlign: 'center', minWidth: '80px' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06b6d4' }}>{typeof v === 'number' ? v : v}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999' }}>{k.replace(/_/g, ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {(aiLoading || aiResult) && (
                <AIAnalysis result={aiResult} loading={aiLoading} />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ai" onClick={() => handleAI(selectedItem)} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : config.aiLabel}
              </button>
              <button className="btn btn-secondary" onClick={() => handleEdit(selectedItem)}>Edit</button>
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(selectedItem.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editItem ? 'Edit Record' : 'New Record'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {config.fields.map(field => (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                          required
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          step={field.type === 'number' ? 'any' : undefined}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                          required={field.key === 'customer_name'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
