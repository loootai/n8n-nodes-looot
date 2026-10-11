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
	['run', 'cancel', { runId: 'run_1' }, 'POST', '/v1/runs/run_1/cancel', {}, undefined],
	['run', 'create', { endpointId: 'job:people.email.find', input: '{"domain":"a.com"}', idempotencyKey: '', fallback: true, maxCostUsd: 0.1, wait: 20 }, 'POST', '/v1/runs', {}, { endpointId: 'job:people.email.find', input: { domain: 'a.com' }, idempotencyKey: 'n8n-ex1-0', wait: 20, fallback: { enabled: true, maxCostUsd: 0.1 } }],
	['run', 'create', { endpointId: 'e.x', input: { q: 1 }, idempotencyKey: 'mine', fallback: false, maxCostUsd: 0, wait: 0 }, 'POST', '/v1/runs', {}, { endpointId: 'e.x', input: { q: 1 }, idempotencyKey: 'mine', wait: 0 }],
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
console.log(`\n${pass} passed (${cases.length} operation cases + 2 filter cases)`);

if (process.env.LIVE === '1') {
	const token = process.env.LOOOT_TOKEN;
	assert.ok(token, 'LOOOT_TOKEN missing');
	console.log('\nLive GET calls');
	for (const [resource, operation, params, method, , , , mode] of cases) {
		if (method !== 'GET' || mode === 'offline') continue;
		const p = { ...params };
		if (p.runId) p.runId = process.env.LIVE_RUN_ID || p.runId;
		if (p.catalogItemId) p.catalogItemId = process.env.LIVE_ITEM_ID || p.catalogItemId;
		if (p.endpointId && !p.endpointId.startsWith('job:')) p.endpointId = process.env.LIVE_ENDPOINT_ID || p.endpointId;
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
}
