import {
  FEEDBACK_SIGNALS,
  FEEDBACK_TYPES,
  HERMES_EVENT_SCHEMA_VERSION,
  HERMES_FRAMEWORK,
  SUPPORTED_EVENT_TYPES,
  SUPPORTED_TASK_TYPES,
  TASK_COMPLETION_STATUS
} from './types.mjs';
import { ensure, validationError } from './errors.mjs';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, field) {
  ensure(typeof value === 'string' && value.trim().length > 0,
    validationError('invalid_payload', `${field} must be a non-empty string`, { field }));
}

function requireISO8601(value, field) {
  requireString(value, field);
  ensure(!Number.isNaN(Date.parse(value)), validationError('invalid_payload', `${field} must be ISO8601`, { field }));
}

function requireOneOf(value, field, allowed) {
  ensure(allowed.includes(value), validationError('invalid_payload', `${field} must be one of: ${allowed.join(', ')}`, { field, allowed }));
}

function validateBaseEnvelope(event) {
  ensure(isObject(event), validationError('invalid_payload', 'event must be an object'));
  requireString(event.schema_version, 'schema_version');
  ensure(event.schema_version === HERMES_EVENT_SCHEMA_VERSION,
    validationError('invalid_schema_version', `schema_version must be ${HERMES_EVENT_SCHEMA_VERSION}`));

  requireString(event.event_id, 'event_id');
  requireString(event.event_type, 'event_type');
  requireOneOf(event.event_type, 'event_type', SUPPORTED_EVENT_TYPES);
  requireISO8601(event.occurred_at, 'occurred_at');

  requireString(event.framework, 'framework');
  ensure(event.framework === HERMES_FRAMEWORK,
    validationError('invalid_framework', `framework must be ${HERMES_FRAMEWORK}`));

  requireString(event.tenant_id, 'tenant_id');
  requireString(event.task_id, 'task_id');
  requireString(event.session_id, 'session_id');
  requireString(event.actor_id, 'actor_id');
  requireString(event.channel, 'channel');
  ensure(isObject(event.payload), validationError('invalid_payload', 'payload must be an object'));
}

function validateTaskType(payload) {
  requireString(payload.task_type, 'payload.task_type');
  requireOneOf(payload.task_type, 'payload.task_type', SUPPORTED_TASK_TYPES);
}

function validateTaskStarted(payload) {
  validateTaskType(payload);
  requireString(payload.raw_input_summary, 'payload.raw_input_summary');
}

function validateTaskCompleted(payload) {
  validateTaskType(payload);
  requireOneOf(payload.status, 'payload.status', TASK_COMPLETION_STATUS);
  const hasInline = payload.raw_output_inline !== undefined && payload.raw_output_inline !== null;
  const hasRef = typeof payload.raw_output_ref === 'string' && payload.raw_output_ref.trim().length > 0;
  ensure(hasInline || hasRef,
    validationError('invalid_payload', 'payload.raw_output_inline or payload.raw_output_ref is required'));
}

function validateTaskFeedback(payload) {
  validateTaskType(payload);
  requireOneOf(payload.feedback_type, 'payload.feedback_type', FEEDBACK_TYPES);
  requireOneOf(payload.signal, 'payload.signal', FEEDBACK_SIGNALS);
  if (payload.notes !== undefined) {
    requireString(payload.notes, 'payload.notes');
  }
}

function validateOutcomeAvailable(payload) {
  validateTaskType(payload);
  requireString(payload.outcome_type, 'payload.outcome_type');
  ensure(payload.outcome_value !== undefined, validationError('invalid_payload', 'payload.outcome_value is required'));
  requireISO8601(payload.recorded_at, 'payload.recorded_at');
}

export function validateHermesEvent(event) {
  validateBaseEnvelope(event);

  switch (event.event_type) {
    case 'task.started':
      validateTaskStarted(event.payload);
      break;
    case 'task.completed':
      validateTaskCompleted(event.payload);
      break;
    case 'task.feedback':
      validateTaskFeedback(event.payload);
      break;
    case 'outcome.available':
      validateOutcomeAvailable(event.payload);
      break;
    default:
      throw validationError('unsupported_event_type', `unsupported event_type: ${event.event_type}`);
  }

  return event;
}
