# Core Loop Protocols (Phase J)

## Loop skeleton
`Artifact -> Claim -> Outcome -> Review -> ErrorPattern -> Evaluation -> Experiment`

## Claim extractor protocol
- Input: `artifactId`, `taskType`, `content`
- Output: `StrategyClaimRecord[]` with stable `claim_id`, `artifact_id`, `schema_version`, timestamp
- Failure path: empty artifact content -> `{ ok: false, error }`

## Review engine protocol
- Input: `StrategyClaimRecord` + `OutcomeRecord`
- Output minimal fields:
  - `review_id`
  - `review_target`
  - `result_label`
  - `error_summary`
  - `attribution`
  - `severity`
  - `review_timestamp`

## Error utilization protocol
- Input: `StructuredReview[]`
- Output: aggregated `ErrorPattern[]` with lifecycle state
  - `observed -> clustered -> named`

## Evaluation protocol
- Input: candidate/baseline offline scores + support count
- Output: `CandidateEvaluationSummary` with `delta` and `recommendation`

## Replay / router linkage
- Router emits decision metadata (`policyApplied`, `fallbackUsed`, `deniedProviders`)
- Replay supports fixture replay + diff (`stageDiff`, `payloadKeyDiff`) for explainability.
