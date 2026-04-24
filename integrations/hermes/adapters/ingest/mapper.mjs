import { HERMES_FRAMEWORK } from './types.mjs';

/**
 * @param {import('./schema.mjs').validateHermesEvent extends (...args: any[]) => infer R ? R : any} event
 */
export function mapHermesEventToTaskContextInput(event) {
  const payload = event.payload ?? {};

  return {
    external_task_id: event.task_id,
    framework: HERMES_FRAMEWORK,
    session_id: event.session_id,
    actor_id: event.actor_id,
    channel: event.channel,
    task_type: payload.task_type,
    raw_input_summary: payload.raw_input_summary ?? null,
    raw_output_ref: payload.raw_output_ref ?? null,
    raw_output_inline: payload.raw_output_inline ?? null,
    model_metadata: payload.model_metadata ?? {},
    timestamps: {
      occurred_at: event.occurred_at,
      ...(payload.timestamps ?? {})
    },
    integration_metadata: {
      source_event_id: event.event_id,
      source_event_type: event.event_type,
      tenant_id: event.tenant_id
    },
    source_payload: event
  };
}

export function createIngestRecord(event, archivePath) {
  return {
    ingest_record_id: `hermes_ingest_${event.event_id}`,
    framework: HERMES_FRAMEWORK,
    event_id: event.event_id,
    event_type: event.event_type,
    tenant_id: event.tenant_id,
    task_id: event.task_id,
    session_id: event.session_id,
    actor_id: event.actor_id,
    archive_path: archivePath,
    ingested_at: new Date().toISOString()
  };
}
