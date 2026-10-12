import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FeaturePage from './pages/FeaturePage';
import NonAIFeaturePage from './pages/NonAIFeaturePage';
import { callQualityAPI, customerProfilesAPI } from './services/api';

jest.mock('./services/api', () => ({
  callQualityAPI: { getAll: jest.fn() },
  customerProfilesAPI: { getAll: jest.fn() },
}));
global.IS_REACT_ACT_ENVIRONMENT = true;

const customers = ['James Wilson', 'Maria Garcia', 'Robert Smith', 'Jennifer Lee', 'David Brown', 'Lisa Anderson', 'Michael Taylor', 'Sarah Martinez', 'Christopher Davis', 'Amanda White', 'Daniel Harris', 'Michelle Clark', 'Kevin Lewis', 'Stephanie Robinson', 'Brian Walker'];
const rows = customers.map((customer_name, index) => ({ id: index + 1, customer_name, phone_number: `+1-555-${String(index + 101).padStart(4, '0')}`, network_type: '5G', signal_strength: -70, jitter_ms: 12, packet_loss_pct: 0.3, quality_score: 8 }));
let host, root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.clearAllMocks(); });

test('paginated telecom API data displays all 15 call-quality records', async () => {
  callQualityAPI.getAll.mockResolvedValue({ data: { data: rows, pagination: { total: 15, page: 1 } } });
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => root.render(<FeaturePage feature="call-quality" />));
  expect(host.querySelectorAll('.data-table tbody tr')).toHaveLength(15);
  expect(host.textContent).toContain('Brian Walker');
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

test('flat telecom API data displays all 15 customer profiles', async () => {
  customerProfilesAPI.getAll.mockResolvedValue({ data: rows });
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => root.render(<NonAIFeaturePage feature="customer-profiles" />));
  expect(host.querySelectorAll('.data-table tbody tr')).toHaveLength(15);
  expect(host.textContent).toContain('Brian Walker');
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

test('unexpected non-array payload remains a safe empty state', async () => {
  callQualityAPI.getAll.mockResolvedValue({ data: { data: { error: 'unexpected' } } });
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => root.render(<FeaturePage feature="call-quality" />));
  expect(host.textContent).toContain('No records found');
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});
