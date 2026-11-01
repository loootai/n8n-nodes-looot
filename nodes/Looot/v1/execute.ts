import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';

/** Runs node version 1 exactly as package 0.1.x did, so saved workflows keep their behavior. */
export async function executeV1(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];
	const credentials = await this.getCredentials('loootApi');
	const baseUrl = String(credentials.baseUrl || 'https://api.looot.ai').replace(/\/+$/, '');

	for (let i = 0; i < items.length; i++) {
		try {
			const operation = this.getNodeParameter('operation', i) as string;
			let method: IHttpRequestMethods = 'GET';
			let path = '';
			let qs: IDataObject = {};
			let body: IDataObject | undefined;

			if (operation === 'searchCatalog') {
				const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
				path = '/v1/catalog/search';
				qs = {
					q: this.getNodeParameter('query', i) as string,
					limit: this.getNodeParameter('limit', i) as number,
				};
				for (const [key, value] of Object.entries(filters)) {
					if (key === 'runnableNowOnly') continue;
					if (value !== '' && value !== 0 && value !== undefined)
						qs[key] = value as string | number;
				}
			} else if (operation === 'inspect') {
				const endpointId = this.getNodeParameter('endpointId', i) as string;
				if (endpointId.startsWith('job:')) {
					// The operations route knows endpoints only. A job is a capability, so list its endpoints.
					path = '/v1/catalog/search';
					qs = { capability: endpointId.slice(4), limit: 20 };
				} else {
					path = `/v1/operations/${encodeURIComponent(endpointId)}`;
				}
			} else if (operation === 'run') {
				method = 'POST';
				path = '/v1/runs';
				const endpointId = this.getNodeParameter('endpointId', i) as string;
				const rawInput = this.getNodeParameter('input', i);
				const input = (
					typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput
				) as IDataObject;
				const givenKey = (this.getNodeParameter('idempotencyKey', i, '') as string).trim();
				const maxCostUsd = this.getNodeParameter('maxCostUsd', i, 0) as number;
				const useFallback = this.getNodeParameter('fallback', i) as boolean;
				body = {
					endpointId,
					input,
					idempotencyKey: givenKey || `n8n-${this.getExecutionId()}-${i}`,
					wait: this.getNodeParameter('wait', i) as number,
				};
				if (useFallback) {
					body.fallback = maxCostUsd > 0 ? { enabled: true, maxCostUsd } : true;
				}
			} else if (operation === 'getRun') {
				const runId = this.getNodeParameter('runId', i) as string;
				path = `/v1/runs/${encodeURIComponent(runId)}`;
			} else {
				path = '/v1/balance';
			}

			const options: IHttpRequestOptions = {
				method,
				url: `${baseUrl}${path}`,
				qs,
				json: true,
			};
			if (body) options.body = body;

			const response = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				'loootApi',
				options,
			)) as IDataObject;
			if (operation === 'searchCatalog' && Array.isArray(response.endpoints)) {
				const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
				if (filters.runnableNowOnly !== false) {
					response.endpoints = (response.endpoints as IDataObject[]).filter(
						(endpoint) => endpoint.runnableNow !== false,
					);
				}
			}
			returnData.push({ json: response, pairedItem: { item: i } });
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: (error as Error).message },
					pairedItem: { item: i },
				});
				continue;
			}
			throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
		}
	}

	return [returnData];
}
