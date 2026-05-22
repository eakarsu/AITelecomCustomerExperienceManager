import React, { useEffect, useState } from 'react';
import axios from 'axios';

const empty = { name: '', trigger: 'nps_drop', threshold: '', route_to: 'retention_team', priority: 'medium', enabled: true, notes: '' };

function EscalationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState({ allowedTriggers: [], allowedChannels: [] });
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    setError('');
    try {
      const r = await axios.get('http://localhost:3014/api/custom-views/escalation-rules', { headers: headers() });
      setRules(r.data.rules || []);
      setMeta({ allowedTriggers: r.data.allowedTriggers || [], allowedChannels: r.data.allowedChannels || [] });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => { setDraft(empty); setEditingId(null); };

  const save = async () => {
    setStatus('');
    setError('');
    try {
      const body = {
        ...draft,
        threshold: draft.threshold === '' ? null : Number(draft.threshold),
      };
      if (editingId) {
        await axios.put(`http://localhost:3014/api/custom-views/escalation-rules/${editingId}`, body, { headers: headers() });
        setStatus('Rule updated.');
      } else {
        await axios.post('http://localhost:3014/api/custom-views/escalation-rules', body, { headers: headers() });
        setStatus('Rule created.');
      }
      reset();
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setDraft({
      name: r.name || '',
      trigger: r.trigger || 'nps_drop',
      threshold: r.threshold == null ? '' : String(r.threshold),
      route_to: r.route_to || 'retention_team',
      priority: r.priority || 'medium',
      enabled: !!r.enabled,
      notes: r.notes || '',
    });
  };

  const remove = async (id) => {
    setError('');
    try {
      await axios.delete(`http://localhost:3014/api/custom-views/escalation-rules/${id}`, { headers: headers() });
      setStatus('Rule deleted.');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const inputStyle = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', fontSize: 13 };
  const cellStyle = { padding: '6px 8px', borderBottom: '1px solid #1f2937', color: '#cbd5e1', fontSize: 13, verticalAlign: 'middle' };

  return (
    <div data-testid="escalation-rules-editor" style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 14 }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#e2e8f0' }}>Escalation Rules</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1.4fr 0.9fr 0.6fr auto', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input placeholder="Rule name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
        <select value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })} style={inputStyle}>
          {meta.allowedTriggers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Threshold" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: e.target.value })} style={inputStyle} />
        <select value={draft.route_to} onChange={(e) => setDraft({ ...draft, route_to: e.target.value })} style={inputStyle}>
          {meta.allowedChannels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} style={inputStyle}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <label style={{ color: '#cbd5e1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={!!draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
          On
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={save}
            data-testid="save-rule-btn"
            style={{ background: editingId ? '#16a34a' : '#2563eb', color: 'white', border: 0, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button onClick={reset} style={{ background: '#475569', color: 'white', border: 0, borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </div>
      <input
        placeholder="Notes (optional)"
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
      />

      {status && <div style={{ color: '#34d399', fontSize: 12, marginBottom: 6 }}>{status}</div>}
      {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 6 }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: 12 }}>
            <th style={{ padding: '6px 8px' }}>Name</th>
            <th style={{ padding: '6px 8px' }}>Trigger</th>
            <th style={{ padding: '6px 8px' }}>Threshold</th>
            <th style={{ padding: '6px 8px' }}>Route to</th>
            <th style={{ padding: '6px 8px' }}>Priority</th>
            <th style={{ padding: '6px 8px' }}>Enabled</th>
            <th style={{ padding: '6px 8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 && (
            <tr><td colSpan={7} style={{ color: '#64748b', padding: 12, textAlign: 'center' }}>No escalation rules yet.</td></tr>
          )}
          {rules.map((r) => (
            <tr key={r.id} data-testid={`rule-${r.id}`}>
              <td style={cellStyle}>{r.name}</td>
              <td style={cellStyle}><code style={{ color: '#fbbf24' }}>{r.trigger}</code></td>
              <td style={cellStyle}>{r.threshold == null ? '—' : r.threshold}</td>
              <td style={cellStyle}>{r.route_to}</td>
              <td style={cellStyle}>
                <span style={{
                  padding: '2px 8px', borderRadius: 4,
                  background: r.priority === 'critical' ? '#7f1d1d' : r.priority === 'high' ? '#92400e' : r.priority === 'medium' ? '#1e3a8a' : '#334155',
                  color: '#fde68a', fontSize: 11, textTransform: 'uppercase',
                }}>{r.priority}</span>
              </td>
              <td style={cellStyle}>{r.enabled ? 'Yes' : 'No'}</td>
              <td style={cellStyle}>
                <button onClick={() => startEdit(r)} style={{ background: '#334155', color: 'white', border: 0, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', marginRight: 4 }}>Edit</button>
                <button onClick={() => remove(r.id)} style={{ background: '#7f1d1d', color: 'white', border: 0, borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EscalationRulesEditor;
