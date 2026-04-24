import { HermesHintsError } from './errors.mjs';
import { parseHintRequest } from './parser.mjs';
import { buildHintsResponse } from './response.mjs';
import { resolveActiveHints } from './resolver.mjs';

export function createHermesHintsService(options = {}) {
  const hintStore = options.hintStore ?? { hints: [] };

  return {
    getStrategyHints(query) {
      try {
        const request = parseHintRequest(query);
        const resolved = resolveActiveHints({ request, hintStore });

        return {
          ok: true,
          response: buildHintsResponse({ resolved })
        };
      } catch (error) {
        if (error instanceof HermesHintsError) {
          return {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            },
            response: buildHintsResponse({
              resolved: {
                hints: [],
                active_stu_refs: [],
                route_flags: []
              }
            })
          };
        }

        throw error;
      }
    }
  };
}
