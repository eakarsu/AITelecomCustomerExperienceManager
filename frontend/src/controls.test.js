import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FullAIExamples, { useFullAIExamples } from './components/FullAIExamples';
import AIReport from './components/AIReport';
import AIWorkspace from './components/AIWorkspace';
import Login from './pages/Login';
import ChurnPredict from './pages/ChurnPredict';
import CallQualityRCA from './pages/CallQualityRCA';
import axios from 'axios';
import { authAPI } from './services/api';

jest.mock('./services/api', () => ({ authAPI: { login: jest.fn(), demoLogin: jest.fn() } }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.clearAllMocks(); });

function Fixture() {
  const examples = useFullAIExamples();
  const [form, setForm] = useState({ brief: '', notes: '', customerId: '', active: false });
  const [submits, setSubmits] = useState(0);
  const bind = (key) => examples.bind({ current: form[key], change: (e, checked) => setForm(f => ({ ...f, [key]: checked === undefined ? e.target.value : checked })), label: key, sample: '' }, key, key);
  return <form data-full-ai-workspace="fixture" onSubmit={e => { e.preventDefault(); setSubmits(x => x + 1); }}>
    <FullAIExamples controller={examples} />
    <label>Brief<input data-full-ai-field={bind('brief')} value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} /></label>
    <label>Notes<input data-full-ai-field={bind('notes')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
    <label>Customer ID<input data-full-ai-field={bind('customerId')} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} /></label>
    <label>Active<input type="checkbox" data-full-ai-field={bind('active')} checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /></label>
    <output>{submits}</output>
  </form>;
}

test('all three preset buttons appear initially, fill editable fields, preserve missing record reference and do not submit', async () => {
  await act(async () => root.render(<Fixture />));
  const buttons = host.querySelectorAll('button');
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    await act(async () => button.click());
    expect(host.querySelector('input[data-full-ai-field^="brief"]').value).toBeTruthy();
    expect(host.querySelector('input[data-full-ai-field^="notes"]').value).toBeTruthy();
    expect(host.querySelector('input[data-full-ai-field^="customerId"]').value).toBe('');
    expect(host.querySelector('output').textContent).toBe('0');
    expect(host.querySelector('[role="status"]').textContent).toMatch(/actual source reference/);
  }
});

test('returned and saved structured JSON renders nested facts, rows, false, zero and empty string', async () => {
  const data = { status: false, count: 0, note: '', facts: { active: false }, rows: [{ tower: 'North', score: 0 }] };
  await act(async () => root.render(<><AIReport response={{ result_json: data }} title="Returned" /><AIReport response={{ id: 3, result_json: data, input: {} }} title="Saved" /></>));
  expect(host.querySelectorAll('.ai-report')).toHaveLength(2);
  expect(host.textContent).toContain('Status');
  expect(host.textContent).toContain('No');
  expect(host.textContent).toContain('0');
  expect(host.textContent).toContain('Empty string');
  expect(host.querySelectorAll('table')).toHaveLength(2);
  expect(host.textContent).not.toContain('"status":');
});

test('demo button signs in through demo endpoint without submitting credential form', async () => {
  authAPI.demoLogin.mockResolvedValue({ data: { token: 'fixture-token', user: { id: 1 } } });
  const onLogin = jest.fn();
  await act(async () => root.render(<Login onLogin={onLogin} />));
  await act(async () => host.querySelector('.btn-fill').click());
  expect(authAPI.demoLogin).toHaveBeenCalledTimes(1);
  expect(authAPI.login).not.toHaveBeenCalled();
  expect(onLogin).toHaveBeenCalledTimes(1);
  localStorage.clear();
});


test('workspace presets fill every field without generation and saved detail renders structured data', async () => {
  const saved = { id: 9, input: { goal: 'Review network quality' }, result_json: { alert: false, failures: 0, detail: '', sites: [{ name: 'North', score: 0 }] }, created_at: '2026-10-10T00:00:00Z', model: 'fixture' };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [saved] }) });
  const feature = { id: 'fixture', title: 'Network review', description: 'Review a network report', samples: [] };
  await act(async () => root.render(<AIWorkspace feature={feature} token="fixture-token" />));
  const presets = Array.from(host.querySelectorAll('.ai-preset-bar button'));
  expect(presets).toHaveLength(3);
  await act(async () => presets[1].click());
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(Array.from(host.querySelectorAll('.ai-form-grid input, .ai-form-grid textarea, .ai-form-grid select')).every(field => field.value !== '')).toBe(true);
  await act(async () => host.querySelector('.ai-history-row').click());
  expect(document.body.querySelector('.ai-workspace-dialog').textContent).toContain('Failures');
  expect(document.body.querySelector('.ai-workspace-dialog').textContent).toContain('Empty string');
  expect(document.body.querySelector('.ai-workspace-dialog table')).not.toBeNull();
  delete global.fetch;
});


test.each([
  ['churn', ChurnPredict, 'customer_id', 'notes'],
  ['call quality', CallQualityRCA, 'tower_id', 'notes'],
])('%s native form presets fill context and leave genuine record references explicit', async (_name, Page, reference, context) => {
  const post = jest.spyOn(axios, 'post');
  await act(async () => root.render(<Page />));
  expect(host.querySelectorAll('[aria-label="Complete AI examples"] button')).toHaveLength(3);
  await act(async () => host.querySelector('[aria-label="Complete AI examples"] button').click());
  const referenceInput = reference === 'customer_id' ? host.querySelector('input[type=number]') : host.querySelectorAll('input[type=text]')[1];
  const contextInput = host.querySelector('textarea');
  expect(referenceInput.value).toBe('');
  expect(contextInput.value).toBeTruthy();
  expect(host.querySelector('[role="status"]').textContent).toMatch(/actual source reference/);
  expect(post).not.toHaveBeenCalled();
  post.mockRestore();
});
