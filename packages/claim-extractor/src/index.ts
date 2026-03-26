export interface ClaimExtractionInput {
  artifactId: string;
  taskType: string;
  content: string;
}

export interface StrategyClaimRecord {
  claim_id: string;
  artifact_id: string;
  task_type: string;
  claim_text: string;
  schema_version: '1.0';
  extracted_timestamp: string;
}

export interface ClaimExtractionResult {
  ok: boolean;
  claims: StrategyClaimRecord[];
  error?: string;
}

export class ClaimExtractor {
  extract(input: ClaimExtractionInput): ClaimExtractionResult {
    const normalized = input.content.trim();
    if (!normalized) {
      return { ok: false, claims: [], error: 'artifact content is empty' };
    }

    const segments = normalized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    const claims = segments.map((segment, index) => ({
      claim_id: `${input.artifactId}-claim-${index + 1}`,
      artifact_id: input.artifactId,
      task_type: input.taskType,
      claim_text: segment,
      schema_version: '1.0' as const,
      extracted_timestamp: new Date().toISOString()
    }));

    return { ok: true, claims };
  }
}
