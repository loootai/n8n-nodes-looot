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
			{ name: 'Get Balance', value: 'getBalance', description: 'Free. Reads your available prepaid credit and the top-up link. Needs no input.', action: 'Get the balance' },
			{ name: 'List Ledger Entries', value: 'listLedger', description: 'Free. Lists every charge and top-up on your account, newest first. Optionally pass a limit.', action: 'List ledger entries' },
			{ name: 'List Top-Ups', value: 'listTopUps', description: 'Free. Lists your past prepaid top-ups. Needs no input.', action: 'List top ups' },
			{ name: 'Request a Top-Up', value: 'requestTopUp', description: 'Free to call, you pay only if you complete the checkout. Pass an amount in micros and a currency to get a checkout link.', action: 'Request a top up' },
		],
		default: 'getBalance',
	},
	limitField('billing', ['listLedger'], 50),
	cursorField('billing', ['listLedger']),
	{
		displayName: 'Amount in Micros',
		name: 'amountMicros',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 5000000,
		required: true,
		placeholder: '5000000',
		description: 'How much credit to buy, in micros (millionths of a dollar). 10000 micros is 1 cent, 5000000 is 5 dollars. The minimum purchase may be higher.',
		displayOptions: showFor('billing', ['requestTopUp']),
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'USD',
		required: true,
		placeholder: 'USD',
		description: 'Three capital letters, for example USD',
		displayOptions: showFor('billing', ['requestTopUp']),
	},
];
