import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/call-quality', label: 'Call Quality', icon: '📞' },
  { path: '/dropped-calls', label: 'Dropped Calls', icon: '📵' },
  { path: '/plan-recommendations', label: 'Plan Recommendations', icon: '💡' },
  { path: '/proactive-issues', label: 'Proactive Issues', icon: '🔧' },
  { path: '/nps-prediction', label: 'NPS Prediction', icon: '📈' },
  { path: '/churn-analysis', label: 'Churn Analysis', icon: '🔄' },
  { path: '/network-outages', label: 'Network Outages', icon: '🌐' },
  { path: '/customer-sentiment', label: 'Customer Sentiment', icon: '💬' },
  { path: '/billing-disputes', label: 'Billing Disputes', icon: '💳' },
  { path: '/sla-compliance', label: 'SLA Compliance', icon: '📋' },
  { path: '/tower-performance', label: 'Tower Performance', icon: '📡' },
  { divider: true, label: 'AI Insights' },
  { path: '/customer-360', label: 'Customer 360 View', icon: '🔍' },
  { path: '/proactive-care', label: 'Proactive Care', icon: '🛡️' },
  { path: '/nps-forecast', label: 'NPS Forecast', icon: '📊' },
  { path: '/churn-predict', label: 'Churn Prediction', icon: '⚠️' },
  { path: '/call-quality-rca', label: 'Call Quality RCA', icon: '🔧' },
  { path: '/sentiment-routing', label: 'Sentiment Routing', icon: '🎯' },
  { path: '/customer-health-score', label: 'Health Score', icon: '❤️' },
  { path: '/dynamic-plan-recommendations', label: 'Plan Recommender (AI)', icon: '✨' },
  { path: '/contact-threads', label: 'Contact Threads', icon: '🧵' },
  { path: '/billing-integrations', label: 'Billing Integrations', icon: '🔌' },
  { divider: true, label: 'Operations' },
  { path: '/customer-profiles', label: 'Customer Profiles', icon: '👤' },
  { path: '/support-tickets', label: 'Support Tickets', icon: '🎫' },
  { path: '/payment-history', label: 'Payment History', icon: '💰' },
  { path: '/appointments', label: 'Appointments', icon: '📅' },
  { path: '/usage-tracking', label: 'Usage Tracking', icon: '📊' },
];

function Layout({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h2>AI Telecom CX</h2>
          <span>Customer Experience Manager</span>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item, idx) => (
            item.divider ? (
              <div key={item.label} className="nav-divider">{item.label}</div>
            ) : (
              <a
                key={item.path}
                href={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={e => { e.preventDefault(); navigate(item.path); }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            )
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0] || 'A'}</div>
            <div className="user-details">
              <div className="name">{user.name || 'Admin'}</div>
              <div className="role">{user.role || 'analyst'}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
