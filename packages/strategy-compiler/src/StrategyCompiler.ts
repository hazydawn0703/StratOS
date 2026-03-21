import type { STU, TaskContext } from '@stratos/shared-types';
import type { CompiledStrategyBundle } from './types.js';
import { strategyFilter } from './filters/strategyFilter.js';
import { mergePromptLayer } from './mergers/mergePromptLayer.js';
import { mergeRuleLayer } from './mergers/mergeRuleLayer.js';
import { mergeRoutingLayer } from './mergers/mergeRoutingLayer.js';
import { detectConflicts } from './mergers/detectConflicts.js';

export class StrategyCompiler {
  compile(stus: STU[], taskContext: TaskContext): CompiledStrategyBundle {
    const filtered = strategyFilter(stus, taskContext.taskType);
    const conflicts = detectConflicts(filtered);

    return {
      promptLayer: [...mergePromptLayer(filtered), ...conflicts.map((item) => `CONFLICT:${item}`)],
      ruleLayer: mergeRuleLayer(filtered),
      routingLayer: mergeRoutingLayer(filtered)
    };
  }
}
