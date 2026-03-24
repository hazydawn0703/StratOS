export type RuleType =
  | 'counterevidence_required'
  | 'confidence_cap'
  | 'confidence_penalty'
  | 'required_output_field'
  | 'uncertainty_required'
  | 'schema_validation'
  | 'retry_on_invalid_output'
  | 'routing_upgrade_hint';

export interface Rule {
  id: string;
  type: RuleType;
  stage: 'pre_generation' | 'in_generation' | 'post_generation';
  priority: number;
  appliesTo: string[];
  params: Record<string, unknown>;
}
