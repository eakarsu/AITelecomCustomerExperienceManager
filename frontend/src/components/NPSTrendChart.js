import React, { useEffect, useState } from 'react';
import axios from 'axios';

const colors = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6'];

function NPSTrendChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:3014/api/custom-views/nps-trend?weeks=12', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, []);

  if (error) return <div style={{ color: '#f87171' }}>NPS trend error: {error}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading NPS trend…</div>;

  const W = 720;
  const H = 260;
  const padL = 40;
  const padB = 28;
  const padT = 14;
  const padR = 12;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxV = 80;
  const minV = 0;
  const xStep = innerW / Math.max(1, data.labels.length - 1);

  const yFor = (v) => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const xFor = (i) => padL + i * xStep;

  const pathFor = (vals) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ');

  const overallPath = pathFor(data.overall);

  return (
    <div data-testid="nps-trend-chart" style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>NPS Trend ({data.weeks} weeks)</h3>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          Latest: <strong style={{ color: '#e2e8f0' }}>{data.summary.latest}</strong>
          {'  '}Δ <span style={{ color: data.summary.delta >= 0 ? '#34d399' : '#f87171' }}>
            {data.summary.delta >= 0 ? '+' : ''}{data.summary.delta}
          </span>
          {'  '}Avg: <strong style={{ color: '#e2e8f0' }}>{data.summary.average}</strong>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid */}
        {[0, 20, 40, 60, 80].map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - padR} y1={yFor(g)} y2={yFor(g)} stroke="#1e293b" strokeDasharray="2 4" />
            <text x={padL - 6} y={yFor(g) + 4} fill="#64748b" fontSize="10" textAnchor="end">{g}</text>
          </g>
        ))}
        {/* X labels */}
        {data.labels.map((l, i) => (
          <text key={l} x={xFor(i)} y={H - 8} fill="#64748b" fontSize="10" textAnchor="middle">{l}</text>
        ))}
        {/* Segment series */}
        {data.series.map((s, idx) => (
          <g key={s.segment}>
            <path d={pathFor(s.values)} stroke={colors[idx % colors.length]} strokeWidth="1.5" fill="none" opacity="0.85" />
          </g>
        ))}
        {/* Overall path */}
        <path d={overallPath} stroke="#e2e8f0" strokeWidth="2.5" fill="none" />
        {data.overall.map((v, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(v)} r="3" fill="#e2e8f0" />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: '#e2e8f0' }}>
          <span style={{ display: 'inline-block', width: 12, height: 3, background: '#e2e8f0', marginRight: 4 }} />Overall
        </div>
        {data.series.map((s, idx) => (
          <div key={s.segment} style={{ fontSize: 12, color: '#cbd5e1' }}>
            <span style={{ display: 'inline-block', width: 12, height: 3, background: colors[idx % colors.length], marginRight: 4 }} />
            {s.segment}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NPSTrendChart;
