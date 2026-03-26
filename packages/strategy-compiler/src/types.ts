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
  audit: {
    activeStuVersions: string[];
    experimentStuVersions: string[];
    candidateStuVersions: string[];
    appliedPriority: string[];
  };
}

export type StrategyFilter = (stus: STU[], taskType: string) => STU[];

export interface CompilationSTUInput {
  active_stus: STU[];
  experiment_stus: STU[];
  candidate_stus: STU[];
  feature_flags?: Record<string, boolean>;
  routing_defaults?: CompiledRoutingConfig;
}
