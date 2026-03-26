# Core Loop Protocols (Phase J/K)

## Loop skeleton
`Artifact -> Claim -> Outcome -> Review -> ErrorPattern -> STUCandidate -> Evaluation -> Experiment`

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

## Error utilization + STU candidate protocol
- Input: `StructuredReview[]`
- Output: aggregated `ErrorPattern[]` with lifecycle state
  - `observed -> clustered -> named -> validated -> promoted_to_stu_candidate`
- Candidate promotion output: `STUCandidate`
  - stable schema
  - unique `candidate_id`
  - source `error_pattern_id`
  - review/evidence refs
  - scope note + strategy summary

## Bias coupling protocol
- BiasMonitor outputs `BiasSnapshot` + `BiasAlert`
- Candidate gate output: `needs_bias_review` or `ready_for_evaluation`
- Bias outputs are inputs to evaluation/experiment pre-checks; they do not auto-activate production strategy.

## Evaluation protocol
- Input: candidate/baseline offline scores + support count
- Output: `CandidateEvaluationSummary` with `delta` and `recommendation`

## Replay / router linkage
- Router emits decision metadata (`policyApplied`, `fallbackUsed`, `deniedProviders`)
- Replay supports fixture replay + diff (`stageDiff`, `payloadKeyDiff`)
- STU candidate replay must retain:
  - source error pattern
  - bias snapshot/evidence refs
  - experiment gate result.
