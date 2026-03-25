export interface STU {
  stuId: string;
  version: string;
  meta: Record<string, unknown>;
  scope: string[];
  promptLayer: string[];
  ruleLayer: string[];
  routingLayer: Record<string, unknown>;
  evaluation: Record<string, unknown>;
}
