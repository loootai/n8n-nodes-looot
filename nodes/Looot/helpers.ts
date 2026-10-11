import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type JsonObject,
} from 'n8n-workflow';

type Ctx = IExecuteFunctions;

/** Read an endpoint picker. Accepts a resource locator object or a plain string (AI tool use). */
export function endpointFrom(raw: unknown): string {
	if (raw && typeof raw === 'object') return String((raw as IDataObject).value ?? '').trim();
	return String(raw ?? '').trim();
}

const COMPLEX = new Set(['array', 'object']);

interface SchemaColumn {
	id: string;
	type?: string;
	required?: boolean;
}

/** Turn a typed-in value into what the API wants: JSON for objects, a list for arrays. */
function coerce(value: unknown, type?: string): unknown {
	if (typeof value !== 'string' || !type || !COMPLEX.has(type)) return value;
	const text = value.trim();
	if (text.startsWith('[') || text.startsWith('{')) {
		try {
			return JSON.parse(text);
		} catch {
			return value;
		}
	}
	return type === 'array' ? text.split(',').map((part) => part.trim()).filter(Boolean) : value;
}

/** Build the run input from the Input Mode choice. Throws a NodeOperationError that names the field to fix. */
export function readRunInput(ctx: Ctx, i: number): IDataObject {
	const node = ctx.getNode();
	const mode = ctx.getNodeParameter('inputMode', i, 'fields') as string;

	if (mode === 'json') {
		const raw = ctx.getNodeParameter('input', i, '');
		if (raw && typeof raw === 'object') return raw as IDataObject;
		const text = String(raw ?? '').trim();
		if (!text) return {};
		try {
			const parsed = JSON.parse(text);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as IDataObject;
		} catch (error) {
			throw new NodeOperationError(
				node,
				`The "Input (JSON)" field is not valid JSON (${(error as Error).message}). Fix it, for example {"domain": "example.com"}.`,
				{ itemIndex: i },
			);
		}
		throw new NodeOperationError(node, 'The "Input (JSON)" field must be a JSON object such as {"domain": "example.com"}.', { itemIndex: i });
	}

	const mapper = ctx.getNodeParameter('inputFields', i, {}) as IDataObject | string;
	if (typeof mapper === 'string') return readRunInputObject(ctx, mapper, i);
	const isMapper = mapper && typeof mapper === 'object' && ('mappingMode' in mapper || 'value' in mapper);
	const values = ((isMapper ? mapper.value : mapper) ?? {}) as IDataObject;
	const schema = ((isMapper ? mapper.schema : undefined) ?? []) as SchemaColumn[];
	const types = new Map(schema.map((column) => [column.id, column.type]));
	const input: IDataObject = {};
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === null || value === '') continue;
		input[key] = coerce(value, types.get(key)) as IDataObject[string];
	}
	const missing = schema.filter((column) => column.required && input[column.id] === undefined).map((column) => column.id);
	if (missing.length) {
		throw new NodeOperationError(
			node,
			`Fill in the required input field${missing.length > 1 ? 's' : ''} ${missing.map((m) => `"${m}"`).join(', ')} under "Input Fields". The endpoint cannot run without ${missing.length > 1 ? 'them' : 'it'}.`,
			{ itemIndex: i },
		);
	}
	return input;
}

function readRunInputObject(ctx: Ctx, text: string, i: number): IDataObject {
	try {
		return JSON.parse(text) as IDataObject;
	} catch (error) {
		throw new NodeOperationError(ctx.getNode(), `"Input Fields" is not valid JSON (${(error as Error).message}).`, { itemIndex: i });
	}
}

interface ApiProblem {
	status?: string;
	code?: string;
	message?: string;
	retryHint?: string;
	field?: string;
}

function asObject(value: unknown): IDataObject | undefined {
	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			return undefined;
		}
	}
	return value && typeof value === 'object' ? (value as IDataObject) : undefined;
}

/** Find the looot error body ({ error: { code, message, retryHint } }) wherever n8n or axios put it. */
export function readApiProblem(error: unknown): ApiProblem {
	const e = error as IDataObject;
	const cause = asObject(e?.cause);
	const candidates = [
		e?.error,
		(asObject(e?.context) as IDataObject | undefined)?.data,
		asObject(cause?.response)?.data,
		asObject(cause?.response)?.body,
		asObject(e?.response)?.data,
		asObject(e?.response)?.body,
		cause?.error,
		e,
	];
	const status = String(e?.httpCode ?? asObject(e?.response)?.status ?? asObject(cause?.response)?.status ?? '');
	for (const candidate of candidates) {
		const body = asObject(candidate);
		const inner = asObject(body?.error) ?? body;
		if (inner && (inner.code || inner.message)) {
			const problem: ApiProblem = { status: status || undefined };
			if (typeof inner.code === 'string') problem.code = inner.code;
			if (typeof inner.message === 'string') problem.message = inner.message;
			if (typeof inner.retryHint === 'string') problem.retryHint = inner.retryHint;
			if (typeof inner.field === 'string') problem.field = inner.field;
			return problem;
		}
	}
	return { status: status || undefined, message: (error as Error)?.message };
}

/** Wrap a failed API call in a NodeApiError whose message says what looot said and which field to check. */
export function apiError(ctx: Ctx, error: unknown, label: string, i: number): NodeApiError {
	const p = readApiProblem(error);
	const parts = [`looot ${label} failed`];
	if (p.status || p.code) parts[0] += ` (${[p.status, p.code].filter(Boolean).join(' ')})`;
	let message = parts[0];
	if (p.message) message += `: ${p.message}`;
	if (p.field) message += ` Check the "${p.field}" field.`;
	if (p.retryHint) message += ` Hint: ${p.retryHint}`;
	return new NodeApiError(ctx.getNode(), error as JsonObject, {
		message,
		description: p.message,
		httpCode: p.status,
		itemIndex: i,
	});
}
