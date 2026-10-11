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
			{ name: 'Catalog Overview', value: 'getOverview', description: 'Free. Shows what the catalog covers, with counts per category, platform and job. Optionally pass a topic such as email.', action: 'Get the catalog overview' },
			{ name: 'Compare Catalog Items', value: 'compareItems', description: 'Free. Compares 2 to 20 public catalog items side by side. Pass their IDs, separated by commas.', action: 'Compare catalog items' },
			{ name: 'Get a Catalog Item', value: 'getItem', description: 'Free. Reads one public catalog item. Pass its ID from Search the Public Catalog.', action: 'Get a catalog item' },
			{ name: 'Search the Public Catalog', value: 'searchItems', description: 'Free, works without an account. Searches public catalog items. Pass words such as email.', action: 'Search the public catalog' },
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
			{ displayName: 'Category ID', name: 'category', type: 'string', default: '', placeholder: 'enrichment', description: 'Show only this category. Take the ID from an overview answer.' },
			{
				displayName: 'Detail Level',
				name: 'depth',
				type: 'options',
				options: [
					{ name: 'Full', value: 'full' },
					{ name: 'Jobs', value: 'jobs' },
					{ name: 'Platforms', value: 'platforms' },
					{ name: 'Summary', value: 'summary' },
				],
				default: 'summary',
				description: 'How much to return. Ignored when a topic is set.',
			},
			{ displayName: 'Platform ID', name: 'platform', type: 'string', default: '', placeholder: 'people', description: 'Show only this platform. Take the ID from an overview answer.' },
			{ displayName: 'Topic', name: 'topic', type: 'string', default: '', placeholder: 'email', description: 'Words such as email or phone. Returns the jobs that match.' },
		],
	},
	{
		displayName: 'Catalog Item IDs',
		name: 'catalogItemIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'hunter-email-verify, tomba-email-finder',
		description: 'Two to twenty catalog item IDs, separated by commas, all different. Take them from Search the Public Catalog, field catalogItemId.',
		displayOptions: showFor(R, ['compareItems']),
	},
	{
		displayName: 'Catalog Item ID',
		name: 'catalogItemId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'hunter-email-verify',
		description: 'The item to read. Take it from Search the Public Catalog, field catalogItemId.',
		displayOptions: showFor(R, ['getItem']),
	},
	{
		displayName: 'Search Text',
		name: 'text',
		type: 'string',
		default: '',
		placeholder: 'verify an email address',
		description: 'What you want to do, in plain words. Leave empty to filter only.',
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
			{ displayName: 'Category ID', name: 'category', type: 'string', default: '', placeholder: 'enrichment', description: 'Keep only items in this category' },
			{ displayName: 'Job ID', name: 'capability', type: 'string', default: '', placeholder: 'people.email.find', description: 'Keep only items that do this job. Take the ID from the catalog overview.' },
			{ displayName: 'Operation ID', name: 'operationId', type: 'string', default: '', placeholder: 'tomba-email-finder', description: 'Keep only the item for this operation' },
			{ displayName: 'Provider ID', name: 'provider', type: 'string', default: '', placeholder: 'hunter', description: 'Keep only items from this provider' },
			{
				displayName: 'Show Missing Jobs',
				name: 'signals',
				type: 'boolean',
				default: false,
				description: 'Whether to also return warnings and the jobs no public endpoint covers yet when your search finds nothing',
			},
		],
	},
];
