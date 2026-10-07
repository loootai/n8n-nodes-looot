import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LoootApi implements ICredentialType {
	name = 'loootApi';

	displayName = 'Looot API';

	icon: Icon = { light: 'file:../icons/looot.svg', dark: 'file:../icons/looot.dark.svg' };

	documentationUrl = 'https://docs.looot.ai/connect/headless';

	properties: INodeProperties[] = [
		{
			displayName: 'Agent Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create one in the looot dashboard under Settings, Agent tokens. Tick catalog.read, runs.read, runs.execute and usage.read.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.looot.ai',
			description: 'Leave as is unless looot gave you a different gateway address',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/balance',
			method: 'GET',
		},
	};
}
