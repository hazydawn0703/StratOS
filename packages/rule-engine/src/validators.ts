import type { Rule } from '@stratos/shared-types';

export const validateRuleTypes = (rules: Rule[]): string[] => {
  const errors: string[] = [];
  for (const rule of rules) {
    if (!rule.id) errors.push('rule id missing');
    if (!rule.type) errors.push(`rule ${rule.id} type missing`);
  }
  return errors;
};
