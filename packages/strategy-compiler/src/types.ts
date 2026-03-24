import type { Rule, STU } from '@stratos/shared-types';

export interface ExecutableRule extends Rule {}

export interface CompiledRoutingConfig {
  providers: string[];
  hints: string[];
}

export interface CompiledStrategyBundle {
  promptLayer: string[];
  ruleLayer: ExecutableRule[];
  routingLayer: CompiledRoutingConfig;
}

export type StrategyFilter = (stus: STU[], taskType: string) => STU[];
