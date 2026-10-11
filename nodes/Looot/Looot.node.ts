import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { billingDescription } from './descriptions/BillingDescription';
import { catalogDescription } from './descriptions/CatalogDescription';
import { publicCatalogDescription } from './descriptions/PublicCatalogDescription';
import { requestDescription } from './descriptions/RequestDescription';
import { runDescription } from './descriptions/RunDescription';

interface Call {
	method: IHttpRequestMethods;
	path: string;
	qs?: IDataObject;
	body?: IDataObject;
}

type Ctx = IExecuteFunctions;
type Builder = (ctx: Ctx, i: number) => Call;

const get = <T>(ctx: Ctx, name: string, i: number, fallback?: T) =>
	ctx.getNodeParameter(name, i, fallback) as T;
const str = (ctx: Ctx, name: string, i: number) => get<string>(ctx, name, i, '');
const id = (ctx: Ctx, name: string, i: number) => encodeURIComponent(str(ctx, name, i));
const list = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean);
const defaultKey = (ctx: Ctx, i: number) => `n8n-${ctx.getExecutionId()}-${i}`;

/** Copy a collection into query parameters. Empty strings and a zero max price are left out. */
function collect(ctx: Ctx, name: string, i: number, skip: string[] = []): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(get<IDataObject>(ctx, name, i, {}))) {
		if (skip.includes(key) || value === '' || value === undefined || value === null) continue;
		if (value === 0 && /^max(Price|PriceMicros)$/.test(key)) continue;
		out[key] = value;
	}
	return out;
}

const page = (ctx: Ctx, i: number): IDataObject => {
	const qs: IDataObject = { limit: get<number>(ctx, 'limit', i) };
	const cursor = str(ctx, 'cursor', i);
	if (cursor) qs.cursor = cursor;
	return qs;
};

const parseJson = (raw: unknown): IDataObject =>
	(typeof raw === 'string' ? JSON.parse(raw) : raw) as IDataObject;

/** One row per resource.operation: the HTTP call that operation makes. */
export const OPERATIONS: Record<string, Builder> = {
	'billing.getBalance': () => ({ method: 'GET', path: '/v1/balance' }),
	'billing.listLedger': (c, i) => ({ method: 'GET', path: '/v1/ledger', qs: page(c, i) }),
	'billing.listTopUps': () => ({ method: 'GET', path: '/v1/top-ups' }),
	'billing.requestTopUp': (c, i) => ({
		method: 'POST',
		path: '/v1/top-ups',
		body: { amountMicros: get<number>(c, 'amountMicros', i), currency: str(c, 'currency', i) },
	}),

	'publicCatalog.getOverview': (c, i) => ({
		method: 'GET',
		path: '/v1/catalog/overview',
		qs: (() => {
			const qs = collect(c, 'overviewOptions', i);
			if (qs.topic) delete qs.depth; // the API refuses depth together with topic
			return qs;
		})(),
	}),
	'publicCatalog.compareItems': (c, i) => ({
		method: 'POST',
		path: '/v1/public-catalog/compare',
		body: { catalogItemIds: list(str(c, 'catalogItemIds', i)) },
	}),
	'publicCatalog.getItem': (c, i) => ({ method: 'GET', path: `/v1/public-catalog/${id(c, 'catalogItemId', i)}` }),
	'publicCatalog.searchItems': (c, i) => {
		const qs = { ...page(c, i), ...collect(c, 'filters', i, ['signals']) };
		if (get<IDataObject>(c, 'filters', i, {}).signals === true) qs.signals = '1';
		const text = str(c, 'text', i);
		if (text) qs.text = text;
		return { method: 'GET', path: '/v1/public-catalog', qs };
	},

	'catalog.discover': (c, i) => ({ method: 'GET', path: '/v1/discover', qs: collect(c, 'discoverOptions', i) }),
	'catalog.inspect': (c, i) => {
		const endpointId = str(c, 'endpointId', i);
		if (endpointId.startsWith('job:')) {
			return { method: 'GET', path: '/v1/catalog/search', qs: { capability: endpointId.slice(4), limit: 20 } };
		}
		return { method: 'GET', path: `/v1/operations/${encodeURIComponent(endpointId)}` };
	},
	'catalog.listEndpoints': (c, i) => ({
		method: 'GET',
		path: '/v1/catalog/endpoints',
		qs: { ...page(c, i), ...collect(c, 'listFilters', i) },
	}),
	'catalog.search': (c, i) => ({
		method: 'GET',
		path: '/v1/catalog/search',
		qs: { q: str(c, 'query', i), limit: get<number>(c, 'limit', i), ...collect(c, 'filters', i, ['runnableNowOnly']) },
	}),

	'request.list': () => ({ method: 'GET', path: '/v1/capability-requests' }),
	'request.create': (c, i) => {
		const extra = get<IDataObject>(c, 'additionalFields', i, {});
		const key = defaultKey(c, i);
		const body: IDataObject = {
			requestId: (extra.requestId as string) || key,
			title: str(c, 'title', i),
			description: str(c, 'description', i),
			idempotencyKey: (extra.idempotencyKey as string) || key,
		};
		if (extra.desiredInputs) body.desiredInputs = list(extra.desiredInputs as string);
		if (extra.desiredOutputs) body.desiredOutputs = list(extra.desiredOutputs as string);
		return { method: 'POST', path: '/v1/capability-requests', body };
	},

	'run.cancel': (c, i) => ({ method: 'POST', path: `/v1/runs/${id(c, 'runId', i)}/cancel` }),
	'run.create': (c, i) => {
		const maxCostUsd = get<number>(c, 'maxCostUsd', i, 0);
		const body: IDataObject = {
			endpointId: str(c, 'endpointId', i),
			input: parseJson(c.getNodeParameter('input', i)),
			idempotencyKey: str(c, 'idempotencyKey', i).trim() || defaultKey(c, i),
			wait: get<number>(c, 'wait', i),
		};
		if (get<boolean>(c, 'fallback', i)) {
			body.fallback = maxCostUsd > 0 ? { enabled: true, maxCostUsd } : true;
		}
		return { method: 'POST', path: '/v1/runs', body };
	},
	'run.get': (c, i) => ({ method: 'GET', path: `/v1/runs/${id(c, 'runId', i)}` }),
	'run.listAttempts': (c, i) => ({ method: 'GET', path: `/v1/runs/${id(c, 'runId', i)}/attempts` }),
	'run.list': (c, i) => ({ method: 'GET', path: '/v1/runs', qs: { ...page(c, i), ...collect(c, 'filters', i) } }),
};

export class Looot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'looot',
		name: 'looot',
		icon: { light: 'file:../../icons/looot.svg', dark: 'file:../../icons/looot.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Search, inspect and run 2,500+ data endpoints (emails, companies, SERP, news) with one prepaid balance',
		defaults: { name: 'looot' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'loootApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Billing', value: 'billing' },
					{ name: 'Catalog', value: 'catalog' },
					{ name: 'Public Catalog', value: 'publicCatalog', description: 'Browse without an account' },
					{ name: 'Request', value: 'request' },
					{ name: 'Run', value: 'run' },
				],
				default: 'catalog',
			},
			...billingDescription,
			...publicCatalogDescription,
			...catalogDescription,
			...requestDescription,
			...runDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('loootApi');
		const baseUrl = String(credentials.baseUrl || 'https://api.looot.ai').replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const build = OPERATIONS[`${resource}.${operation}`];
				if (!build) throw new NodeOperationError(this.getNode(), `Unknown operation ${resource}.${operation}`, { itemIndex: i });
				const call = build(this, i);

				const options: IHttpRequestOptions = {
					method: call.method,
					url: `${baseUrl}${call.path}`,
					qs: call.qs ?? {},
					json: true,
				};
				if (call.body) options.body = call.body;

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'loootApi',
					options,
				)) as IDataObject;

				if (resource === 'catalog' && operation === 'search' && Array.isArray(response.endpoints)) {
					const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
					if (filters.runnableNowOnly !== false) {
						response.endpoints = (response.endpoints as IDataObject[]).filter(
							(endpoint) => endpoint.runnableNow !== false,
						);
					}
				}
				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
