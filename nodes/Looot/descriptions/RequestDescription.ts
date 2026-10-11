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
			{ name: 'List Capability Requests', value: 'list', description: 'Free. Lists the requests your workspace made for missing providers or jobs. Needs no input.', action: 'List capability requests' },
			{ name: 'Request a Capability', value: 'create', description: 'Free. Asks looot to add a provider or job the catalog does not cover. Pass a title and a description.', action: 'Request a capability' },
		],
		default: 'list',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Find a founder email from a LinkedIn URL',
		description: 'A short name for what you need. Up to 200 characters.',
		displayOptions: showFor(R, ['create']),
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		placeholder: 'Given a LinkedIn profile URL, return the work email and a deliverability score.',
		description: 'What the endpoint should do, in plain words. Up to 2000 characters.',
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
			{ displayName: 'Desired Inputs', name: 'desiredInputs', type: 'string', default: '', placeholder: 'linkedin_url, domain', description: 'Names of the fields you would send, separated by commas' },
			{ displayName: 'Desired Outputs', name: 'desiredOutputs', type: 'string', default: '', placeholder: 'email, score', description: 'Names of the fields you want back, separated by commas' },
			{ displayName: 'Safe Retry Key', name: 'idempotencyKey', type: 'string', default: '', placeholder: 'my-request-2026-10-11', description: 'A retry with the same key never creates a duplicate. Leave empty to use the execution ID plus the item index.' },
			{ displayName: 'Request ID', name: 'requestId', type: 'string', default: '', placeholder: 'founder-email-request', description: 'Your own name for this request. Lowercase letters, digits, dashes and underscores, at least 3 characters. Leave empty to use the execution ID plus the item index.' },
		],
	},
];
