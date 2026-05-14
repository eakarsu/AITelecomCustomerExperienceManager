import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ContactThreads() {
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newThreadCustomerId, setNewThreadCustomerId] = useState('');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newMsg, setNewMsg] = useState({ channel: 'email', direction: 'outbound', body: '' });

  const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/contact-threads`, auth());
      setThreads(res.data.threads || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const loadMessages = useCallback(async (id) => {
    try {
      const res = await axios.get(`${API_URL}/contact-threads/${id}/messages`, auth());
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load messages');
    }
  }, [auth]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const createThread = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/contact-threads`, {
        customer_id: parseInt(newThreadCustomerId, 10),
        subject: newThreadSubject,
      }, auth());
      setNewThreadCustomerId(''); setNewThreadSubject('');
      loadThreads();
    } catch (err) { setError(err.response?.data?.error || 'Create failed'); }
  };

  const addMessage = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await axios.post(`${API_URL}/contact-threads/${selectedId}/messages`, newMsg, auth());
      setNewMsg({ channel: 'email', direction: 'outbound', body: '' });
      loadMessages(selectedId);
    } catch (err) { setError(err.response?.data?.error || 'Add message failed'); }
  };

  return (
    <div>
      <div className="page-header"><h1>Multi-Channel Contact Threads</h1></div>
      <p style={{ marginBottom: 20, color: '#999' }}>Unified conversation history across phone, email, sms, chat, and social.</p>
      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3>Threads</h3>
          <form onSubmit={createThread} style={{ marginBottom: 12 }}>
            <input
              type="number"
              placeholder="customer id"
              value={newThreadCustomerId}
              onChange={(e) => setNewThreadCustomerId(e.target.value)}
              style={{ width: '100%', marginBottom: 6, padding: 6 }}
              required
            />
            <input
              type="text"
              placeholder="subject"
              value={newThreadSubject}
              onChange={(e) => setNewThreadSubject(e.target.value)}
              style={{ width: '100%', marginBottom: 6, padding: 6 }}
            />
            <button type="submit" className="btn">Create thread</button>
          </form>
          {loading ? 'Loading…' : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => { setSelectedId(t.id); loadMessages(t.id); }}
                    style={{ width: '100%', textAlign: 'left', padding: 8, background: selectedId === t.id ? '#222' : 'transparent', color: '#eee', border: '1px solid #333' }}
                  >
                    #{t.id} customer:{t.customer_id} — {t.subject || '(no subject)'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>Messages {selectedId ? `(thread #${selectedId})` : ''}</h3>
          {selectedId ? (
            <>
              <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12 }}>
                {messages.map((m) => (
                  <div key={m.id} style={{ padding: 6, borderBottom: '1px solid #333' }}>
                    <strong>[{m.channel}/{m.direction}]</strong> {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={addMessage}>
                <select value={newMsg.channel} onChange={(e) => setNewMsg({ ...newMsg, channel: e.target.value })}>
                  {['phone','email','sms','chat','social'].map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={newMsg.direction} onChange={(e) => setNewMsg({ ...newMsg, direction: e.target.value })}>
                  <option>inbound</option><option>outbound</option>
                </select>
                <input
                  type="text"
                  placeholder="message"
                  value={newMsg.body}
                  onChange={(e) => setNewMsg({ ...newMsg, body: e.target.value })}
                  style={{ width: '100%', padding: 6, margin: '6px 0' }}
                  required
                />
                <button type="submit" className="btn">Add message</button>
              </form>
            </>
          ) : <p style={{ color: '#999' }}>Select a thread to view messages.</p>}
        </div>
      </div>
    </div>
  );
}
