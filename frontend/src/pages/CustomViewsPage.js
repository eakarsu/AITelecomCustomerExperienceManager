import React from 'react';
import NPSTrendChart from '../components/NPSTrendChart';
import JourneyHeatmap from '../components/JourneyHeatmap';
import MonthlyReportExport from '../components/MonthlyReportExport';
import EscalationRulesEditor from '../components/EscalationRulesEditor';

function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 18 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, color: '#e2e8f0' }}>CX Views</h1>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 14 }}>
          Custom telecom CX analytics — NPS trends, journey heatmaps, monthly reports, and escalation rules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <NPSTrendChart />
        <JourneyHeatmap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <MonthlyReportExport />
        <EscalationRulesEditor />
      </div>
    </div>
  );
}

export default CustomViewsPage;
