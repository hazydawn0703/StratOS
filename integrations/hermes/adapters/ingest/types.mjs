export const HERMES_FRAMEWORK = 'hermes';
export const HERMES_EVENT_SCHEMA_VERSION = 'hermes.events.v0.1';

export const SUPPORTED_TASK_TYPES = Object.freeze([
  'analysis',
  'planning',
  'scheduled_report'
]);

export const SUPPORTED_EVENT_TYPES = Object.freeze([
  'task.started',
  'task.completed',
  'task.feedback',
  'outcome.available'
]);

export const FEEDBACK_TYPES = Object.freeze(['user', 'operator', 'automated']);
export const FEEDBACK_SIGNALS = Object.freeze(['positive', 'negative', 'neutral']);
export const TASK_COMPLETION_STATUS = Object.freeze(['success', 'failed']);
