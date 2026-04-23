import { adaptationError } from './errors.mjs';
import { HERMES_ARTIFACT_PRESET_VERSION, HERMES_FRAMEWORK, TASK_TO_ARTIFACT_TYPE } from './types.mjs';

function buildDefaultTitle(taskType, sourceTaskId) {
  return `${taskType} artifact from ${sourceTaskId}`;
}

function buildSummary(normalizedBody) {
  if (typeof normalizedBody === 'string') {
    return normalizedBody.slice(0, 240);
  }

  if (normalizedBody && typeof normalizedBody === 'object') {
    if (typeof normalizedBody.summary === 'string') {
      return normalizedBody.summary.slice(0, 240);
    }

    const compact = JSON.stringify(normalizedBody);
    return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
  }

  return 'No summary available';
}

export function buildArtifact({
  taskType,
  sourceTaskId,
  rawOutput,
  detected,
  sourceRefs = [],
  runtimeMetadata = {},
  integrationMetadata = {}
}) {
  const artifactType = TASK_TO_ARTIFACT_TYPE[taskType];
  if (!artifactType) {
    throw adaptationError('unsupported_task_type', `unsupported task_type: ${taskType}`, { taskType });
  }

  const body = detected?.normalizedBody;
  if (body === null || body === undefined) {
    throw adaptationError('missing_body', 'normalized body is required');
  }

  const artifactId = `hermes_artifact_${sourceTaskId}`;
  const title = typeof body?.title === 'string' && body.title.trim()
    ? body.title.trim()
    : buildDefaultTitle(taskType, sourceTaskId);

  return {
    artifact_id: artifactId,
    source_framework: HERMES_FRAMEWORK,
    source_task_id: sourceTaskId,
    artifact_type: artifactType,
    schema_version: HERMES_ARTIFACT_PRESET_VERSION,
    title,
    summary: buildSummary(body),
    body,
    sections: detected?.sections ?? [],
    source_refs: sourceRefs,
    runtime_metadata: {
      detected_format: detected?.format,
      adapted_at: new Date().toISOString(),
      ...runtimeMetadata
    },
    integration_metadata: integrationMetadata,
    raw_output: rawOutput
  };
}

export function buildAdaptationFailureRecord({ taskType, sourceTaskId, rawOutput, error, integrationMetadata = {} }) {
  return {
    failure_id: `hermes_artifact_failure_${sourceTaskId}_${Date.now()}`,
    source_framework: HERMES_FRAMEWORK,
    source_task_id: sourceTaskId,
    task_type: taskType,
    reason_code: error.code ?? 'adaptation_failed',
    reason_message: error.message,
    raw_output: rawOutput,
    integration_metadata: integrationMetadata,
    created_at: new Date().toISOString()
  };
}
