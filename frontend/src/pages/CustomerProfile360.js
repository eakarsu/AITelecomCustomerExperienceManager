import React, { useState } from 'react';
import { customer360API } from '../services/api';

function StatBadge({ label, value, color }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ background: '#1a1a2e', border: `1px solid ${color || '#333'}`, borderRadius: '8px', padding: '12px', textAlign: 'center', minWidth: '120px' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: color || '#7c3aed' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function DataTab({ title, data, color }) {
  if (!data || data.length === 0) return (
    <div style={{ padding: '12px', color: '#555', fontStyle: 'italic' }}>No records</div>
  );
  const keys = Object.keys(data[0]).filter(k => !['id', 'ai_analysis'].includes(k)).slice(0, 6);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {keys.map(k => <th key={k} style={{ padding: '8px', textAlign: 'left', color: color || '#999', borderBottom: '1px solid #333' }}>{k.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
              {keys.map(k => (
                <td key={k} style={{ padding: '8px', color: '#ccc' }}>
                  {typeof row[k] === 'boolean' ? (row[k] ? 'Yes' : 'No') : String(row[k] ?? '—').substring(0, 50)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 5 && <div style={{ padding: '8px', color: '#555', fontSize: '0.8rem' }}>+{data.length - 5} more records</div>}
    </div>
  );
}

function CustomerProfile360() {
  const [searchName, setSearchName] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('call_quality');

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setError('');
    setProfile(null);
    try {
      const res = await customer360API.getView(searchName.trim());
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = profile ? [
    { key: 'call_quality', label: `Call Quality (${profile.record_counts.call_quality})`, color: '#06b6d4' },
    { key: 'dropped_calls', label: `Dropped Calls (${profile.record_counts.dropped_calls})`, color: '#ef4444' },
    { key: 'churn_analysis', label: `Churn (${profile.record_counts.churn_records})`, color: '#f59e0b' },
    { key: 'nps_predictions', label: `NPS (${profile.record_counts.nps_records})`, color: '#8b5cf6' },
    { key: 'customer_sentiment', label: `Sentiment (${profile.record_counts.sentiment_records})`, color: '#10b981' },
    { key: 'billing_disputes', label: `Billing (${profile.record_counts.billing_disputes})`, color: '#ec4899' },
    { key: 'support_tickets', label: `Tickets (${profile.record_counts.support_tickets})`, color: '#14b8a6' },
    { key: 'payment_history', label: `Payments (${profile.record_counts.payment_records})`, color: '#f97316' },
    { key: 'outreach_campaigns', label: `Outreach (${profile.record_counts.outreach_campaigns})`, color: '#7c3aed' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Customer 360 View</h1>
        <span className="badge badge-info">Unified Profile</span>
      </div>

      <div className="search-bar" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search customer name..."
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'View 360 Profile'}
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}

      {profile && (
        <>
          {/* Risk Summary */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>{profile.customer_name} — Risk Summary</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <StatBadge label="Churn Probability" value={profile.risk_summary.churn_probability != null ? `${profile.risk_summary.churn_probability}%` : null} color="#ef4444" />
              <StatBadge label="Churn Risk Level" value={profile.risk_summary.churn_risk_level} color="#f59e0b" />
              <StatBadge label="Predicted NPS" value={profile.risk_summary.predicted_nps} color="#8b5cf6" />
              <StatBadge label="NPS Category" value={profile.risk_summary.nps_category} color="#10b981" />
              <StatBadge label="Avg Call Quality" value={profile.risk_summary.avg_call_quality_score} color="#06b6d4" />
              <StatBadge label="Billing Disputes" value={profile.risk_summary.total_billing_disputes} color="#ec4899" />
              <StatBadge label="Dropped Calls" value={profile.risk_summary.total_dropped_calls} color="#ef4444" />
            </div>

            {/* Sentiment summary */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <span className="badge badge-success">Positive: {profile.sentiment_summary.positive}</span>
              <span className="badge badge-warning">Neutral: {profile.sentiment_summary.neutral}</span>
              <span className="badge badge-danger">Negative: {profile.sentiment_summary.negative}</span>
            </div>
          </div>

          {/* Profile from customer_profiles table */}
          {profile.profile && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Account Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {['plan_type', 'account_status', 'join_date', 'monthly_bill', 'preferred_contact', 'city', 'state'].map(k => (
                  profile.profile[k] != null && (
                    <div key={k} style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ color: '#ccc', fontWeight: 500 }}>
                        {k === 'join_date' ? new Date(profile.profile[k]).toLocaleDateString() : String(profile.profile[k])}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Tabbed Data View */}
          <div className="card">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activeTab === tab.key ? tab.color : '#333',
                    background: activeTab === tab.key ? tab.color + '22' : 'transparent',
                    color: activeTab === tab.key ? tab.color : '#666',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <DataTab
              title={activeTab}
              data={profile.data[activeTab]}
              color={tabs.find(t => t.key === activeTab)?.color}
            />
          </div>
        </>
      )}

      {!profile && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>Enter a customer name to see their complete 360-degree profile</p>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile360;
