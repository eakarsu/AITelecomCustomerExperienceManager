import React, { useState } from 'react';
import { aiAPI } from '../services/api';

function TrendBadge({ trend }) {
  if (!trend) return null;
  const t = trend.toLowerCase();
  if (t.includes('improv') || t.includes('up') || t.includes('posit')) {
    return <span className="badge badge-success">{trend} ↑</span>;
  }
  if (t.includes('declin') || t.includes('down') || t.includes('neg')) {
    return <span className="badge badge-danger">{trend} ↓</span>;
  }
  return <span className="badge badge-warning">{trend} →</span>;
}

function NPSForecast() {
  const [forecast, setForecast] = useState(null);
  const [dataSummary, setDataSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForecast = async () => {
    setLoading(true);
    setError('');
    setForecast(null);
    try {
      const res = await aiAPI.npsForecast();
      setForecast(res.data.forecast);
      setDataSummary(res.data.data_summary);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate NPS forecast');
    } finally {
      setLoading(false);
    }
  };

  const getNpsColor = (score) => {
    if (score == null) return '#999';
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <div className="page-header">
        <h1>NPS Forecast</h1>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleForecast} disabled={loading}>
            {loading ? 'Analyzing...' : 'Generate NPS Forecast'}
          </button>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#b0b0b0', fontSize: '0.9rem' }}>
          Analyzes the last 30 days of customer sentiment interactions and 90 days of NPS prediction data
          to forecast your NPS trend and identify at-risk customer segments.
        </p>
      </div>

      {error && <div className="toast toast-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
          <p style={{ color: '#777', marginTop: '16px' }}>AI is analyzing sentiment and NPS data...</p>
        </div>
      )}

      {dataSummary && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Sentiment Records Analyzed', value: dataSummary.sentiment_records_analyzed, color: '#06b6d4' },
            { label: 'NPS Records Analyzed', value: dataSummary.nps_records_analyzed, color: '#8b5cf6' },
            { label: 'Avg Current Sentiment', value: dataSummary.avg_current_sentiment, color: '#10b981' },
            { label: 'Avg Current NPS', value: dataSummary.avg_current_nps, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1a1a2e', border: `1px solid ${stat.color}`, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {forecast && !loading && (
        <div className="card">
          {/* NPS Score */}
          <div style={{ textAlign: 'center', padding: '24px', borderBottom: '1px solid #1e293b', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: getNpsColor(forecast.predicted_nps) }}>
              {forecast.predicted_nps != null ? forecast.predicted_nps.toFixed(1) : 'N/A'}
            </div>
            <div style={{ color: '#999', marginTop: '4px' }}>Predicted NPS (next 30 days)</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <TrendBadge trend={forecast.trend} />
              {forecast.confidence_pct && (
                <span className="badge badge-info">Confidence: {forecast.confidence_pct}%</span>
              )}
            </div>
          </div>

          {/* Forecast Narrative */}
          {forecast.forecast_narrative && (
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <h4 style={{ color: '#8b5cf6', marginBottom: '8px' }}>Forecast Summary</h4>
              <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>{forecast.forecast_narrative}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Drivers */}
            {forecast.drivers?.length > 0 && (
              <div>
                <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Key Drivers</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {forecast.drivers.map((d, i) => (
                    <li key={i} style={{ color: '#d1d5db' }}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* At-Risk Segments */}
            {forecast.at_risk_segments?.length > 0 && (
              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '12px' }}>At-Risk Segments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {forecast.at_risk_segments.map((seg, i) => (
                    <div key={i} style={{ background: '#7f1d1d22', border: '1px solid #ef444444', padding: '8px 12px', borderRadius: '6px', color: '#fca5a5', fontSize: '0.9rem' }}>
                      {seg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          {forecast.recommended_actions?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '12px' }}>Recommended Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {forecast.recommended_actions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ color: '#d1d5db' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend Chart Placeholder */}
          <div style={{ marginTop: '24px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px dashed #333', textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: '0.9rem' }}>
              NPS Trend Chart — Connect a charting library (e.g. Recharts) to visualize the trend over time
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '16px' }}>
              {[4, 5, 6, 5.5, 6.5, 7, forecast.predicted_nps || 7].map((v, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px',
                    background: i === 6 ? '#7c3aed' : '#333',
                    height: `${v * 10}px`,
                    borderRadius: '3px 3px 0 0',
                    alignSelf: 'flex-end',
                    transition: 'height 0.3s',
                  }}
                  title={`NPS: ${v}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
              {['T-6M', 'T-5M', 'T-4M', 'T-3M', 'T-2M', 'T-1M', 'Forecast'].map((l, i) => (
                <div key={i} style={{ width: '32px', fontSize: '0.6rem', color: i === 6 ? '#7c3aed' : '#555', textAlign: 'center' }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!forecast && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <p>Click "Generate NPS Forecast" to analyze customer sentiment and predict NPS trends</p>
        </div>
      )}
    </div>
  );
}

export default NPSForecast;
