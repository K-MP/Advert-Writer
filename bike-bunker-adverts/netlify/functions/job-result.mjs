// Returns the status/result of a background job: /.netlify/functions/job-result?id=<jobId>

import { getStore } from '@netlify/blobs';

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export default async (req) => {
  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers.get('x-app-password') !== pw) return json(401, { error: 'Wrong or missing app password' });

  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[\w-]{8,64}$/.test(id)) return json(400, { error: 'Bad job id' });

  const store = getStore({ name: 'jobs', consistency: 'strong' });
  const job = await store.get(id, { type: 'json' });
  return json(200, job || { status: 'queued' });
};
