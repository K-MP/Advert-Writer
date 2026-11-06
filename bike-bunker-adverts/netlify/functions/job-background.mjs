// Background job runner (can run for up to 15 minutes, so slow AI work never times out).
// The page POSTs { jobId, type, payload }; the result is saved to Netlify Blobs
// and the page collects it from job-result.
//   type "adverts" -> AutoTrader + website adverts + social posts
//   type "price"   -> market price check using Claude's web search

import { getStore } from '@netlify/blobs';
import { callClaude, extractJSON } from '../lib/claude.mjs';
import { advertPrompt, pricePrompt } from '../lib/prompts.mjs';

export default async (req) => {
  let input;
  try { input = await req.json(); } catch { return; }
  const { jobId, type, payload = {} } = input || {};
  if (!jobId || !/^[\w-]{8,64}$/.test(jobId)) return;

  const store = getStore({ name: 'jobs', consistency: 'strong' });
  const finish = (data) => store.setJSON(jobId, { ...data, finishedAt: Date.now() });

  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers.get('x-app-password') !== pw) return finish({ status: 'error', error: 'Wrong or missing app password' });
  if (!process.env.ANTHROPIC_API_KEY) return finish({ status: 'error', error: 'ANTHROPIC_API_KEY is not set in Netlify environment variables' });

  await store.setJSON(jobId, { status: 'running', startedAt: Date.now() });

  try {
    if (type === 'adverts') {
      const text = await callClaude(advertPrompt(payload), { maxTokens: 3000 });
      const ad = extractJSON(text);
      if (ad.attention_grabber && ad.attention_grabber.length > 30) {
        ad.attention_grabber_warning = `${ad.attention_grabber.length} characters - AutoTrader allows 30`;
      }
      return finish({ status: 'done', result: ad });
    }
    if (type === 'price') {
      const text = await callClaude(pricePrompt(payload), { maxTokens: 4000, webSearch: true, maxSearches: 6 });
      const price = extractJSON(text);
      price.checkedAt = new Date().toISOString();
      return finish({ status: 'done', result: price });
    }
    return finish({ status: 'error', error: `Unknown job type: ${type}` });
  } catch (err) {
    return finish({ status: 'error', error: String(err.message || err) });
  }
};
