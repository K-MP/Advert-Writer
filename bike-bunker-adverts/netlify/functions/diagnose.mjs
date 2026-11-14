// Connection check: shows a masked view of each key Netlify is using and tests it.
// Never returns a full key. Protected by APP_PASSWORD.

import { cleanKey } from '../lib/claude.mjs';

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const describe = (raw) => {
  if (!raw) return { set: false };
  const k = cleanKey(raw);
  return {
    set: true,
    looksLike: k.length > 16 ? `${k.slice(0, 10)}…${k.slice(-4)}` : '(too short to be a real key)',
    length: k.length,
    hadExtraSpacesOrQuotes: k !== raw,
  };
};

export default async (req) => {
  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers.get('x-app-password') !== pw) return json(401, { error: 'Wrong or missing app password' });

  const out = {
    deployContext: process.env.CONTEXT || 'unknown',
    anthropic: describe(process.env.ANTHROPIC_API_KEY),
    motordesk: describe(process.env.MOTORDESK_API_KEY),
    appPasswordSet: !!pw,
  };

  if (out.anthropic.set) {
    try {
      // Listing models is free and just proves the key works
      const r = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': cleanKey(process.env.ANTHROPIC_API_KEY), 'anthropic-version': '2023-06-01' },
      });
      const body = await r.json().catch(() => ({}));
      out.anthropic.test = r.ok ? 'OK – key accepted by Claude' : `Rejected (${r.status}): ${body?.error?.message || 'unknown error'}`;
    } catch (e) { out.anthropic.test = `Could not reach Claude: ${e.message}`; }
  }

  if (out.motordesk.set) {
    try {
      const base = process.env.MOTORDESK_BASE_URL || 'https://api.motordesk.com/2.0';
      const r = await fetch(`${base}/vehicles?per_page=1`, {
        headers: { Authorization: `Bearer ${cleanKey(process.env.MOTORDESK_API_KEY)}`, Accept: 'application/json' },
      });
      out.motordesk.test = r.ok ? 'OK – key accepted by MotorDesk' : `Rejected (${r.status})`;
    } catch (e) { out.motordesk.test = `Could not reach MotorDesk: ${e.message}`; }
  }

  return json(200, out);
};
