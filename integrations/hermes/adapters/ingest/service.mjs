import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { HermesIngestError } from './errors.mjs';
import { createIngestRecord, mapHermesEventToTaskContextInput } from './mapper.mjs';
import { validateHermesEvent } from './schema.mjs';

function makeArchiveFileName(event) {
  const safeEventId = event.event_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${event.occurred_at.replace(/[:.]/g, '-')}_${safeEventId}.json`;
}

async function archivePayload(archiveDir, event) {
  await mkdir(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, makeArchiveFileName(event));
  await writeFile(archivePath, `${JSON.stringify(event, null, 2)}\n`, 'utf8');
  return archivePath;
}

export function createHermesIngestService(options = {}) {
  const archiveDir = options.archiveDir ?? path.resolve(process.cwd(), 'integrations/hermes/.runtime/ingest-archive');

  return {
    async ingestEvent(event) {
      try {
        const validated = validateHermesEvent(event);
        const archivePath = await archivePayload(archiveDir, validated);
        const ingestRecord = createIngestRecord(validated, archivePath);
        const taskContextInput = mapHermesEventToTaskContextInput(validated);

        return {
          ok: true,
          ingestRecord,
          taskContextInput,
          archivePath
        };
      } catch (error) {
        if (error instanceof HermesIngestError) {
          return {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          };
        }

        throw error;
      }
    }
  };
}
