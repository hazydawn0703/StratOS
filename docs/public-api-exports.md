# Public API Exports Policy

Date: 2026-03-26

## Principle
- Public API is restricted to package root export (`.`).
- Internal implementation paths are private and not supported as stable API.

## Explicit public vs private

| Package | Public export | Private export policy |
|---|---|---|
| `@stratos/shared-types` | `.` -> `dist/index.*` (includes STUCandidate / EvaluationInput / ExperimentCandidate protocols) | `./internal/*` blocked (`null`) |
| `@stratos/claim-extractor` | `.` -> `dist/index.*` | `./internal/*` blocked (`null`) |
| `@stratos/review-engine` | `.` -> `dist/index.*` | `./internal/*` blocked (`null`) |
| `@stratos/error-utilization` | `.` -> `dist/index.*` | `./internal/*` blocked (`null`) |
| `@stratos/model-router` | `.` -> `dist/index.*` | `./internal/*` blocked (`null`) |
| `@stratos/replay-debug` | `.` -> `dist/index.*` | `./internal/*` blocked (`null`) |

## Existing package baseline
- Existing framework packages continue using root-only `exports` (`.`).
- New subpath exports should be added only after API stability review.
