import type { INodeProperties } from 'n8n-workflow';
import { showFor } from './common';

const R = 'request';

export const requestDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{ name: 'List Capability Requests', value: 'list', description: 'List the capability requests of your workspace', action: 'List capability requests' },
			{ name: 'Request a Capability', value: 'create', description: 'Ask for a provider or job the catalog does not cover yet', action: 'Request a capability' },
		],
		default: 'list',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		description: 'Short name of what you need. Up to 200 characters.',
		displayOptions: showFor(R, ['create']),
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'What the endpoint should do. Up to 2000 characters.',
		displayOptions: showFor(R, ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(R, ['create']),
		options: [
			{ displayName: 'Desired Inputs', name: 'desiredInputs', type: 'string', default: '', description: 'Comma-separated list of fields the endpoint should take' },
			{ displayName: 'Desired Outputs', name: 'desiredOutputs', type: 'string', default: '', description: 'Comma-separated list of fields the endpoint should return' },
			{ displayName: 'Idempotency Key', name: 'idempotencyKey', type: 'string', default: '', description: 'A retry with the same key does not create a duplicate. Empty uses the execution ID plus the item index.' },
			{ displayName: 'Request ID', name: 'requestId', type: 'string', default: '', description: 'Lowercase letters, digits, dashes and underscores. Empty uses the execution ID plus the item index.' },
		],
	},
];
