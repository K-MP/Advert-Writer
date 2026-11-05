// Writes the AutoTrader and website adverts with Claude.
// Env vars:
//   ANTHROPIC_API_KEY - your Claude API key (kept server-side, never sent to the browser)
//   APP_PASSWORD      - optional; must match the x-app-password header
//   CLAUDE_MODEL      - optional; defaults to claude-sonnet-5-5

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

const line = (label, value) => (value !== undefined && value !== null && String(value).trim() !== '' ? `- ${label}: ${String(value).trim()}` : null);

function buildPrompt({ bike = {}, details = {}, settings = {}, tweak = '' }) {
  const facts = [
    line('Registration', bike.reg),
    line('Make', bike.make),
    line('Model', bike.model),
    line('Derivative / trim', bike.derivative),
    line('Year', bike.year),
    line('Mileage', bike.mileage && `${bike.mileage} miles`),
    line('Previous owners', bike.owners),
    line('Colour', bike.colour),
    line('Engine size', bike.engine && `${bike.engine}cc`),
    line('Price (for context only)', bike.price && `£${bike.price}`),
    line('Service history', details.serviceHistory),
    line('Serviced by The Bike Bunker before sale', details.servicedByUs),
    line('MOT', details.mot),
    line('Keys', details.keys),
    line('Overall condition', details.condition),
    line('Tyres', details.tyres),
    line('Paperwork (V5C, manual, receipts)', details.paperwork),
    line('HPI / history check', details.hpi),
    line('Warranty included', details.warranty),
    line('Licence category', details.licence),
    line('Best suited to', details.idealFor),
    line('Modifications & upgrades', details.mods),
    line('Key features & extras', details.features),
    line('Marks, wear or known issues (be honest about these)', details.marks),
    line('Extra notes / story', details.notes),
  ].filter(Boolean).join('\n');

  const dealer = [
    line('Dealer name', settings.dealerName || 'The Bike Bunker'),
    line('Location', settings.location || 'Hayling Island, Hampshire'),
    line('Phone', settings.phone),
    line('Website', settings.website || 'bike-bunker.co.uk'),
    line('Standard selling points we offer', settings.usps),
  ].filter(Boolean).join('\n');

  const tone = {
    enthusiastic: 'Enthusiastic and warm, like a rider talking to a rider, but never cheesy or full of exclamation marks.',
    professional: 'Professional, confident and factual. Calm, trustworthy dealer voice.',
    punchy: 'Short and punchy. Tight sentences, scannable, no filler.',
  }[details.tone] || 'Enthusiastic and warm, like a rider talking to a rider, but never cheesy.';

  return `You write used-motorcycle adverts for a UK dealer. Write in British English.

BIKE FACTS
${facts}

DEALER
${dealer}

TONE: ${tone}

RULES
- Use ONLY the facts above. Never invent service dates, features, specs, owners, warranty terms or history. If something isn't given, leave it out.
- You may add a sentence of well-known, uncontroversial character about the model (e.g. what kind of riding it suits), but no specific performance figures unless given.
- Lead with what makes THIS bike worth buying: the strongest facts (low owners, full history, mods, condition, keys) go early.
- Mention modifications clearly, and say any original parts come with it only if stated.
- If marks or issues are listed, mention them briefly and honestly - it builds trust.
- No emojis. No ALL CAPS sentences. No clichés like "don't miss out" or "won't last long".

OUTPUT 1 - AutoTrader attention grabber: max 30 characters including spaces. The single strongest selling point (e.g. "1 owner, full history, 2 keys").

OUTPUT 2 - AutoTrader description: 110-180 words. Plain text only (no markdown, no asterisks). Short opening paragraph, then a few key points each on its own line starting with "- ", then one closing line. Do NOT include price, phone numbers, email, website links or opening hours - AutoTrader shows those elsewhere and links aren't clickable.

OUTPUT 3 - Website advert title: a clean listing title like "2019 Yamaha MT-07 - 1 Owner, Full Service History".

OUTPUT 4 - Website advert: 180-280 words. Plain text, no markdown symbols. Opening paragraph, a "Highlights" line followed by points each starting with "- ", a short paragraph on condition, then a short "Why buy from ${settings.dealerName || 'The Bike Bunker'}" paragraph using only the dealer selling points given, ending with a clear call to action${settings.phone ? ' including the phone number' : ''}.
${tweak ? `\nEXTRA INSTRUCTIONS FROM THE DEALER (follow these): ${tweak}\n` : ''}
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"attention_grabber": "...", "autotrader_description": "...", "website_title": "...", "website_description": "..."}
Use \\n for line breaks inside the strings.`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  const pw = process.env.APP_PASSWORD;
  if (pw && event.headers['x-app-password'] !== pw) return json(401, { error: 'Wrong or missing app password' });
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: 'ANTHROPIC_API_KEY is not set in Netlify environment variables' });

  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad request body' }); }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return json(502, { error: `Claude API error ${res.status}`, details: data.error || data });

    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json(502, { error: 'Could not read the advert from Claude', raw: text });
    const ad = JSON.parse(match[0]);
    if (ad.attention_grabber && ad.attention_grabber.length > 30) {
      ad.attention_grabber_warning = `${ad.attention_grabber.length} characters - AutoTrader allows 30`;
    }
    return json(200, ad);
  } catch (err) {
    return json(500, { error: 'Advert generation failed', details: String(err) });
  }
};

exports.buildPrompt = buildPrompt; // for local testing
