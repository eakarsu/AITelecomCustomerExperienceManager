import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import NonAIFeaturePage from './pages/NonAIFeaturePage';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/call-quality" element={<FeaturePage feature="call-quality" />} />
          <Route path="/dropped-calls" element={<FeaturePage feature="dropped-calls" />} />
          <Route path="/plan-recommendations" element={<FeaturePage feature="plan-recommendations" />} />
          <Route path="/proactive-issues" element={<FeaturePage feature="proactive-issues" />} />
          <Route path="/nps-prediction" element={<FeaturePage feature="nps-prediction" />} />
          <Route path="/churn-analysis" element={<FeaturePage feature="churn-analysis" />} />
          <Route path="/network-outages" element={<FeaturePage feature="network-outages" />} />
          <Route path="/customer-sentiment" element={<FeaturePage feature="customer-sentiment" />} />
          <Route path="/billing-disputes" element={<FeaturePage feature="billing-disputes" />} />
          <Route path="/sla-compliance" element={<FeaturePage feature="sla-compliance" />} />
          <Route path="/tower-performance" element={<FeaturePage feature="tower-performance" />} />
          <Route path="/customer-profiles" element={<NonAIFeaturePage feature="customer-profiles" />} />
          <Route path="/support-tickets" element={<NonAIFeaturePage feature="support-tickets" />} />
          <Route path="/payment-history" element={<NonAIFeaturePage feature="payment-history" />} />
          <Route path="/appointments" element={<NonAIFeaturePage feature="appointments" />} />
          <Route path="/usage-tracking" element={<NonAIFeaturePage feature="usage-tracking" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
