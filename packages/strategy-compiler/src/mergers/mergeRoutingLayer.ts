import type { STU } from '@stratos/shared-types';
import type { CompiledRoutingConfig } from '../types.js';

export const mergeRoutingLayer = (stus: STU[]): CompiledRoutingConfig => ({
  providers: stus.map((stu) => String(stu.routingLayer.provider ?? 'mock')),
  hints: ['conservative-merge']
});
