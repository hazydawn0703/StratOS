import { buildAdaptationFailureRecord, buildArtifact } from './builder.mjs';
import { detectOutputFormat } from './detector.mjs';
import { HermesArtifactAdaptationError } from './errors.mjs';

export function createHermesArtifactAdapter() {
  return {
    adapt({
      taskType,
      sourceTaskId,
      rawOutput,
      sourceRefs,
      runtimeMetadata,
      integrationMetadata
    }) {
      try {
        const detected = detectOutputFormat(rawOutput);
        const artifact = buildArtifact({
          taskType,
          sourceTaskId,
          rawOutput,
          detected,
          sourceRefs,
          runtimeMetadata,
          integrationMetadata
        });

        return {
          ok: true,
          artifact
        };
      } catch (error) {
        if (error instanceof HermesArtifactAdaptationError) {
          return {
            ok: false,
            adaptation_failure: buildAdaptationFailureRecord({
              taskType,
              sourceTaskId,
              rawOutput,
              error,
              integrationMetadata
            })
          };
        }

        throw error;
      }
    }
  };
}
