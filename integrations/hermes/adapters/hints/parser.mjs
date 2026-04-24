import { hintsError } from './errors.mjs';
import { HERMES_FRAMEWORK, SUPPORTED_TASK_TYPES } from './types.mjs';

export function parseHintRequest(query) {
  const framework = query?.framework;
  const actorId = query?.actor_id;
  const taskType = query?.task_type;
  const appId = query?.app_id ?? null;
  const domainTag = query?.domain_tag ?? null;

  if (framework !== HERMES_FRAMEWORK) {
    throw hintsError('invalid_framework', `framework must be ${HERMES_FRAMEWORK}`);
  }

  if (typeof actorId !== 'string' || !actorId.trim()) {
    throw hintsError('invalid_request', 'actor_id is required');
  }

  if (!SUPPORTED_TASK_TYPES.includes(taskType)) {
    throw hintsError('unsupported_task_type', `task_type not supported: ${taskType}`);
  }

  return {
    framework,
    actor_id: actorId,
    task_type: taskType,
    app_id: appId,
    domain_tag: domainTag
  };
}
