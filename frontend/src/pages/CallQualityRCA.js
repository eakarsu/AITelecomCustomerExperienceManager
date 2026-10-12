import AIReport from '../components/AIReport';

import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = `${(process.env.REACT_APP_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '') || ''}/api`;

export default function CallQualityRCA() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({
    region: '',
    tower_id: '',
    time_window_hours: 24,
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
        region: form.region || undefined,
        tower_id: form.tower_id || undefined,
        time_window_hours: Number(form.time_window_hours) || 24,
        notes: form.notes || undefined,
      };
      const res = await axios.post(`${API_URL}/ai/call-quality-rca`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'RCA failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Call Quality Root Cause Analysis</h1>
      </div>
      <p style={{ marginBottom: 20, color: '#999' }}>
        AI synthesizes calls, towers, and outage data to surface root causes for poor call quality.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 20 }} data-full-ai-workspace="CallQualityRCA"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <div className="form-grid">
          <div className="form-group">
            <label>Region</label>
            <input type="text" value={form.region} onChange={(e) => handleChange('region', e.target.value)} placeholder="e.g. Bay Area" data-full-ai-field={fullAIExamples.bind({ current: form.region, change: (e) => handleChange('region', e.target.value), label: "form.region", manual: false, json: false, sample: '' }, "p1-1742", undefined)} />
          </div>
          <div className="form-group">
            <label>Tower ID</label>
            <input type="text" value={form.tower_id} onChange={(e) => handleChange('tower_id', e.target.value)} placeholder="e.g. T-1234" data-full-ai-field={fullAIExamples.bind({ current: form.tower_id, change: (e) => handleChange('tower_id', e.target.value), label: "form.tower_id", manual: false, json: false, sample: '' }, "p1-1973", undefined)} />
          </div>
          <div className="form-group">
            <label>Time Window (hours)</label>
            <input type="number" min={1} max={720} value={form.time_window_hours} onChange={(e) => handleChange('time_window_hours', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.time_window_hours, change: (e) => handleChange('time_window_hours', e.target.value), label: "form.time_window_hours", manual: false, json: false, sample: 24 }, "p1-2217", undefined)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label>Notes / Context</label>
          <textarea rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Weather, planned work, recent firmware updates..." data-full-ai-field={fullAIExamples.bind({ current: form.notes, change: (e) => handleChange('notes', e.target.value), label: "form.notes", manual: false, json: false, sample: '' }, "p1-2504", undefined)} />
        </div>
        <button type="submit" className="btn btn-ai" disabled={loading} style={{ marginTop: 14 }}>
          {loading ? 'Analyzing...' : 'Run Root Cause Analysis'}
        </button>
      </form>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Root Cause Findings</h3>
          <AIReport response={result} title={"Call quality root cause analysis"} />
        </div>
      )}
    </div>
  );
}
