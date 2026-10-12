import React from 'react';
import AIReport from './AIReport';

function AIAnalysis({ result, loading }) {
  return <AIReport
    response={result}
    loading={loading}
    title="AI analysis"
  />;
}

export default AIAnalysis;
