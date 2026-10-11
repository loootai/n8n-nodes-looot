import type { INodeProperties } from 'n8n-workflow';
import { cursorField, limitField, showFor } from './common';

export const billingDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['billing'] } },
		options: [
			{ name: 'Get Balance', value: 'getBalance', description: 'Read the available credit and the top-up link', action: 'Get the balance' },
			{ name: 'List Ledger Entries', value: 'listLedger', description: 'List the workspace ledger entries', action: 'List ledger entries' },
			{ name: 'List Top-Ups', value: 'listTopUps', description: 'List prepaid top-ups', action: 'List top ups' },
			{ name: 'Request a Top-Up', value: 'requestTopUp', description: 'Request a prepaid top-up. Returns a checkout link when payments are set up.', action: 'Request a top up' },
		],
		default: 'getBalance',
	},
	limitField('billing', ['listLedger'], 50),
	cursorField('billing', ['listLedger']),
	{
		displayName: 'Amount (Micros)',
		name: 'amountMicros',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 5000000,
		required: true,
		description: 'Amount in millionths of a dollar. 5000000 is 5 dollars. The minimum purchase may be higher.',
		displayOptions: showFor('billing', ['requestTopUp']),
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'USD',
		required: true,
		description: 'Three capital letters, for example USD',
		displayOptions: showFor('billing', ['requestTopUp']),
	},
];
