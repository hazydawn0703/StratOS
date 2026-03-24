import type { STU } from '@stratos/shared-types';

export const createFinanceMockSTU = (): STU => ({
  stuId: 'finance-core',
  version: '0.1.0',
  meta: { source: 'app-shell' },
  scope: ['investment_decision'],
  promptLayer: ['Always include uncertainty notes.'],
  ruleLayer: ['require_output_confidence'],
  routingLayer: { provider: 'mock' },
  evaluation: { status: 'draft' }
});
