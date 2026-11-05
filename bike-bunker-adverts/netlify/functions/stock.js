// Fetches in-stock vehicles from the MotorDesk API v2 and returns a tidy list.
// Env vars (set in Netlify > Site configuration > Environment variables):
//   MOTORDESK_API_KEY  - scoped key in the form key_id.secret (needs vehicles read access)
//   APP_PASSWORD       - optional; if set, the page must send it in the x-app-password header
//   MOTORDESK_STATUS   - optional; status filter, defaults to "for-sale"

const BASE = process.env.MOTORDESK_BASE_URL || 'https://api.motordesk.com/2.0';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

// Read a dotted path like "data.vehicle.make"
const get = (obj, path) =>
  path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);

// First non-empty value from a list of candidate paths
const pick = (obj, paths) => {
  for (const p of paths) {
    const v = get(obj, p);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

// Fallback: search the whole object for the first key matching a pattern
const deepFind = (obj, re, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 5) return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k) && v !== null && v !== '' && typeof v !== 'object') return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = deepFind(v, re, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

const field = (v, paths, re) => {
  const val = pick(v, paths);
  return val !== undefined ? val : re ? deepFind(v, re) : undefined;
};

function normalise(v) {
  const reg = field(v, ['registration', 'data.vehicle.registration', 'data.vehicle.vrm', 'vrm'], /^(registration|vrm|reg)$/i);
  const firstReg = field(v, ['data.vehicle.first_registration_date', 'data.vehicle.registration_date', 'data.vehicle.firstRegistrationDate'], /first_?registration/i);
  let year = field(v, ['data.vehicle.year', 'data.vehicle.year_of_manufacture', 'data.vehicle.yearOfManufacture'], /^year/i);
  if (!year && firstReg) year = String(firstReg).slice(0, 4);
  const price = field(v, ['data.stock.price_website', 'data.stock.price_retail', 'data.stock.price'], /^price_?(website|retail)?$/i);
  const photo = (() => {
    const m = v.media || get(v, 'data.media');
    const list = Array.isArray(m) ? m : m && (m.images || m.photos);
    const first = Array.isArray(list) && list[0];
    return first ? first.url || first.src || first.thumbnail || first.href : undefined;
  })();

  return {
    id: v.id,
    status: v.status,
    reg: reg ? String(reg).toUpperCase().replace(/\s+/g, '') : '',
    make: field(v, ['data.vehicle.make', 'make'], /^make$/i) || '',
    model: field(v, ['data.vehicle.model', 'model'], /^model$/i) || '',
    derivative: field(v, ['data.vehicle.derivative', 'data.vehicle.trim', 'data.vehicle.variant'], /^(derivative|trim|variant)$/i) || '',
    year: year ? String(year) : '',
    mileage: field(v, ['data.vehicle.odometer_reading_miles', 'data.vehicle.mileage', 'data.history.mileage', 'data.vehicle.odometer'], /(mileage|odometer)/i) || '',
    owners: field(v, ['data.history.previous_owners', 'data.history.owners', 'data.vehicle.previous_owners'], /(previous_?owners|owners)$/i) ?? '',
    colour: field(v, ['data.vehicle.colour', 'data.vehicle.color'], /^colou?r$/i) || '',
    engine: field(v, ['data.vehicle.engine_size', 'data.vehicle.engine_capacity_cc', 'data.vehicle.badge_engine_size'], /(engine_?(size|capacity)|cc$)/i) || '',
    bodyType: field(v, ['data.vehicle.body_type', 'data.vehicle.bodyType'], /body_?type/i) || '',
    price: price ? String(price) : '',
    photo,
  };
}

async function fetchPage(page, status) {
  const params = new URLSearchParams({ page: String(page), per_page: '100' });
  if (status) params.set('status', status);
  const res = await fetch(`${BASE}/vehicles?${params}`, {
    headers: { Authorization: `Bearer ${process.env.MOTORDESK_API_KEY}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  return { ok: res.ok && body.success !== false, status: res.status, body };
}

exports.handler = async (event) => {
  const pw = process.env.APP_PASSWORD;
  if (pw && event.headers['x-app-password'] !== pw) return json(401, { error: 'Wrong or missing app password' });
  if (!process.env.MOTORDESK_API_KEY) return json(500, { error: 'MOTORDESK_API_KEY is not set in Netlify environment variables' });

  const debug = event.queryStringParameters && event.queryStringParameters.debug === '1';
  let status = process.env.MOTORDESK_STATUS ?? 'for-sale';

  try {
    let first = await fetchPage(1, status);
    // If the status filter value isn't accepted, retry without it
    if (!first.ok && first.status === 400 && status) {
      status = '';
      first = await fetchPage(1, status);
    }
    if (!first.ok) {
      return json(502, { error: `MotorDesk returned ${first.status}`, details: first.body });
    }

    let items = Array.isArray(first.body.data) ? first.body.data : first.body.data?.items || [];
    const totalPages = Math.min(first.body.meta?.pagination?.total_pages || 1, 10);
    for (let p = 2; p <= totalPages; p++) {
      const next = await fetchPage(p, status);
      if (!next.ok) break;
      items = items.concat(Array.isArray(next.body.data) ? next.body.data : []);
    }

    if (debug) return json(200, { sample: items.slice(0, 2), count: items.length, statusFilter: status || '(none)' });

    const bikes = items.map(normalise).filter((b) => b.reg || b.make);
    return json(200, { bikes, statusFilter: status || '(none)' });
  } catch (err) {
    return json(500, { error: 'Could not reach MotorDesk', details: String(err) });
  }
};

exports.normalise = normalise; // for local testing
