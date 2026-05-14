import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function SentimentRouting() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/ai/sentiment-routing`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError('AI is not configured (OPENROUTER_API_KEY missing).');
      } else {
        setError(err.response?.data?.error || err.message || 'Routing analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sentiment-Driven Routing</h1>
      </div>
      <p style={{ marginBottom: 20, color: '#999' }}>
        Generates routing rules based on recent customer sentiment and ticket signals.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <button type="submit" className="btn btn-ai" disabled={loading}>
          {loading ? 'Analyzing...' : 'Generate Routing Rules'}
        </button>
      </form>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Result</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#0f172a', padding: 14, borderRadius: 8, color: '#cbd5e1', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
