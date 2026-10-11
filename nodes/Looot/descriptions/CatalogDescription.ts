import type { INodeProperties } from 'n8n-workflow';
import { cursorField, endpointLocator, limitField, preferOptions, showFor } from './common';

const R = 'catalog';

const price = 'Prices are in micros, millionths of a dollar. 10000 micros is 1 cent, 1000000 is 1 dollar.';
const sharedFilters: INodeProperties[] = [
	{ displayName: 'Category ID', name: 'category', type: 'string', default: '', placeholder: 'enrichment', description: 'Keep only endpoints in this category' },
	{ displayName: 'Include Hidden', name: 'hidden', type: 'boolean', default: false, description: 'Whether to include endpoints that are hidden from normal lists' },
	{ displayName: 'Job ID', name: 'capability', type: 'string', default: '', placeholder: 'people.email.find', description: 'Keep only endpoints that do this job' },
	{ displayName: 'Max Price in Micros', name: 'maxPriceMicros', type: 'number', default: 0, placeholder: '50000', description: `Only endpoints that cost at most this much per call. ${price} 0 means no limit.` },
	{ displayName: 'No Provider Key Needed', name: 'keyless', type: 'boolean', default: false, description: 'Whether to keep only endpoints that work without a key from the provider' },
	{ displayName: 'Platform ID', name: 'platform', type: 'string', default: '', placeholder: 'people', description: 'Keep only endpoints on this platform' },
	{ displayName: 'Provider ID', name: 'provider', type: 'string', default: '', placeholder: 'hunter', description: 'Keep only endpoints from this provider' },
	{ displayName: 'Tested Only', name: 'verified', type: 'boolean', default: false, description: 'Whether to keep only endpoints that have a passing test run' },
];

export const catalogDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{ name: 'Discover Operations', value: 'discover', description: 'Free. Finds ranked operations for a job, with scores. Pass a plain-words query.', action: 'Discover operations' },
			{ name: 'Inspect an Operation', value: 'inspect', description: 'Free. Reads the exact inputs, output and price of one endpoint. Pass an endpoint ID, or job:people.email.find to list the endpoints behind a job.', action: 'Inspect an operation' },
			{ name: 'List Catalog Endpoints', value: 'listEndpoints', description: 'Free. Pages through all catalog endpoints with optional filters. Pass a limit.', action: 'List catalog endpoints' },
			{ name: 'Search the Catalog', value: 'search', description: 'Free. Finds endpoints by what you want to do. Pass a plain-words query such as find work email.', action: 'Search the catalog' },
		],
		default: 'search',
	},
	endpointLocator(R, ['inspect'], 'The endpoint to read. Pick it from the list, or type an endpoint ID, or a job as job:people.email.find to list the endpoints behind that job.'),
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'find the work email of a person at a company',
		description: 'What you want to do, in plain words. Each result carries an endpointId you can use in Create a Run.',
		displayOptions: showFor(R, ['search']),
	},
	limitField(R, ['search'], 200),
	limitField(R, ['listEndpoints'], 5000),
	cursorField(R, ['listEndpoints']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor(R, ['search']),
		options: [
			...sharedFilters,
			{ displayName: 'Mock Providers', name: 'mock', type: 'boolean', default: false, description: 'Whether to keep only test providers that return sample data (on) or drop them (off)' },
			{ displayName: 'Skip First Results', name: 'offset', type: 'number', typeOptions: { minValue: 0 }, default: 0, description: 'How many results to skip, as a count. Use nextOffset from the previous answer for the next page.' },
			{ displayName: 'Rank By', name: 'prefer', type: 'options', options: preferOptions, default: 'balanced', description: 'How to order providers that do the same job' },
			{
				displayName: 'Runnable Now Only',
				name: 'runnableNowOnly',
				type: 'boolean',
				default: true,
				description: 'Whether to drop endpoints marked coming soon or not available for your account',
			},
		],
	},
	{
		displayName: 'Filters',
		name: 'listFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor(R, ['listEndpoints']),
		options: [
			...sharedFilters,
			{ displayName: 'Include Counts', name: 'facets', type: 'boolean', default: false, description: 'Whether to also return counts per category, platform and provider' },
		],
	},
	{
		displayName: 'Options',
		name: 'discoverOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(R, ['discover']),
		options: [
			{ displayName: 'Category ID', name: 'category', type: 'string', default: '', placeholder: 'enrichment', description: 'Keep only this category' },
			{ displayName: 'Endpoint ID', name: 'endpointId', type: 'string', default: '', placeholder: 'tomba-email-finder', description: 'Score one specific endpoint. Take the ID from Search the Catalog.' },
			{ displayName: 'Job ID', name: 'capability', type: 'string', default: '', placeholder: 'people.email.find', description: 'Keep only this job' },
			{ displayName: 'Max Price (USD)', name: 'maxPrice', type: 'number', typeOptions: { numberPrecision: 4 }, default: 0, placeholder: '0.05', description: 'Highest price per call in US dollars. 0 means no limit.' },
			{ displayName: 'Minimum Score', name: 'minimumScore', type: 'number', default: 0, description: 'Hide results that score below this number' },
			{ displayName: 'Provider ID', name: 'provider', type: 'string', default: '', placeholder: 'hunter', description: 'Keep only this provider' },
			{ displayName: 'Query', name: 'query', type: 'string', default: '', placeholder: 'find the work email of a person at a company', description: 'What you want to do, in plain words' },
			{ displayName: 'Rank By', name: 'prefer', type: 'options', options: preferOptions, default: 'balanced', description: 'How to order providers that do the same job' },
		],
	},
];
