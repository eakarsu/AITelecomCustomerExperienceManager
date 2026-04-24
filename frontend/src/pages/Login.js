import React, { useState } from 'react';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = () => {
    setEmail('admin@telecom.com');
    setPassword('admin123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>AI Telecom CX</h1>
        <p>Customer Experience Management Platform</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginBottom: 12 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button type="button" className="btn btn-fill" onClick={fillCredentials} style={{ width: '100%', justifyContent: 'center' }}>
            Quick Fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
