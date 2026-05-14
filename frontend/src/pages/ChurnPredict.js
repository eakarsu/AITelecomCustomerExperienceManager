import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ChurnPredict() {
  const [form, setForm] = useState({
    customer_id: '',
    horizon_days: 90,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...(form.customer_id ? { customer_id: Number(form.customer_id) } : {}),
        horizon_days: Number(form.horizon_days) || 90,
        notes: form.notes || undefined,
      };
      const res = await axios.post(`${API_URL}/ai/churn-predict`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Churn Prediction</h1>
      </div>
      <p style={{ marginBottom: 20, color: '#999' }}>
        DB-grounded churn scoring with retention-action recommendations.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Customer ID (optional)</label>
            <input type="number" value={form.customer_id} onChange={(e) => handleChange('customer_id', e.target.value)} placeholder="leave blank for portfolio scan" />
          </div>
          <div className="form-group">
            <label>Horizon (days)</label>
            <input type="number" min={7} max={365} value={form.horizon_days} onChange={(e) => handleChange('horizon_days', e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label>Notes / Context</label>
          <textarea rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Recent outage, contract renewals, competitor offers..." />
        </div>
        <button type="submit" className="btn btn-ai" disabled={loading} style={{ marginTop: 14 }}>
          {loading ? 'Predicting...' : 'Predict Churn Risk'}
        </button>
      </form>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Prediction</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#0f172a', padding: 14, borderRadius: 8, color: '#cbd5e1', overflow: 'auto' }}>
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
