import React from 'react';

function parseAIContent(text) {
  if (!text) return [];

  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match patterns like "SECTION TITLE:" or "**SECTION TITLE:**"
    const sectionMatch = trimmed.match(/^\*?\*?([A-Z][A-Z\s/()]+[A-Z)])\*?\*?:\s*(.*)/);
    if (sectionMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: sectionMatch[1].trim(),
        content: sectionMatch[2] ? [sectionMatch[2]] : []
      };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else {
      // First content before any section header
      if (!sections.length && !currentSection) {
        currentSection = { title: 'OVERVIEW', content: [trimmed] };
      }
    }
  }
  if (currentSection) sections.push(currentSection);

  // If no sections found, return the whole text as one section
  if (sections.length === 0) {
    return [{ title: 'ANALYSIS', content: [text] }];
  }

  return sections;
}

function getValueColor(title, value) {
  const text = value.toLowerCase();
  if (title.includes('RISK') || title.includes('SEVERITY') || title.includes('PRIORITY')) {
    if (text.includes('critical') || text.includes('p1') || text.includes('high')) return '#f87171';
    if (text.includes('medium') || text.includes('p2')) return '#fbbf24';
    return '#4ade80';
  }
  if (title.includes('SCORE') || title.includes('PROBABILITY') || title.includes('NPS')) {
    return '#60a5fa';
  }
  if (title.includes('CATEGORY')) {
    if (text.includes('promoter')) return '#4ade80';
    if (text.includes('passive')) return '#fbbf24';
    if (text.includes('detractor')) return '#f87171';
  }
  return null;
}

function AIAnalysis({ result, loading }) {
  if (loading) {
    return (
      <div className="ai-analysis-container">
        <div className="ai-analysis-header">
          <h3>AI Analysis</h3>
          <span className="ai-badge">Processing</span>
        </div>
        <div className="ai-analysis-content">
          <div className="ai-loading">
            <div className="ai-spinner"></div>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>Analyzing with AI model...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const sections = parseAIContent(result.analysis);

  return (
    <div className="ai-analysis-container">
      <div className="ai-analysis-header">
        <h3>AI Analysis</h3>
        <span className="ai-badge">AI Powered</span>
      </div>
      <div className="ai-analysis-content">
        {sections.map((section, i) => {
          const firstLine = section.content[0] || '';
          const valueColor = getValueColor(section.title, firstLine);

          return (
            <div key={i} className="ai-section">
              <div className="ai-section-title">{section.title}</div>
              <div className="ai-section-content">
                {section.content.map((line, j) => {
                  const isBullet = line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./);
                  return (
                    <div key={j} style={{
                      marginBottom: 4,
                      paddingLeft: isBullet ? 12 : 0,
                      color: j === 0 && valueColor ? valueColor : undefined,
                      fontWeight: j === 0 && valueColor ? 700 : undefined,
                      fontSize: j === 0 && valueColor ? 16 : undefined,
                    }}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {result.model && (
          <div className="ai-model-info">
            <span>Model: {result.model}</span>
            {result.usage && (
              <span>Tokens: {result.usage.prompt_tokens + result.usage.completion_tokens}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAnalysis;
