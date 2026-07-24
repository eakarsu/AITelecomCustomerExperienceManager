const MODEL = process.env.OPENROUTER_MODEL;

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
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
  if (!apiKey || !model || !baseUrl) throw new Error('Exact OpenRouter configuration is required');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.CLIENT_URL,
      'X-Title': 'AI Telecom CX Manager',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt || 'You are an AI analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const parsed = await response.json();
  const content = String(parsed.choices?.[0]?.message?.content || '').trim();
  if (!content) throw new Error('OpenRouter returned empty content');
  return { content, model: parsed.model || model, usage: parsed.usage };
}

// Persist AI result to database
async function saveAIResult(pool, userId, endpoint, inputData, result) {
  await pool.query(
    'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
    [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)],
  );
}

module.exports = { queryOpenRouter, parseAIJson, saveAIResult, MODEL };
