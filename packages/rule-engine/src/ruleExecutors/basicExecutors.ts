import type { Rule } from '@stratos/shared-types';
import type { RuntimeEffects, RuleExecutionLog } from '../runtimeEffects.js';

export const executeRule = (rule: Rule, effects: RuntimeEffects): RuleExecutionLog => {
  switch (rule.type) {
    case 'confidence_cap':
      effects.confidenceCap = Number(rule.params.cap ?? 0.7);
      return { ruleId: rule.id, applied: true, message: 'Applied confidence cap.' };
    case 'confidence_penalty':
      effects.confidencePenalty = Number(rule.params.penalty ?? 0.1);
      return { ruleId: rule.id, applied: true, message: 'Applied confidence penalty.' };
    case 'required_output_field':
      effects.requiredFields = [...(effects.requiredFields ?? []), String(rule.params.field ?? 'unknown')];
      return { ruleId: rule.id, applied: true, message: 'Registered required output field.' };
    case 'uncertainty_required':
      effects.requiredNotes = [...(effects.requiredNotes ?? []), 'uncertainty_note'];
      return { ruleId: rule.id, applied: true, message: 'Registered uncertainty note requirement.' };
    case 'retry_on_invalid_output':
      effects.retryPolicy = { maxRetries: Number(rule.params.maxRetries ?? 1) };
      return { ruleId: rule.id, applied: true, message: 'Registered retry policy.' };
    case 'routing_upgrade_hint':
      effects.routingHints = [...(effects.routingHints ?? []), String(rule.params.hint ?? 'upgrade')];
      return { ruleId: rule.id, applied: true, message: 'Registered routing hint.' };
    case 'counterevidence_required':
    case 'schema_validation':
      return { ruleId: rule.id, applied: true, message: 'Rule acknowledged for runtime checks.' };
    default:
      return { ruleId: rule.id, applied: false, message: 'Unsupported rule type.' };
  }
};
