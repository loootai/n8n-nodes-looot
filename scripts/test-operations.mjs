// Offline check of every operation: method, path, qs and body the node sends.
// Run after `npm run build`. With LIVE=1 and LOOOT_TOKEN set it also calls every GET once for real.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Looot } = require('../dist/nodes/Looot/Looot.node.js');

const BASE = 'https://api.looot.ai';
const cases = [
	// [resource, operation, params, method, path, qs, body]
	['billing', 'getBalance', {}, 'GET', '/v1/balance', {}, undefined],
	['billing', 'listLedger', { limit: 10, cursor: '' }, 'GET', '/v1/ledger', { limit: 10 }, undefined],
	['billing', 'listLedger', { limit: 10, cursor: 'c1' }, 'GET', '/v1/ledger', { limit: 10, cursor: 'c1' }, undefined, 'offline'],
	['billing', 'listTopUps', {}, 'GET', '/v1/top-ups', {}, undefined],
	['billing', 'requestTopUp', { amountMicros: 5000000, currency: 'USD' }, 'POST', '/v1/top-ups', {}, { amountMicros: 5000000, currency: 'USD' }],
	['publicCatalog', 'getOverview', { overviewOptions: { depth: 'jobs', topic: 'email' } }, 'GET', '/v1/catalog/overview', { topic: 'email' }, undefined],
	['publicCatalog', 'compareItems', { catalogItemIds: 'aaa-one, bbb-two' }, 'POST', '/v1/public-catalog/compare', {}, { catalogItemIds: ['aaa-one', 'bbb-two'] }],
	['publicCatalog', 'getOverview', { overviewOptions: { depth: 'jobs' } }, 'GET', '/v1/catalog/overview', { depth: 'jobs' }, undefined],
	['publicCatalog', 'getItem', { catalogItemId: 'abc-def' }, 'GET', '/v1/public-catalog/abc-def', {}, undefined],
	['publicCatalog', 'searchItems', { text: 'email', limit: 5, cursor: '', filters: { provider: 'hunter', signals: true } }, 'GET', '/v1/public-catalog', { limit: 5, provider: 'hunter', signals: '1', text: 'email' }, undefined],
	['catalog', 'discover', { discoverOptions: { query: 'find email', prefer: 'cheapest', maxPrice: 0 } }, 'GET', '/v1/discover', { query: 'find email', prefer: 'cheapest' }, undefined],
	['catalog', 'inspect', { endpointId: 'hunter.email-finder' }, 'GET', '/v1/operations/hunter.email-finder', {}, undefined],
	['catalog', 'inspect', { endpointId: 'job:people.email.find' }, 'GET', '/v1/catalog/search', { capability: 'people.email.find', limit: 20 }, undefined],
	['catalog', 'listEndpoints', { limit: 3, cursor: '', listFilters: { provider: 'hunter', verified: true, facets: false } }, 'GET', '/v1/catalog/endpoints', { limit: 3, provider: 'hunter', verified: true, facets: false }, undefined],
	['catalog', 'search', { query: 'find email', limit: 5, filters: { category: 'people', maxPriceMicros: 0, runnableNowOnly: true, prefer: 'fastest' } }, 'GET', '/v1/catalog/search', { q: 'find email', limit: 5, category: 'people', prefer: 'fastest' }, undefined],
	['request', 'list', {}, 'GET', '/v1/capability-requests', {}, undefined],
	['request', 'create', { title: 'T', description: 'D', additionalFields: { desiredInputs: 'a, b', desiredOutputs: 'c' } }, 'POST', '/v1/capability-requests', {}, { requestId: 'n8n-ex1-0', title: 'T', description: 'D', idempotencyKey: 'n8n-ex1-0', desiredInputs: ['a', 'b'], desiredOutputs: ['c'] }],
	// endpoint picker: resource locator objects and plain strings (tool use) both work
	['catalog', 'inspect', { endpointId: { __rl: true, mode: 'list', value: 'tomba-email-finder' } }, 'GET', '/v1/operations/tomba-email-finder', {}, undefined],
	['catalog', 'inspect', { endpointId: { __rl: true, mode: 'id', value: 'job:people.email.find' } }, 'GET', '/v1/catalog/search', { capability: 'people.email.find', limit: 20 }, undefined],
	// input modes
	['run', 'create', { endpointId: { __rl: true, mode: 'list', value: 'tomba-email-finder' }, inputMode: 'fields', inputFields: { mappingMode: 'defineBelow', value: { domain: 'example.com', first_name: 'Jane', last_name: '', tags: 'a, b', filter: '{"x":1}' }, schema: [{ id: 'domain', type: 'string', required: true }, { id: 'tags', type: 'array' }, { id: 'filter', type: 'object' }] }, fallback: false, wait: 20 }, 'POST', '/v1/runs', {}, { endpointId: 'tomba-email-finder', input: { domain: 'example.com', first_name: 'Jane', tags: ['a', 'b'], filter: { x: 1 } }, idempotencyKey: 'n8n-ex1-0', wait: 20 }],
	['run', 'create', { endpointId: 'tomba-email-finder', inputMode: 'json', input: '{"domain":"example.com"}', fallback: false, wait: 5 }, 'POST', '/v1/runs', {}, { endpointId: 'tomba-email-finder', input: { domain: 'example.com' }, idempotencyKey: 'n8n-ex1-0', wait: 5 }],
	['run', 'cancel', { runId: 'run_1' }, 'POST', '/v1/runs/run_1/cancel', {}, undefined],
	['run', 'create', { endpointId: 'job:people.email.find', inputMode: 'json', input: '{"domain":"a.com"}', idempotencyKey: '', fallback: true, maxCostUsd: 0.1, wait: 20 }, 'POST', '/v1/runs', {}, { endpointId: 'job:people.email.find', input: { domain: 'a.com' }, idempotencyKey: 'n8n-ex1-0', wait: 20, fallback: { enabled: true, maxCostUsd: 0.1 } }],
	['run', 'create', { endpointId: { __rl: true, mode: 'list', value: 'e.x' }, inputMode: 'json', input: { q: 1 }, idempotencyKey: 'mine', fallback: false, maxCostUsd: 0, wait: 0 }, 'POST', '/v1/runs', {}, { endpointId: 'e.x', input: { q: 1 }, idempotencyKey: 'mine', wait: 0 }],
	['run', 'get', { runId: 'run_1' }, 'GET', '/v1/runs/run_1', {}, undefined],
	['run', 'listAttempts', { runId: 'run_1' }, 'GET', '/v1/runs/run_1/attempts', {}, undefined],
	['run', 'list', { limit: 5, cursor: '', filters: { status: 'failed', includeResult: false } }, 'GET', '/v1/runs', { limit: 5, status: 'failed', includeResult: false }, undefined],
];

async function exercise(resource, operation, params, onCall) {
	const all = { resource, operation, ...params };
	const ctx = {
		getInputData: () => [{ json: {} }],
		getCredentials: async () => ({ baseUrl: BASE, accessToken: 'x' }),
		getNodeParameter: (name, _i, fallback) => (name in all ? all[name] : fallback),
		getExecutionId: () => 'ex1',
		continueOnFail: () => false,
		getNode: () => ({ name: 'looot' }),
		helpers: { httpRequestWithAuthentication: async (_c, options) => onCall(options) },
	};
	return new Looot().execute.call(ctx);
}

let pass = 0;
for (const [resource, operation, params, method, path, qs, body] of cases) {
	let seen;
	await exercise(resource, operation, params, async (o) => ((seen = o), { endpoints: [] }));
	const label = `${resource}.${operation} ${method} ${path}`;
	assert.equal(seen.method, method, `${label} method`);
	assert.equal(seen.url, BASE + path, `${label} url`);
	assert.deepEqual(seen.qs, qs, `${label} qs`);
	assert.deepEqual(seen.body, body, `${label} body`);
	console.log('ok  ', label);
	pass++;
}
// the runnableNowOnly filter
const rows = [{ runnableNow: false }, { runnableNow: true }, {}];
for (const [flag, expected] of [[true, 2], [false, 3]]) {
	const out = await exercise('catalog', 'search', { query: 'x', limit: 1, filters: { runnableNowOnly: flag } }, async () => ({ endpoints: [...rows] }));
	assert.equal(out[0][0].json.endpoints.length, expected);
	console.log('ok   runnableNowOnly', flag);
	pass++;
}

// ---- errors: the message says which field to fix and what the API said
async function failure(resource, operation, params, thrown) {
	try {
		await exercise(resource, operation, params, async () => { throw thrown; });
	} catch (error) {
		return error;
	}
	throw new Error('expected an error');
}
const run = (extra) => ({ endpointId: 'x-y-z', fallback: false, wait: 0, ...extra });
let err = await failure('run', 'create', run({ inputMode: 'json', input: '{bad' }), new Error('unused'));
assert.equal(err.name, 'NodeOperationError');
assert.match(err.message, /"Input \(JSON\)" field is not valid JSON/);
console.log('ok   invalid JSON ->', err.message.slice(0, 60)); pass++;
err = await failure('run', 'create', run({ inputMode: 'json', input: '[1]' }), new Error('unused'));
assert.match(err.message, /must be a JSON object/); console.log('ok   JSON array refused'); pass++;
err = await failure('run', 'create', run({ inputMode: 'fields', inputFields: { mappingMode: 'defineBelow', value: { first_name: 'J' }, schema: [{ id: 'domain', required: true }, { id: 'first_name' }] } }), new Error('unused'));
assert.equal(err.name, 'NodeOperationError');
assert.match(err.message, /required input field "domain" under "Input Fields"/);
console.log('ok   missing required input ->', err.message.slice(0, 70)); pass++;
err = await failure('run', 'create', run({ endpointId: { __rl: true, mode: 'list', value: '' }, inputMode: 'json', input: '{}' }), new Error('unused'));
assert.match(err.message, /Pick an endpoint/); console.log('ok   empty endpoint'); pass++;
const body = { error: { code: 'insufficient_balance', message: 'Balance is too low', retryHint: 'Top up first', field: 'amount' } };
for (const [name, thrown] of [
	['axios shape', Object.assign(new Error('Request failed'), { httpCode: '402', cause: { response: { status: 402, data: body } } })],
	['n8n context shape', Object.assign(new Error('Request failed'), { httpCode: '402', context: { data: body } })],
	['string body', Object.assign(new Error('Request failed'), { httpCode: '402', error: JSON.stringify(body) })],
]) {
	err = await failure('run', 'get', { runId: 'r1' }, thrown);
	assert.equal(err.name, 'NodeApiError', name);
	assert.match(err.message, /looot run get failed \(402 insufficient_balance\): Balance is too low/, name);
	assert.match(err.message, /Check the "amount" field\. Hint: Top up first/, name);
	console.log('ok   API error,', name); pass++;
}
// continueOnFail returns the message instead of throwing
{
	const ctx = { getInputData: () => [{ json: {} }], getCredentials: async () => ({ baseUrl: BASE }), getNodeParameter: (n, _i, f) => ({ resource: 'run', operation: 'get', runId: 'r1' })[n] ?? f, getExecutionId: () => 'ex1', continueOnFail: () => true, getNode: () => ({ name: 'looot' }), helpers: { httpRequestWithAuthentication: async () => { throw Object.assign(new Error('x'), { httpCode: '404', error: body }); } } };
	const out = await new Looot().execute.call(ctx);
	assert.match(out[0][0].json.error, /Balance is too low/); console.log('ok   continueOnFail'); pass++;
}

// ---- endpoint list and input mapper (methods)
const methods = new Looot().methods;
const loader = (responses, current = {}) => {
	const calls = [];
	return { calls, ctx: {
		getCredentials: async () => ({ baseUrl: BASE }),
		getNode: () => ({ name: 'looot' }),
		getCurrentNodeParameter: (n) => current[n],
		helpers: { httpRequestWithAuthentication: async (_c, o) => { calls.push(o); return responses(o); } },
	} };
};
{
	const rows = [
		{ endpointId: 'a-one', name: 'Acme / Find email', provider: 'Acme', price: { estimateFormula: '$0.0089 per call' }, runnableNow: true, job: { title: 'Find a work email' } },
		{ endpointId: 'b-two', name: 'Beta / Coming soon', provider: 'Beta', price: { perCall: 0.1 }, runnableNow: false },
	];
	let l = loader(() => ({ endpoints: rows }));
	let res = await methods.listSearch.searchEndpoints.call(l.ctx, 'find email');
	assert.equal(l.calls[0].url, BASE + '/v1/catalog/search');
	assert.deepEqual(l.calls[0].qs, { q: 'find email', limit: 20 });
	assert.equal(res.results.length, 1);
	assert.deepEqual(res.results[0], { name: 'Acme / Find email | $0.0089 per call', value: 'a-one', description: 'Acme | Find a work email' });
	console.log('ok   endpoint list: search call, label, runnableNow filter'); pass++;
	l = loader(() => ({ endpoints: rows }));
	await methods.listSearch.searchEndpoints.call(l.ctx, '');
	assert.equal(l.calls[0].url, BASE + '/v1/catalog/endpoints');
	console.log('ok   endpoint list: empty filter uses the endpoints listing'); pass++;

	const schema = { required: ['domain'], properties: {
		domain: { type: 'string', description: 'Company domain, for example example.com. More text here.' },
		count: { type: 'integer' }, ratio: { type: 'number' }, flag: { type: 'boolean' },
		kind: { type: 'string', enum: ['a', 'b'] }, tags: { type: 'array', items: { type: 'string' } },
		lists: { type: 'object', properties: {} }, industry: { anyOf: [{ type: 'array' }, { type: 'string' }] },
	} };
	l = loader(() => ({ inputSchema: schema }), { endpointId: { __rl: true, mode: 'list', value: 'tomba-email-finder' } });
	let fields = (await methods.resourceMapping.getInputFields.call(l.ctx)).fields;
	assert.equal(l.calls[0].url, BASE + '/v1/operations/tomba-email-finder');
	const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
	assert.deepEqual(Object.fromEntries(fields.map((f) => [f.id, f.type])), { domain: 'string', count: 'number', ratio: 'number', flag: 'boolean', kind: 'options', tags: 'array', lists: 'object', industry: 'object' });
	assert.equal(byId.domain.required, true); assert.equal(byId.count.required, false);
	assert.equal(byId.domain.displayName, 'domain (Company domain, for example example.com.)');
	assert.deepEqual(byId.kind.options.map((o) => o.value), ['a', 'b']);
	console.log('ok   mapper: types, required, enum, description'); pass++;
	l = loader(() => ({ inputSchema: schema }), { endpointId: 'plain-string-id' });
	await methods.resourceMapping.getInputFields.call(l.ctx);
	assert.equal(l.calls[0].url, BASE + '/v1/operations/plain-string-id');
	console.log('ok   mapper: plain string endpoint'); pass++;
	l = loader(() => ({ jobInputs: { 'people.email.find': { domain: { endpoints: 11, of: 23 } } } }), { endpointId: 'job:people.email.find' });
	fields = (await methods.resourceMapping.getInputFields.call(l.ctx)).fields;
	assert.deepEqual(l.calls[0].qs, { capability: 'people.email.find', limit: 20 });
	assert.equal(fields[0].displayName, 'domain (used by 11 of 23 endpoints)');
	console.log('ok   mapper: job: id'); pass++;
	l = loader(() => ({ inputSchema: {} }), { endpointId: 'no-fields' });
	await assert.rejects(methods.resourceMapping.getInputFields.call(l.ctx), /switch|Input Mode to JSON/);
	console.log('ok   mapper: no schema says to use JSON mode'); pass++;
}

console.log(`\n${pass} checks passed`);

if (process.env.LIVE === '1') {
	const token = process.env.LOOOT_TOKEN;
	assert.ok(token, 'LOOOT_TOKEN missing');
	console.log('\nLive GET calls');
	for (const [resource, operation, params, method, , , , mode] of cases) {
		if (method !== 'GET' || mode === 'offline') continue;
		const p = { ...params };
		if (p.runId) p.runId = process.env.LIVE_RUN_ID || p.runId;
		if (p.catalogItemId) p.catalogItemId = process.env.LIVE_ITEM_ID || p.catalogItemId;
		if (typeof p.endpointId === 'string' && !p.endpointId.startsWith('job:')) p.endpointId = process.env.LIVE_ENDPOINT_ID || p.endpointId;
		let status;
		await exercise(resource, operation, p, async (o) => {
			const url = new URL(o.url);
			for (const [k, v] of Object.entries(o.qs || {})) url.searchParams.set(k, String(v));
			const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
			status = res.status;
			return {};
		});
		console.log(String(status), `${resource}.${operation}`);
	}

	console.log('\nLive endpoint list and mapper');
	const live = async (path, qs) => {
		const url = new URL(BASE + path);
		for (const [k, v] of Object.entries(qs || {})) url.searchParams.set(k, String(v));
		const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
		return res.ok ? res.json() : { __status: res.status };
	};
	const liveCtx = (current) => ({ getCredentials: async () => ({ baseUrl: BASE }), getNode: () => ({ name: 'looot' }), getCurrentNodeParameter: (n) => current[n], helpers: { httpRequestWithAuthentication: async (_c, o) => live(o.url.replace(BASE, ''), o.qs) } });
	const list = await methods.listSearch.searchEndpoints.call(liveCtx({}), 'find work email');
	console.log('list rows', list.results.length, '|', list.results[0]?.name);
	for (const id of (process.env.LIVE_MAP_IDS || '').split(',').filter(Boolean)) {
		try {
			const { fields } = await methods.resourceMapping.getInputFields.call(liveCtx({ endpointId: { __rl: true, mode: 'id', value: id } }));
			console.log(id.padEnd(48), fields.length, 'fields', fields.map((f) => `${f.id}:${f.type}${f.required ? '*' : ''}`).join(' ').slice(0, 110));
		} catch (e) { console.log(id.padEnd(48), 'CANNOT MAP', e.message.slice(0, 80)); }
	}
}
