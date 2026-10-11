import type { INodeProperties } from 'n8n-workflow';
import { cursorField, limitField, showFor } from './common';

const R = 'catalog';

const sharedFilters: INodeProperties[] = [
	{ displayName: 'Capability', name: 'capability', type: 'string', default: '' },
	{ displayName: 'Category', name: 'category', type: 'string', default: '' },
	{ displayName: 'Hidden', name: 'hidden', type: 'boolean', default: false, description: 'Whether to include hidden endpoints' },
	{ displayName: 'Keyless', name: 'keyless', type: 'boolean', default: false, description: 'Whether to keep only endpoints that need no provider key' },
	{ displayName: 'Max Price (Micros)', name: 'maxPriceMicros', type: 'number', default: 0, description: 'Only endpoints that cost at most this many millionths of a dollar. 0 means no cap.' },
	{ displayName: 'Platform', name: 'platform', type: 'string', default: '' },
	{ displayName: 'Provider', name: 'provider', type: 'string', default: '' },
	{ displayName: 'Verified', name: 'verified', type: 'boolean', default: false, description: 'Whether to keep only endpoints that have a passing test run' },
];

export const catalogDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{ name: 'Discover Operations', value: 'discover', description: 'Find operations for a job with ranking and scores', action: 'Discover operations' },
			{ name: 'Inspect an Operation', value: 'inspect', description: 'Read the exact inputs, output and price of an endpoint, or list the endpoints behind a job (free)', action: 'Inspect an operation' },
			{ name: 'List Catalog Endpoints', value: 'listEndpoints', description: 'Page through catalog endpoints with filters', action: 'List catalog endpoints' },
			{ name: 'Search the Catalog', value: 'search', description: 'Find endpoints by what you want to do (free)', action: 'Search the catalog' },
		],
		default: 'search',
	},
	{
		displayName: 'Endpoint ID',
		name: 'endpointId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'job:people.email.find',
		description: 'An endpoint ID from a search answer. You can also write a job as job:people.email.find to list its endpoints.',
		displayOptions: showFor(R, ['inspect']),
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'find the work email of a person at a company',
		description: 'What you want to do, in plain words',
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
			{ displayName: 'Mock', name: 'mock', type: 'boolean', default: false, description: 'Whether to keep only mock providers (true) or drop them (false)' },
			{ displayName: 'Offset', name: 'offset', type: 'number', typeOptions: { minValue: 0 }, default: 0, description: 'Where the page starts in the ranked list' },
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
			{ displayName: 'Include Facets', name: 'facets', type: 'boolean', default: false, description: 'Whether to also return facet counts' },
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
			{ displayName: 'Capability', name: 'capability', type: 'string', default: '' },
			{ displayName: 'Category', name: 'category', type: 'string', default: '' },
			{ displayName: 'Endpoint ID', name: 'endpointId', type: 'string', default: '' },
			{ displayName: 'Max Price', name: 'maxPrice', type: 'number', default: 0, description: 'Highest price to accept' },
			{ displayName: 'Minimum Score', name: 'minimumScore', type: 'number', default: 0 },
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
			{ displayName: 'Provider', name: 'provider', type: 'string', default: '' },
			{ displayName: 'Query', name: 'query', type: 'string', default: '', description: 'What you want to do, in plain words' },
		],
	},
];
