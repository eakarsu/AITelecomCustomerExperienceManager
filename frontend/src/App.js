import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import NonAIFeaturePage from './pages/NonAIFeaturePage';
import CustomerProfile360 from './pages/CustomerProfile360';
import ProactiveCare from './pages/ProactiveCare';
import NPSForecast from './pages/NPSForecast';
import ChurnPredict from './pages/ChurnPredict';
import CallQualityRCA from './pages/CallQualityRCA';
import SentimentRouting from './pages/SentimentRouting';
import CustomerHealthScore from './pages/CustomerHealthScore';
import DynamicPlanRecommendations from './pages/DynamicPlanRecommendations';
import ContactThreads from './pages/ContactThreads';
import BillingIntegrations from './pages/BillingIntegrations';
import Layout from './components/Layout';
// === Batch 08 Gaps & Frontend Mounts ===
import CfChurnEarlyWarningSystemWithRealTime from './pages/CfChurnEarlyWarningSystemWithRealTime'
import CfSentimentDrivenRoutingEscalatingNegativeCallsTo from './pages/CfSentimentDrivenRoutingEscalatingNegativeCallsTo'
import CfCallQualityRootCauseAnalysisCorrelatingWith from './pages/CfCallQualityRootCauseAnalysisCorrelatingWith'
import CfDynamicPlanRecommendationsFromUsagePatternsAccount from './pages/CfDynamicPlanRecommendationsFromUsagePatternsAccount'
import CfCompositeCustomerHealthScorePaymentSatisfactionChurn from './pages/CfCompositeCustomerHealthScorePaymentSatisfactionChurn'
import CfAutomatedOutageNotificationSystemWithSmsEmail from './pages/CfAutomatedOutageNotificationSystemWithSmsEmail'
import GapCriticalNoAiEndpointsForChurnPrediction from './pages/GapCriticalNoAiEndpointsForChurnPrediction'
import GapNoConversationalCustomerServiceCopilot from './pages/GapNoConversationalCustomerServiceCopilot'
import GapNoRetentionOfferOptimizer from './pages/GapNoRetentionOfferOptimizer'
import GapNoMultiChannelContactHistoryPhoneSms from './pages/GapNoMultiChannelContactHistoryPhoneSms'
import GapLimitedBillingSystemIntegrationsOnlyStubLayer from './pages/GapLimitedBillingSystemIntegrationsOnlyStubLayer'
import GapNoCustomerSelfServicePortal from './pages/GapNoCustomerSelfServicePortal'
import GapNoCorrelationEngineBetweenNetworkPerformanceAnd from './pages/GapNoCorrelationEngineBetweenNetworkPerformanceAnd'
import GapNoWebhooksForOutageEvents from './pages/GapNoWebhooksForOutageEvents'
import GapLimitedNotificationsOneReferenceOnlyNotA from './pages/GapLimitedNotificationsOneReferenceOnlyNotA'
import GapNoAuditLogging from './pages/GapNoAuditLogging'
import CustomViewsPage from './pages/CustomViewsPage'

// Fallback ProtectedRoute: pass-through (auth is enforced by App-level gate below).
const ProtectedRoute = ({ children }) => <>{children}</>;

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
          {/* New Feature Pages */}
          <Route path="/customer-360" element={<CustomerProfile360 />} />
          <Route path="/proactive-care" element={<ProactiveCare />} />
          <Route path="/nps-forecast" element={<NPSForecast />} />
          <Route path="/churn-predict" element={<ChurnPredict />} />
          <Route path="/call-quality-rca" element={<CallQualityRCA />} />
          <Route path="/sentiment-routing" element={<SentimentRouting />} />
          <Route path="/customer-health-score" element={<CustomerHealthScore />} />
          <Route path="/dynamic-plan-recommendations" element={<DynamicPlanRecommendations />} />
          <Route path="/contact-threads" element={<ContactThreads />} />
          <Route path="/billing-integrations" element={<BillingIntegrations />} />
          {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-churn-early-warning-system-with-real-time-scoring-and-retention" element={<ProtectedRoute><CfChurnEarlyWarningSystemWithRealTime /></ProtectedRoute>} />
      <Route path="/cf-sentiment-driven-routing-escalating-negative-calls-to-specialists" element={<ProtectedRoute><CfSentimentDrivenRoutingEscalatingNegativeCallsTo /></ProtectedRoute>} />
      <Route path="/cf-call-quality-root-cause-analysis-correlating-with-network-customer" element={<ProtectedRoute><CfCallQualityRootCauseAnalysisCorrelatingWith /></ProtectedRoute>} />
      <Route path="/cf-dynamic-plan-recommendations-from-usage-patterns-account-risk" element={<ProtectedRoute><CfDynamicPlanRecommendationsFromUsagePatternsAccount /></ProtectedRoute>} />
      <Route path="/cf-composite-customer-health-score-payment-satisfaction-churn-nps" element={<ProtectedRoute><CfCompositeCustomerHealthScorePaymentSatisfactionChurn /></ProtectedRoute>} />
      <Route path="/cf-automated-outage-notification-system-with-sms-email-blast" element={<ProtectedRoute><CfAutomatedOutageNotificationSystemWithSmsEmail /></ProtectedRoute>} />
      <Route path="/gap-critical-no-ai-endpoints-for-churn-prediction-sentiment" element={<ProtectedRoute><GapCriticalNoAiEndpointsForChurnPrediction /></ProtectedRoute>} />
      <Route path="/gap-no-conversational-customer-service-copilot" element={<ProtectedRoute><GapNoConversationalCustomerServiceCopilot /></ProtectedRoute>} />
      <Route path="/gap-no-retention-offer-optimizer" element={<ProtectedRoute><GapNoRetentionOfferOptimizer /></ProtectedRoute>} />
      <Route path="/gap-no-multi-channel-contact-history-phone-sms-email-chat" element={<ProtectedRoute><GapNoMultiChannelContactHistoryPhoneSms /></ProtectedRoute>} />
      <Route path="/gap-limited-billing-system-integrations-only-stub-layer-no" element={<ProtectedRoute><GapLimitedBillingSystemIntegrationsOnlyStubLayer /></ProtectedRoute>} />
      <Route path="/gap-no-customer-self-service-portal" element={<ProtectedRoute><GapNoCustomerSelfServicePortal /></ProtectedRoute>} />
      <Route path="/gap-no-correlation-engine-between-network-performance-and-satisfaction" element={<ProtectedRoute><GapNoCorrelationEngineBetweenNetworkPerformanceAnd /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-outage-events" element={<ProtectedRoute><GapNoWebhooksForOutageEvents /></ProtectedRoute>} />
      <Route path="/gap-limited-notifications-one-reference-only-not-a-full" element={<ProtectedRoute><GapLimitedNotificationsOneReferenceOnlyNotA /></ProtectedRoute>} />
      <Route path="/gap-no-audit-logging" element={<ProtectedRoute><GapNoAuditLogging /></ProtectedRoute>} />
      <Route path="/custom-views" element={<CustomViewsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
