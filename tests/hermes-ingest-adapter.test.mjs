import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { createHermesIngestService } from '../integrations/hermes/adapters/ingest/service.mjs';

const VALID_EVENT = {
  schema_version: 'hermes.events.v0.1',
  event_id: 'evt_test_001',
  event_type: 'task.completed',
  occurred_at: '2026-04-22T08:20:00Z',
  framework: 'hermes',
  tenant_id: 'demo',
  task_id: 'task_analysis_001',
  session_id: 'sess_001',
  actor_id: 'agent_001',
  channel: 'default',
  payload: {
    task_type: 'analysis',
    status: 'success',
    raw_output_inline: {
      summary: 'ok'
    }
  }
};

test('ingest service validates, archives, and maps task context', async () => {
  const archiveDir = await mkdtemp(path.join(tmpdir(), 'hermes-ingest-'));
  const service = createHermesIngestService({ archiveDir });

  const result = await service.ingestEvent(VALID_EVENT);

  assert.equal(result.ok, true);
  assert.equal(result.ingestRecord.event_type, 'task.completed');
  assert.equal(result.taskContextInput.framework, 'hermes');
  assert.equal(result.taskContextInput.task_type, 'analysis');

  const archivedRaw = await readFile(result.archivePath, 'utf8');
  const archived = JSON.parse(archivedRaw);
  assert.equal(archived.event_id, VALID_EVENT.event_id);
});

test('ingest service returns readable validation errors for illegal payload', async () => {
  const archiveDir = await mkdtemp(path.join(tmpdir(), 'hermes-ingest-'));
  const service = createHermesIngestService({ archiveDir });

  const invalid = {
    ...VALID_EVENT,
    event_id: 'evt_test_002',
    payload: {
      task_type: 'chat',
      status: 'success',
      raw_output_inline: 'invalid'
    }
  };

  const result = await service.ingestEvent(invalid);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'invalid_payload');
  assert.match(result.error.message, /task_type/);
});
