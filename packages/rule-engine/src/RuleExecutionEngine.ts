import type { ModelResponse, Rule, TaskContext } from '@stratos/shared-types';
import { executeRule } from './ruleExecutors/basicExecutors.js';
import type { RuleExecutionLog, RuntimeEffects } from './runtimeEffects.js';
import { validateRuleTypes } from './validators.js';

export class RuleExecutionEngine {
  validateRules(rules: Rule[]): string[] {
    return validateRuleTypes(rules);
  }

  runPreGeneration(rules: Rule[], _context: TaskContext): { effects: RuntimeEffects; logs: RuleExecutionLog[] } {
    return this.apply(rules.filter((rule) => rule.stage === 'pre_generation'));
  }

  buildInGenerationConstraints(
    rules: Rule[],
    _context: TaskContext
  ): { effects: RuntimeEffects; logs: RuleExecutionLog[] } {
    return this.apply(rules.filter((rule) => rule.stage === 'in_generation'));
  }

  runPostGeneration(
    rules: Rule[],
    _modelResponse: ModelResponse,
    _context: TaskContext
  ): { effects: RuntimeEffects; logs: RuleExecutionLog[] } {
    return this.apply(rules.filter((rule) => rule.stage === 'post_generation'));
  }

  private apply(rules: Rule[]): { effects: RuntimeEffects; logs: RuleExecutionLog[] } {
    const effects: RuntimeEffects = {};
    const logs = rules.map((rule) => executeRule(rule, effects));
    return { effects, logs };
  }
}
