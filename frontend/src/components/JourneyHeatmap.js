import React, { useEffect, useState } from 'react';
import axios from 'axios';

function colorFor(value, max) {
  if (max === 0) return '#1e293b';
  const t = Math.min(1, value / max);
  // dark blue -> hot orange
  const r = Math.round(30 + (245 - 30) * t);
  const g = Math.round(58 + (158 - 58) * t);
  const b = Math.round(138 + (11 - 138) * t);
  return `rgb(${r},${g},${b})`;
}

function JourneyHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:3014/api/custom-views/journey-heatmap', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, []);

  if (error) return <div style={{ color: '#f87171' }}>Heatmap error: {error}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading journey heatmap…</div>;

  const max = Math.max(...data.cells.map((c) => c.count));

  return (
    <div data-testid="journey-heatmap" style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Customer Journey Heatmap</h3>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          Hottest: <strong style={{ color: '#fbbf24' }}>{data.hottest.touchpoint} / {data.hottest.sentiment}</strong> ({data.hottest.count})
        </div>
      </div>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', color: '#94a3b8', fontSize: 12, padding: '4px 6px' }}>Touchpoint</th>
            {data.sentiments.map((s) => (
              <th key={s} style={{ color: '#94a3b8', fontSize: 12, padding: '4px 6px', textAlign: 'center' }}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.grid.map((row) => (
            <tr key={row.touchpoint}>
              <td style={{ color: '#e2e8f0', fontSize: 13, padding: '6px 8px', whiteSpace: 'nowrap' }}>{row.touchpoint}</td>
              {data.sentiments.map((s) => {
                const v = row.values[s] || 0;
                return (
                  <td
                    key={s}
                    title={`${row.touchpoint} • ${s}: ${v}`}
                    style={{
                      background: colorFor(v, max),
                      color: '#0f172a',
                      fontWeight: 600,
                      textAlign: 'center',
                      padding: '10px 6px',
                      borderRadius: 6,
                      minWidth: 48,
                    }}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#94a3b8', fontSize: 12 }}>
        <span>cool</span>
        <div style={{ flex: '0 1 240px', height: 8, background: 'linear-gradient(90deg, rgb(30,58,138), rgb(245,158,11))', borderRadius: 4 }} />
        <span>hot</span>
        <span style={{ marginLeft: 'auto' }}>Total interactions: <strong style={{ color: '#e2e8f0' }}>{data.total}</strong></span>
      </div>
    </div>
  );
}

export default JourneyHeatmap;
