import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';

function ProactiveCare() {
  const [campaigns, setCampaigns] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await aiAPI.outreachCampaigns();
      const data = res.data?.data || res.data || [];
      setCampaigns(data);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleGenerateCampaigns = async () => {
    setGenerating(true);
    try {
      const res = await aiAPI.proactiveCare();
      const { at_risk_customers, campaigns_generated } = res.data;
      showToast(`Generated ${campaigns_generated} outreach campaigns for ${at_risk_customers} at-risk customers`);
      loadCampaigns();
    } catch (err) {
      showToast('Failed to generate campaigns: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (level) => {
    if (!level) return '#999';
    const l = level.toLowerCase();
    if (l.includes('critical')) return '#ef4444';
    if (l.includes('high')) return '#f59e0b';
    if (l.includes('medium')) return '#06b6d4';
    return '#10b981';
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1>Proactive Care Engine</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-ai"
            onClick={handleGenerateCampaigns}
            disabled={generating}
          >
            {generating ? 'Analyzing at-risk customers...' : 'Generate Outreach Campaigns'}
          </button>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', border: '1px solid #7c3aed', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#b0b0b0', fontSize: '0.9rem' }}>
          The Proactive Care Engine identifies customers with high churn risk (50%+ probability) and uses AI to
          generate personalized retention outreach messages. Click "Generate Outreach Campaigns" to analyze current at-risk customers.
        </p>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Churn Risk</th>
              <th>Risk Level</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingCampaigns ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading campaigns...</td></tr>
            ) : generating ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '12px', color: '#777' }}>AI is analyzing customer data and generating personalized outreach...</p>
              </td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <p>No outreach campaigns yet. Click "Generate Outreach Campaigns" to start.</p>
                </div>
              </td></tr>
            ) : (
              campaigns.map(c => (
                <tr key={c.id} onClick={() => setSelectedCampaign(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{c.customer_name}</td>
                  <td>
                    <span style={{ color: getRiskColor(c.risk_level), fontWeight: 600 }}>
                      {c.churn_probability != null ? `${c.churn_probability}%` : 'High'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: getRiskColor(c.risk_level) + '22', color: getRiskColor(c.risk_level) }}>
                      {c.risk_level || 'High'}
                    </span>
                  </td>
                  <td>{c.channel || 'Email'}</td>
                  <td>
                    <span className={`badge ${c.status === 'sent' ? 'badge-success' : c.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                      {c.status || 'pending'}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setSelectedCampaign(c); }}>
                      View Message
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Message Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCampaign(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Outreach Message — {selectedCampaign.customer_name}</h2>
              <button className="modal-close" onClick={() => setSelectedCampaign(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span className="badge badge-warning">Churn: {selectedCampaign.churn_probability != null ? `${selectedCampaign.churn_probability}%` : 'High'}</span>
                <span className="badge badge-info">{selectedCampaign.channel || 'Email'}</span>
                <span className={`badge ${selectedCampaign.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>{selectedCampaign.status}</span>
              </div>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#d1d5db', maxHeight: '400px', overflowY: 'auto' }}>
                {selectedCampaign.outreach_message}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCampaign(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProactiveCare;
