import React, { useEffect, useState } from 'react';
import axios from 'axios';

function defaultPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function MonthlyReportExport() {
  const [period, setPeriod] = useState(defaultPeriod());
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const loadPreview = async (p) => {
    setError('');
    setPreview(null);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`http://localhost:3014/api/custom-views/monthly-report?format=json&period=${encodeURIComponent(p)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreview(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    loadPreview(period);
  }, []); // eslint-disable-line

  const downloadPdf = async () => {
    setStatus('Generating PDF…');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`http://localhost:3014/api/custom-views/monthly-report?period=${encodeURIComponent(period)}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cx-report-${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('PDF downloaded.');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setStatus('');
    }
  };

  return (
    <div data-testid="monthly-report-export" style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 14 }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#e2e8f0' }}>Monthly CX Report</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#94a3b8', fontSize: 13 }}>Period</label>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px' }}
        />
        <button
          onClick={() => loadPreview(period)}
          style={{ background: '#334155', color: '#e2e8f0', border: 0, borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
        >
          Refresh preview
        </button>
        <button
          onClick={downloadPdf}
          data-testid="download-pdf-btn"
          style={{ background: '#2563eb', color: 'white', border: 0, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
        >
          Download PDF
        </button>
        {status && <span style={{ color: '#34d399', fontSize: 12 }}>{status}</span>}
        {error && <span style={{ color: '#f87171', fontSize: 12 }}>{error}</span>}
      </div>

      {preview && (
        <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, color: '#cbd5e1', fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
            <Metric label="NPS Avg" value={preview.npsAvg} accent="#60a5fa" />
            <Metric label="NPS Δ" value={(preview.npsDelta >= 0 ? '+' : '') + preview.npsDelta} accent={preview.npsDelta >= 0 ? '#34d399' : '#f87171'} />
            <Metric label="Churn rate" value={`${preview.churnRate}%`} accent="#f59e0b" />
            <Metric label="Health" value={`${preview.healthScore}/100`} accent="#a78bfa" />
            <Metric label="Open tickets" value={preview.openTickets} accent="#fbbf24" />
            <Metric label="Closed tickets" value={preview.closedTickets} accent="#34d399" />
            <Metric label="AHT (min)" value={preview.avgHandleTimeMin} accent="#60a5fa" />
            <Metric label="SLA %" value={preview.slaCompliance} accent="#34d399" />
          </div>
          <div>
            <strong style={{ color: '#e2e8f0' }}>Top issues:</strong>
            <ul style={{ margin: '4px 0 8px 18px' }}>
              {preview.topIssues.map((it) => (
                <li key={it.title}>{it.title} — <span style={{ color: '#94a3b8' }}>{it.count} cases</span></li>
              ))}
            </ul>
            <strong style={{ color: '#e2e8f0' }}>Recommendations:</strong>
            <ul style={{ margin: '4px 0 0 18px' }}>
              {preview.recommendations.map((r) => (<li key={r}>{r}</li>))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div style={{ background: '#0f172a', border: `1px solid ${accent}33`, borderRadius: 6, padding: 8 }}>
      <div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div>
      <div style={{ color: accent, fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default MonthlyReportExport;
