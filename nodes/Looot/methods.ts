import {
	NodeOperationError,
	type IDataObject,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type INodeListSearchResult,
	type ResourceMapperField,
	type ResourceMapperFields,
} from 'n8n-workflow';
import { endpointFrom } from './helpers';

async function call(ctx: ILoadOptionsFunctions, path: string, qs: IDataObject = {}): Promise<IDataObject> {
	const credentials = await ctx.getCredentials('loootApi');
	const baseUrl = String(credentials.baseUrl || 'https://api.looot.ai').replace(/\/+$/, '');
	const options: IHttpRequestOptions = { method: 'GET', url: `${baseUrl}${path}`, qs, json: true };
	return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'loootApi', options)) as IDataObject;
}

/** The price text for a list row, for example "$0.0089 per call". */
const priceText = (row: IDataObject): string => {
	const price = row.price as IDataObject | undefined;
	return String(price?.estimateFormula ?? (price?.perCall !== undefined ? `$${price.perCall} per call` : 'price on request'));
};

/** Endpoint picker list: GET /v1/catalog/search?q=<text>&limit=20, runnable endpoints only. */
export async function searchEndpoints(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
	const text = (filter ?? '').trim();
	const response = text
		? await call(this, '/v1/catalog/search', { q: text, limit: 20 })
		: await call(this, '/v1/catalog/endpoints', { limit: 50 });
	const rows = ((response.endpoints as IDataObject[]) ?? []).filter((row) => row.runnableNow !== false);
	return {
		results: rows.slice(0, 20).map((row) => ({
			name: `${row.name ?? row.endpointId} | ${priceText(row)}`,
			value: String(row.endpointId),
			description: [row.provider, (row.job as IDataObject | undefined)?.title].filter(Boolean).join(' | '),
		})),
	};
}

const short = (text: unknown, max = 70): string => {
	const plain = String(text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
	if (!plain) return '';
	const first = plain.split(/(?<=[.!?])\s/)[0];
	return first.length > max ? `${first.slice(0, max - 3)}...` : first;
};

function columnFor(id: string, spec: IDataObject, required: boolean): ResourceMapperField {
	let type = Array.isArray(spec.type) ? String(spec.type[0]) : (spec.type as string | undefined);
	if (!type && (spec.anyOf || spec.oneOf)) type = 'object';
	const field: ResourceMapperField = {
		id,
		displayName: short(spec.description) ? `${id} (${short(spec.description)})` : id,
		defaultMatch: false,
		canBeUsedToMatch: false,
		required,
		display: true,
	};
	if (Array.isArray(spec.enum) && spec.enum.length) {
		field.type = 'options';
		field.options = (spec.enum as Array<string | number>).map((value) => ({ name: String(value), value }));
	} else if (type === 'integer' || type === 'number') field.type = 'number';
	else if (type === 'boolean') field.type = 'boolean';
	else if (type === 'array') field.type = 'array';
	else if (type === 'object') field.type = 'object';
	else field.type = 'string';
	return field;
}

/** Input fields of the picked endpoint, from GET /v1/operations/<id> inputSchema. */
export async function getInputFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const endpointId = endpointFrom(this.getCurrentNodeParameter('endpointId'));
	if (!endpointId) {
		throw new NodeOperationError(this.getNode(), 'Pick an endpoint first. Use Search the Catalog to find one.');
	}
	if (endpointId.startsWith('job:')) {
		const jobId = endpointId.slice(4);
		const response = await call(this, '/v1/catalog/search', { capability: jobId, limit: 20 });
		const inputs = ((response.jobInputs as IDataObject | undefined)?.[jobId] ?? {}) as Record<string, IDataObject>;
		return {
			fields: Object.entries(inputs).map(([id, usage]) => ({
				id,
				displayName: `${id} (used by ${usage.endpoints} of ${usage.of} endpoints)`,
				defaultMatch: false,
				canBeUsedToMatch: false,
				required: false,
				display: true,
				type: 'string' as const,
			})),
		};
	}
	const op = await call(this, `/v1/operations/${encodeURIComponent(endpointId)}`);
	const schema = (op.inputSchema ?? {}) as IDataObject;
	const properties = (schema.properties ?? {}) as Record<string, IDataObject>;
	const required = new Set((schema.required as string[]) ?? []);
	if (!Object.keys(properties).length) {
		throw new NodeOperationError(
			this.getNode(),
			`Endpoint "${endpointId}" does not publish its input fields. Set Input Mode to JSON and pass the input object.`,
		);
	}
	return { fields: Object.entries(properties).map(([id, spec]) => columnFor(id, spec, required.has(id))) };
}
