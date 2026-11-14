// Fetches in-stock vehicles from the MotorDesk API v2 and returns a tidy list.
// Env vars (set in Netlify > Site configuration > Environment variables):
//   MOTORDESK_API_KEY  - scoped key in the form key_id.secret (needs vehicles read access)
//   APP_PASSWORD       - optional; if set, the page must send it in the x-app-password header
//   MOTORDESK_STATUS   - optional; comma-separated statuses to show, defaults to "for-sale,draft"

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
    headers: { Authorization: `Bearer ${String(process.env.MOTORDESK_API_KEY || '').trim().replace(/^["']+|["']+$/g, '').trim()}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  return { ok: res.ok && body.success !== false, status: res.status, body };
}

// Fetch every page for one status ('' = no filter). Returns null if MotorDesk rejects the status value.
async function fetchAll(status) {
  const first = await fetchPage(1, status);
  if (!first.ok) {
    if (first.status === 400 || first.status === 422) return null;
    const e = new Error(`MotorDesk returned ${first.status}`); e.details = first.body; throw e;
  }
  let items = Array.isArray(first.body.data) ? first.body.data : first.body.data?.items || [];
  const totalPages = Math.min(first.body.meta?.pagination?.total_pages || 1, 10);
  for (let p = 2; p <= totalPages; p++) {
    const next = await fetchPage(p, status);
    if (!next.ok) break;
    items = items.concat(Array.isArray(next.body.data) ? next.body.data : []);
  }
  return items;
}

exports.handler = async (event) => {
  const pw = process.env.APP_PASSWORD;
  if (pw && event.headers['x-app-password'] !== pw) return json(401, { error: 'Wrong or missing app password' });
  if (!process.env.MOTORDESK_API_KEY) return json(500, { error: 'MOTORDESK_API_KEY is not set in Netlify environment variables' });

  const debug = event.queryStringParameters && event.queryStringParameters.debug === '1';
  // Which MotorDesk statuses to show, comma-separated. Default: for sale + draft.
  const wanted = (process.env.MOTORDESK_STATUS || 'for-sale,draft').split(',').map((x) => x.trim()).filter(Boolean);

  try {
    let items = [];
    const used = [];
    for (const st of wanted) {
      const got = await fetchAll(st);
      if (got) { items = items.concat(got); used.push(st); }
    }
    // If MotorDesk didn't accept any of the status names, fetch everything and filter here
    if (!used.length) {
      const all = (await fetchAll('')) || [];
      const re = new RegExp(wanted.map((w) => w.replace(/[-_\s]/g, '[-_\\s]?')).join('|'), 'i');
      items = all.filter((v) => !v.status || re.test(String(v.status)));
      used.push('(filtered in app)');
    }
    // Remove duplicates (a bike can't be in two statuses, but just in case)
    const seen = new Set();
    items = items.filter((v) => { const k = v.id || v.registration; if (seen.has(k)) return false; seen.add(k); return true; });

    if (debug) {
      const statuses = {};
      items.forEach((v) => { statuses[v.status || '(none)'] = (statuses[v.status || '(none)'] || 0) + 1; });
      return json(200, { count: items.length, statusesFetched: used, statusCounts: statuses, sample: items.slice(0, 2) });
    }

    const bikes = items.map(normalise).filter((b) => b.reg || b.make);
    return json(200, { bikes, statusFilter: used.join(', ') });
  } catch (err) {
    return json(err.details ? 502 : 500, { error: err.details ? err.message : 'Could not reach MotorDesk', details: err.details || String(err) });
  }
};

exports.normalise = normalise; // for local testing
