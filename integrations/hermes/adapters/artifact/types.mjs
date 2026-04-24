export const HERMES_ARTIFACT_PRESET_VERSION = 'hermes.artifact.v0.1';
export const HERMES_FRAMEWORK = 'hermes';

export const TASK_TO_ARTIFACT_TYPE = Object.freeze({
  analysis: 'strategy_analysis_artifact',
  planning: 'strategy_plan_artifact',
  scheduled_report: 'strategy_report_artifact'
});

export const SUPPORTED_TASK_TYPES = Object.freeze(Object.keys(TASK_TO_ARTIFACT_TYPE));
