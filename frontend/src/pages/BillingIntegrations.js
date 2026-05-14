import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function BillingIntegrations() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/billing-integrations/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatus(res.data.status);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load integration status');
      }
    })();
  }, []);

  return (
    <div>
      <div className="page-header"><h1>Billing System Integrations</h1></div>
      <p style={{ marginBottom: 20, color: '#999' }}>Provider connection status. Set the listed env vars to enable each adapter.</p>
      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}
      {status && (
        <div className="card" style={{ padding: 16 }}>
          {Object.entries(status).map(([provider, s]) => (
            <div key={provider} style={{ padding: 12, borderBottom: '1px solid #333' }}>
              <strong style={{ textTransform: 'capitalize' }}>{provider}</strong>:{' '}
              <span style={{ color: s.configured ? '#4ade80' : '#f87171' }}>
                {s.configured ? 'configured' : 'not configured'}
              </span>
              {!s.configured && (
                <div style={{ color: '#999', marginTop: 4, fontSize: 12 }}>
                  Missing: {s.missing.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
