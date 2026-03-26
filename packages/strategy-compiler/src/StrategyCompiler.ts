import type { STU, TaskContext } from '@stratos/shared-types';
import type { CompilationSTUInput, CompiledStrategyBundle } from './types.js';
import { strategyFilter } from './filters/strategyFilter.js';
import { mergePromptLayer } from './mergers/mergePromptLayer.js';
import { mergeRuleLayer } from './mergers/mergeRuleLayer.js';
import { mergeRoutingLayer } from './mergers/mergeRoutingLayer.js';
import { detectConflicts } from './mergers/detectConflicts.js';

export class StrategyCompiler {
  compile(stus: STU[] | CompilationSTUInput, taskContext: TaskContext): CompiledStrategyBundle {
    const normalized: CompilationSTUInput = Array.isArray(stus)
      ? { active_stus: stus, experiment_stus: [], candidate_stus: [] }
      : stus;

    const filteredActive = strategyFilter(normalized.active_stus, taskContext.taskType);
    const filteredExperiment = strategyFilter(normalized.experiment_stus, taskContext.taskType);
    const filteredCandidate = strategyFilter(normalized.candidate_stus, taskContext.taskType);
    const prioritized = [...filteredActive, ...filteredExperiment, ...filteredCandidate];
    const conflicts = detectConflicts(prioritized);

    return {
      promptLayer: [
        ...mergePromptLayer(filteredActive),
        ...mergePromptLayer(filteredExperiment),
        ...mergePromptLayer(filteredCandidate),
        ...conflicts.map((item) => `CONFLICT:${item}`)
      ],
      ruleLayer: [...mergeRuleLayer(filteredActive), ...mergeRuleLayer(filteredExperiment), ...mergeRuleLayer(filteredCandidate)],
      routingLayer: normalized.routing_defaults ?? mergeRoutingLayer(prioritized),
      audit: {
        activeStuVersions: filteredActive.map((item) => `${item.stuId}@${item.version}`),
        experimentStuVersions: filteredExperiment.map((item) => `${item.stuId}@${item.version}`),
        candidateStuVersions: filteredCandidate.map((item) => `${item.stuId}@${item.version}`),
        appliedPriority: [
          'system_hard_constraints',
          'safety_rules',
          'app_forced_rules',
          'active_stu',
          'experiment_stu',
          'candidate_stu',
          'default_template'
        ]
      }
    };
  }
}
