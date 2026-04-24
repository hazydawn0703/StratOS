import { evaluateAdmission } from './admission.mjs';
import { classifyClaimType, estimateReviewability, normalizeClaimType } from './classifier.mjs';
import { HermesClaimPresetError, claimPresetError } from './errors.mjs';
import { HERMES_CLAIM_PRESET_VERSION, SUPPORTED_TASK_TYPES } from './types.mjs';

function collectCandidateStatements(artifact) {
  const candidates = [];

  if (typeof artifact.summary === 'string') {
    candidates.push(artifact.summary);
  }

  const body = artifact.body;
  if (typeof body === 'string') {
    candidates.push(...body.split(/[\n.!?]/).map((v) => v.trim()).filter(Boolean));
  }

  if (body && typeof body === 'object') {
    if (typeof body.summary === 'string') {
      candidates.push(body.summary);
    }

    if (Array.isArray(body.sections)) {
      for (const section of body.sections) {
        if (typeof section?.content === 'string') {
          candidates.push(section.content);
        }
      }
    }
  }

  if (Array.isArray(artifact.sections)) {
    for (const section of artifact.sections) {
      if (typeof section?.content === 'string') {
        candidates.push(section.content);
      }
    }
  }

  return [...new Set(candidates.map((v) => v.trim()).filter(Boolean))].slice(0, 20);
}

function buildReviewDueAt(claimType) {
  const now = Date.now();
  const offsetDaysByType = {
    risk_claim: 3,
    recommendation_claim: 7,
    prioritization_claim: 5,
    judgment_claim: 10
  };

  const days = offsetDaysByType[claimType] ?? 7;
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
}

function buildClaim({ artifact, statement, index }) {
  const rawType = classifyClaimType(statement);
  const claimType = normalizeClaimType(rawType);
  const reviewability = estimateReviewability(statement);
  const admission = evaluateAdmission({
    statement,
    taskType: artifact.integration_metadata?.task_type,
    reviewability
  });

  if (!admission.admitted) {
    return null;
  }

  return {
    claim_id: `${artifact.artifact_id}_claim_${index + 1}`,
    artifact_id: artifact.artifact_id,
    claim_type: claimType,
    statement,
    confidence: null,
    reviewability,
    review_due_at: buildReviewDueAt(claimType),
    review_window_hint: null,
    evidence_refs: [],
    tags: [artifact.integration_metadata?.task_type ?? 'unknown_task', claimType],
    extraction_metadata: {
      preset_version: HERMES_CLAIM_PRESET_VERSION,
      source_framework: 'hermes',
      admission_failures: admission.failures
    }
  };
}

function validateArtifactInput(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    throw claimPresetError('invalid_artifact', 'artifact must be an object');
  }

  if (!artifact.artifact_id) {
    throw claimPresetError('invalid_artifact', 'artifact.artifact_id is required');
  }

  const taskType = artifact.integration_metadata?.task_type;
  if (!SUPPORTED_TASK_TYPES.includes(taskType)) {
    throw claimPresetError('unsupported_task_type', `task_type not supported: ${taskType}`);
  }
}

export function createHermesClaimPresetAdapter() {
  return {
    extractClaims(artifact) {
      try {
        validateArtifactInput(artifact);
        const statements = collectCandidateStatements(artifact);
        const claims = statements
          .map((statement, index) => buildClaim({ artifact, statement, index }))
          .filter(Boolean)
          .slice(0, 10);

        return {
          ok: true,
          claims,
          extraction_metadata: {
            preset_version: HERMES_CLAIM_PRESET_VERSION,
            candidate_count: statements.length,
            extracted_count: claims.length
          }
        };
      } catch (error) {
        if (error instanceof HermesClaimPresetError) {
          return {
            ok: false,
            extraction_failure: {
              reason_code: error.code,
              reason_message: error.message,
              artifact_id: artifact?.artifact_id ?? null,
              artifact_snapshot: artifact,
              created_at: new Date().toISOString()
            }
          };
        }

        throw error;
      }
    }
  };
}
