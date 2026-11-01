import type { INodeProperties } from 'n8n-workflow';

/** The fields of node version 1 (package 0.1.x): five flat operations, no Resource field. */
export const v1Properties: INodeProperties[] = [
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
				description:
					'Read the exact inputs, output and price of an endpoint, or list the endpoints behind a job (free)',
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
			{
				displayName: 'Runnable Now Only',
				name: 'runnableNowOnly',
				type: 'boolean',
				default: true,
				description:
					'Whether to drop endpoints marked coming soon or not available for your account',
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
		description:
			'An endpoint ID from a search answer. For Inspect you can also write a job as job:people.email.find to list its endpoints. Run accepts both.',
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
		description:
			'Same key and same input never pays twice. Leave empty to use the execution ID plus the item index.',
		displayOptions: { show: { operation: ['run'] } },
	},
	{
		displayName: 'Fallback',
		name: 'fallback',
		type: 'boolean',
		default: true,
		description:
			'Whether to try the next provider of the same job when the first finds nothing. Only works with job: IDs and lookups.',
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
];
