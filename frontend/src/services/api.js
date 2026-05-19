import axios from 'axios';

const API_BASE = 'http://localhost:3014/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

const createCRUD = (endpoint) => ({
  getAll: () => api.get(endpoint),
  getOne: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => api.post(endpoint, data),
  update: (id, data) => api.put(`${endpoint}/${id}`, data),
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

export const callQualityAPI = {
  ...createCRUD('/call-quality'),
  predict: (id) => api.post(`/call-quality/${id}/predict`),
};

export const droppedCallsAPI = {
  ...createCRUD('/dropped-calls'),
  analyze: (id) => api.post(`/dropped-calls/${id}/analyze`),
};

export const planRecommendationsAPI = {
  ...createCRUD('/plan-recommendations'),
  recommend: (id) => api.post(`/plan-recommendations/${id}/recommend`),
};

export const proactiveIssuesAPI = {
  ...createCRUD('/proactive-issues'),
  resolve: (id) => api.post(`/proactive-issues/${id}/resolve`),
};

export const npsPredictionAPI = {
  ...createCRUD('/nps-prediction'),
  predict: (id) => api.post(`/nps-prediction/${id}/predict`),
};

export const churnAnalysisAPI = {
  ...createCRUD('/churn-analysis'),
  analyze: (id) => api.post(`/churn-analysis/${id}/analyze`),
};

export const networkOutagesAPI = {
  ...createCRUD('/network-outages'),
  analyze: (id) => api.post(`/network-outages/${id}/analyze`),
};

export const customerSentimentAPI = {
  ...createCRUD('/customer-sentiment'),
  analyze: (id) => api.post(`/customer-sentiment/${id}/analyze`),
};

export const billingDisputesAPI = {
  ...createCRUD('/billing-disputes'),
  resolve: (id) => api.post(`/billing-disputes/${id}/resolve`),
};

export const slaComplianceAPI = {
  ...createCRUD('/sla-compliance'),
  analyze: (id) => api.post(`/sla-compliance/${id}/analyze`),
};

export const towerPerformanceAPI = {
  ...createCRUD('/tower-performance'),
  analyze: (id) => api.post(`/tower-performance/${id}/analyze`),
};

export const customerProfilesAPI = {
  ...createCRUD('/customer-profiles'),
};

export const supportTicketsAPI = {
  ...createCRUD('/support-tickets'),
};

export const paymentHistoryAPI = {
  ...createCRUD('/payment-history'),
};

export const appointmentsAPI = {
  ...createCRUD('/appointments'),
};

export const usageTrackingAPI = {
  ...createCRUD('/usage-tracking'),
};

// New AI feature endpoints
export const aiAPI = {
  proactiveCare: () => api.post('/ai/proactive-care'),
  outreachCampaigns: () => api.get('/ai/outreach-campaigns'),
  npsForecast: () => api.post('/ai/nps-forecast'),
  dispatchPlan: (date) => api.post('/ai/dispatch-plan', { date }),
};

// Customer 360
export const customer360API = {
  getView: (name) => api.get(`/customers/${encodeURIComponent(name)}/360-view`),
  getAll: () => api.get('/customers'),
};

export default api;
