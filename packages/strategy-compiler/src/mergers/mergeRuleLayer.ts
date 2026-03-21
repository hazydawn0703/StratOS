import type { Rule, STU } from '@stratos/shared-types';

export const mergeRuleLayer = (stus: STU[]): Rule[] => {
  const raw = stus.flatMap((stu) => stu.ruleLayer);
  return raw.map((ruleId, idx) => ({
    id: ruleId,
    type: 'required_output_field',
    stage: 'post_generation',
    priority: 100 + idx,
    appliesTo: ['*'],
    params: { source: 'conservative-merge' }
  }));
};
