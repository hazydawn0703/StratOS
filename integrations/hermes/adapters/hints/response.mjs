import { HERMES_HINTS_VERSION } from './types.mjs';

export function buildHintsResponse({ resolved }) {
  return {
    version: HERMES_HINTS_VERSION,
    hints: resolved.hints ?? [],
    active_stu_refs: resolved.active_stu_refs ?? [],
    route_flags: resolved.route_flags ?? []
  };
}
