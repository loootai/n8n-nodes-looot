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
	displayOptions: showFor(resource, operations),
});

export const cursorField = (resource: string, operations: string[]): INodeProperties => ({
	displayName: 'Cursor',
	name: 'cursor',
	type: 'string',
	default: '',
	description: 'The next-page cursor from the previous answer. Leave empty for the first page.',
	displayOptions: showFor(resource, operations),
});
