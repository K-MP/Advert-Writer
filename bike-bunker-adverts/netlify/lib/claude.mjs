// Calls the Claude API. Handles web-search "pause_turn" continuations and pulls the JSON out of the reply.

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

export async function callClaude(prompt, { maxTokens = 3000, webSearch = false, maxSearches = 6 } = {}) {
  const messages = [{ role: 'user', content: prompt }];
  const tools = webSearch
    ? [{
        type: process.env.WEB_SEARCH_TOOL || 'web_search_20250305',
        name: 'web_search',
        max_uses: maxSearches,
        user_location: { type: 'approximate', country: 'GB', region: 'England', city: 'Portsmouth', timezone: 'Europe/London' },
      }]
    : undefined;

  let text = '';
  for (let turn = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages, ...(tools ? { tools } : {}) }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 300);
      throw new Error(`Claude API error ${res.status}: ${msg}`);
    }
    text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    if (data.stop_reason !== 'pause_turn') break;
    // Long web searches can pause; send the partial turn back so Claude carries on.
    messages.push({ role: 'assistant', content: data.content });
  }
  return text;
}

export function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Claude did not return the expected format');
  return JSON.parse(text.slice(start, end + 1));
}
