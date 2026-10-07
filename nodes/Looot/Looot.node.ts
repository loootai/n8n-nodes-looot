import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

export class Looot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'looot',
		name: 'looot',
		icon: { light: 'file:../../icons/looot.svg', dark: 'file:../../icons/looot.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Search, inspect and run 2,500+ data endpoints (emails, companies, SERP, news) with one prepaid balance',
		defaults: {
			name: 'looot',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'loootApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Balance',
						value: 'balance',
						description: 'Read the available credit and the top-up link',
						action: 'Get the balance',
					},
					{
						name: 'Get Run',
						value: 'getRun',
						description: 'Read one run: status, result and cost',
						action: 'Get a run',
					},
					{
						name: 'Inspect Endpoint',
						value: 'inspect',
						description: 'Read the exact inputs, output and price of an endpoint or job (free)',
						action: 'Inspect an endpoint',
					},
					{
						name: 'Run',
						value: 'run',
						description: 'Run an endpoint or a job and spend prepaid credit',
						action: 'Run an endpoint or job',
					},
					{
						name: 'Search Catalog',
						value: 'searchCatalog',
						description: 'Find endpoints by what you want to do (free)',
						action: 'Search the catalog',
					},
				],
				default: 'searchCatalog',
			},

			// ---- Search catalog
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'find the work email of a person at a company',
				description: 'What you want to do, in plain words',
				displayOptions: { show: { operation: ['searchCatalog'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: { show: { operation: ['searchCatalog'] } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { operation: ['searchCatalog'] } },
				options: [
					{
						displayName: 'Category',
						name: 'category',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Max Price (Micros)',
						name: 'maxPriceMicros',
						type: 'number',
						default: 0,
						description: 'Only endpoints that cost at most this many millionths of a dollar',
					},
					{
						displayName: 'Prefer',
						name: 'prefer',
						type: 'options',
						options: [
							{ name: 'Balanced', value: 'balanced' },
							{ name: 'Cheapest', value: 'cheapest' },
							{ name: 'Fastest', value: 'fastest' },
							{ name: 'Reliable', value: 'reliable' },
						],
						default: 'balanced',
					},
					{
						displayName: 'Provider',
						name: 'provider',
						type: 'string',
						default: '',
					},
				],
			},

			// ---- Inspect
			{
				displayName: 'Endpoint ID',
				name: 'endpointId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'job:people.email.find',
				description: 'An endpoint from a search answer, or a job written as job:people.email.find',
				displayOptions: { show: { operation: ['inspect', 'run'] } },
			},

			// ---- Run
			{
				displayName: 'Input (JSON)',
				name: 'input',
				type: 'json',
				required: true,
				default: '{}',
				description:
					'The input object. Use the exact field names that Inspect Endpoint lists for this endpoint or job.',
				displayOptions: { show: { operation: ['run'] } },
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description: 'Same key and same input never pays twice. Leave empty to use the execution ID plus the item index.',
				displayOptions: { show: { operation: ['run'] } },
			},
			{
				displayName: 'Fallback',
				name: 'fallback',
				type: 'boolean',
				default: true,
				description: 'Whether to try the next provider of the same job when the first finds nothing. Only works with job: IDs and lookups.',
				displayOptions: { show: { operation: ['run'] } },
			},
			{
				displayName: 'Max Cost (USD)',
				name: 'maxCostUsd',
				type: 'number',
				typeOptions: { minValue: 0, numberPrecision: 4 },
				default: 0,
				description: 'Cap for the whole fallback route. 0 means no extra cap.',
				displayOptions: { show: { operation: ['run'], fallback: [true] } },
			},
			{
				displayName: 'Wait (Seconds)',
				name: 'wait',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 20,
				description: 'How long to wait for the result before returning a run ID. 0 returns at once.',
				displayOptions: { show: { operation: ['run'] } },
			},

			// ---- Get run
			{
				displayName: 'Run ID',
				name: 'runId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { operation: ['getRun'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('loootApi');
		const baseUrl = String(credentials.baseUrl || 'https://api.looot.ai').replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let method: IHttpRequestMethods = 'GET';
				let path = '';
				let qs: IDataObject = {};
				let body: IDataObject | undefined;

				if (operation === 'searchCatalog') {
					const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
					path = '/v1/catalog/search';
					qs = { q: this.getNodeParameter('query', i) as string, limit: this.getNodeParameter('limit', i) as number };
					for (const [key, value] of Object.entries(filters)) {
						if (value !== '' && value !== 0 && value !== undefined) qs[key] = value as string | number;
					}
				} else if (operation === 'inspect') {
					const endpointId = this.getNodeParameter('endpointId', i) as string;
					path = `/v1/operations/${encodeURIComponent(endpointId)}`;
				} else if (operation === 'run') {
					method = 'POST';
					path = '/v1/runs';
					const endpointId = this.getNodeParameter('endpointId', i) as string;
					const rawInput = this.getNodeParameter('input', i);
					const input = (typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput) as IDataObject;
					const givenKey = (this.getNodeParameter('idempotencyKey', i, '') as string).trim();
					const maxCostUsd = this.getNodeParameter('maxCostUsd', i, 0) as number;
					const useFallback = this.getNodeParameter('fallback', i) as boolean;
					body = {
						endpointId,
						input,
						idempotencyKey: givenKey || `n8n-${this.getExecutionId()}-${i}`,
						wait: this.getNodeParameter('wait', i) as number,
					};
					if (useFallback) {
						body.fallback = maxCostUsd > 0 ? { enabled: true, maxCostUsd } : true;
					}
				} else if (operation === 'getRun') {
					const runId = this.getNodeParameter('runId', i) as string;
					path = `/v1/runs/${encodeURIComponent(runId)}`;
				} else {
					path = '/v1/balance';
				}

				const options: IHttpRequestOptions = {
					method,
					url: `${baseUrl}${path}`,
					qs,
					json: true,
				};
				if (body) options.body = body;

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'loootApi',
					options,
				)) as IDataObject;
				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
