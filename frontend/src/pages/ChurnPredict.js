import AIReport from '../components/AIReport';

import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = `${(process.env.REACT_APP_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '') || ''}/api`;

export default function ChurnPredict() {
  const fullAIExamples = useFullAIExamples();

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

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 20 }} data-full-ai-workspace="ChurnPredict"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <div className="form-grid">
          <div className="form-group">
            <label>Customer ID (optional)</label>
            <input type="number" value={form.customer_id} onChange={(e) => handleChange('customer_id', e.target.value)} placeholder="leave blank for portfolio scan" data-full-ai-field={fullAIExamples.bind({ current: form.customer_id, change: (e) => handleChange('customer_id', e.target.value), label: "form.customer_id", manual: false, json: false, sample: '' }, "p1-1681", undefined)} />
          </div>
          <div className="form-group">
            <label>Horizon (days)</label>
            <input type="number" min={7} max={365} value={form.horizon_days} onChange={(e) => handleChange('horizon_days', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.horizon_days, change: (e) => handleChange('horizon_days', e.target.value), label: "form.horizon_days", manual: false, json: false, sample: 90 }, "p1-1947", undefined)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label>Notes / Context</label>
          <textarea rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Recent outage, contract renewals, competitor offers..." data-full-ai-field={fullAIExamples.bind({ current: form.notes, change: (e) => handleChange('notes', e.target.value), label: "form.notes", manual: false, json: false, sample: '' }, "p1-2224", undefined)} />
        </div>
        <button type="submit" className="btn btn-ai" disabled={loading} style={{ marginTop: 14 }}>
          {loading ? 'Predicting...' : 'Predict Churn Risk'}
        </button>
      </form>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Prediction</h3>
          <AIReport response={result} title={"Churn prediction"} />
        </div>
      )}
    </div>
  );
}
