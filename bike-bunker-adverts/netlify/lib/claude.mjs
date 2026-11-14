// Calls the Claude API. Handles web-search "pause_turn" continuations and pulls the JSON out of the reply.

// Strip stray spaces, line breaks or quote marks pasted in with a key
export const cleanKey = (k) => String(k || '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

async function post(messages, maxTokens, tools) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': cleanKey(process.env.ANTHROPIC_API_KEY),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages, ...(tools ? { tools } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data).slice(0, 300);
    throw new Error(`Claude API error ${res.status}: ${msg}${res.status === 401 ? ' – use Settings > Check connections to see which key Netlify is using' : ''}`);
  }
  return data;
}

// One Claude "turn", following web-search pauses. Returns { text, stopReason, content, messages }.
export async function callClaude(prompt, { maxTokens = 8000, webSearch = false, maxSearches = 6, history } = {}) {
  const messages = history ? [...history] : [{ role: 'user', content: prompt }];
  const tools = webSearch
    ? [{
        type: process.env.WEB_SEARCH_TOOL || 'web_search_20250305',
        name: 'web_search',
        max_uses: maxSearches,
        user_location: { type: 'approximate', country: 'GB', region: 'England', city: 'Portsmouth', timezone: 'Europe/London' },
      }]
    : undefined;

  let data;
  for (let turn = 0; turn < 5; turn++) {
    data = await post(messages, maxTokens, tools);
    if (data.stop_reason !== 'pause_turn') break;
    // Long web searches can pause; send the partial turn back so Claude carries on.
    messages.push({ role: 'assistant', content: data.content });
  }
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  return { text, stopReason: data.stop_reason, content: data.content, messages };
}

// Ask Claude for a JSON object. If the reply can't be read, ask once more for just the JSON.
export async function askForJSON(prompt, opts = {}) {
  const first = await callClaude(prompt, opts);
  try {
    return extractJSON(first.text);
  } catch (err1) {
    const history = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: first.text.trim() ? first.text : '(no text)' },
      { role: 'user', content: 'Your reply could not be read as JSON' + (first.stopReason === 'max_tokens' ? ' (it was cut off)' : '') + '. Reply again with ONLY the complete JSON object in the exact shape requested - no other text, no markdown fences. Keep it concise. Use \\n for line breaks inside strings.' },
    ];
    const second = await callClaude(null, { ...opts, webSearch: false, history });
    try {
      return extractJSON(second.text);
    } catch (err2) {
      const snippet = (second.text || first.text || '').replace(/\s+/g, ' ').slice(0, 220);
      throw new Error(`Claude's reply couldn't be read (stop reason: ${second.stopReason || first.stopReason}). It started: "${snippet || '(empty reply)'}"`);
    }
  }
}

// Pull a JSON object out of Claude's text, tolerating code fences and raw line breaks inside strings.
export function extractJSON(text) {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object found');
  const raw = cleaned.slice(start, end + 1);
  try { return JSON.parse(raw); } catch {}
  // Escape real newlines/tabs that appear inside string values, then try again
  let out = '', inStr = false, esc = false;
  for (const ch of raw) {
    if (inStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { continue; }
      if (ch === '\t') { out += '\\t'; continue; }
      out += ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return JSON.parse(out);
}
