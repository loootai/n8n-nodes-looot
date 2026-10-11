import type { INodeProperties } from 'n8n-workflow';

/** Show a field only for one resource and a list of its operations. */
export const showFor = (resource: string, operations: string[]): INodeProperties['displayOptions'] => ({
	show: { resource: [resource], operation: operations },
});

export const limitField = (resource: string, operations: string[], max: number): INodeProperties => ({
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: max },
	default: 50,
	description: 'Max number of results to return',
	hint: `A count between 1 and ${max}`,
	displayOptions: showFor(resource, operations),
});

export const cursorField = (resource: string, operations: string[]): INodeProperties => ({
	displayName: 'Next Page Cursor',
	name: 'cursor',
	type: 'string',
	default: '',
	placeholder: 'Paste nextCursor from the previous answer',
	description: 'Gets the next page. Copy the nextCursor value from the previous answer. Leave empty for the first page.',
	displayOptions: showFor(resource, operations),
});

/** The endpoint picker: search the catalog, or type an ID or job:<id>. */
export const endpointLocator = (resource: string, operations: string[], description: string): INodeProperties => ({
	displayName: 'Endpoint',
	name: 'endpointId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description,
	displayOptions: showFor(resource, operations),
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Search, for example find work email',
			typeOptions: { searchListMethod: 'searchEndpoints', searchable: true },
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'tomba-email-finder or job:people.email.find',
		},
	],
});

export const PRICE_NOTE = 'Prices are in micros, which are millionths of a dollar. 10000 micros is 1 cent.';

/** The choice of search style shared by the three "prefer" fields. */
export const preferOptions = [
	{ name: 'Balanced', value: 'balanced' },
	{ name: 'Cheapest', value: 'cheapest' },
	{ name: 'Fastest', value: 'fastest' },
	{ name: 'Most Reliable', value: 'reliable' },
];
