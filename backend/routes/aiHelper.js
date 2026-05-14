const https = require('https');

const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

// Parse AI JSON response robustly
function parseAIJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {}
  // Strip markdown code fences
  const stripped = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {}
  // Find first {...} block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }
  return null;
}

async function queryOpenRouter(prompt, systemPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || MODEL;

  const body = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt || 'You are an AI analyst. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Telecom CX Manager',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            const content = parsed.choices?.[0]?.message?.content || 'No response generated';
            resolve({
              content,
              model: parsed.model,
              usage: parsed.usage,
            });
          }
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Persist AI result to database
async function saveAIResult(pool, userId, endpoint, inputData, result) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)],
    );
  } catch (err) {
    console.error('Error saving AI result:', err);
  }
}

module.exports = { queryOpenRouter, parseAIJson, saveAIResult, MODEL };
