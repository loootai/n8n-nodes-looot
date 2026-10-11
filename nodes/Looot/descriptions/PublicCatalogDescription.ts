import type { INodeProperties } from 'n8n-workflow';
import { cursorField, limitField, showFor } from './common';

const R = 'publicCatalog';

export const publicCatalogDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{ name: 'Catalog Overview', value: 'getOverview', description: 'What the catalog covers: categories, platforms and jobs with counts', action: 'Get the catalog overview' },
			{ name: 'Compare Catalog Items', value: 'compareItems', description: 'Compare 2 to 20 public catalog items side by side', action: 'Compare catalog items' },
			{ name: 'Get a Catalog Item', value: 'getItem', description: 'Read one public catalog item', action: 'Get a catalog item' },
			{ name: 'Search the Public Catalog', value: 'searchItems', description: 'Search the public catalog by text, capability, category or provider', action: 'Search the public catalog' },
		],
		default: 'searchItems',
	},
	{
		displayName: 'Options',
		name: 'overviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(R, ['getOverview']),
		options: [
			{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'A category ID. Answers only that category.' },
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'options',
				options: [
					{ name: 'Full', value: 'full' },
					{ name: 'Jobs', value: 'jobs' },
					{ name: 'Platforms', value: 'platforms' },
					{ name: 'Summary', value: 'summary' },
				],
				default: 'summary',
			},
			{ displayName: 'Platform', name: 'platform', type: 'string', default: '', description: 'A platform ID. Answers only that platform.' },
			{ displayName: 'Topic', name: 'topic', type: 'string', default: '', description: 'Words such as email or phone. Returns the jobs that match.' },
		],
	},
	{
		displayName: 'Catalog Item IDs',
		name: 'catalogItemIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'item-one, item-two',
		description: 'Comma-separated catalog item IDs. Between 2 and 20, all different.',
		displayOptions: showFor(R, ['compareItems']),
	},
	{
		displayName: 'Catalog Item ID',
		name: 'catalogItemId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: showFor(R, ['getItem']),
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		default: '',
		description: 'Words to search for. Leave empty to filter only.',
		displayOptions: showFor(R, ['searchItems']),
	},
	limitField(R, ['searchItems'], 100),
	cursorField(R, ['searchItems']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor(R, ['searchItems']),
		options: [
			{ displayName: 'Capability', name: 'capability', type: 'string', default: '' },
			{ displayName: 'Category', name: 'category', type: 'string', default: '' },
			{ displayName: 'Operation ID', name: 'operationId', type: 'string', default: '' },
			{ displayName: 'Provider', name: 'provider', type: 'string', default: '' },
			{
				displayName: 'Return Signals',
				name: 'signals',
				type: 'boolean',
				default: false,
				description: 'Whether to also return unsupplied jobs and warnings when no public endpoint does the query job',
			},
		],
	},
];
