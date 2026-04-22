# StratOS × Hermes

Hermes-native bridge for **review-driven strategy governance**.

This integration is an **optional, external bridge** that allows selected Hermes tasks to enter StratOS governance without rewriting Hermes core runtime.

## Scope and goals

- Keep Hermes runtime behavior unchanged for normal tasks.
- Track only high-value, reviewable task types in v0.
- Emit a minimal event set to StratOS.
- Enable hint retrieval before eligible task execution.
- Keep governance logic (claims/reviews/promotion) in StratOS.

## Directory map

```text
integrations/hermes/
├─ README.md
├─ INSTALL.md
├─ CONFIG.example.yaml
├─ TASK_TYPE_GUIDE.md
├─ EVENT_SCHEMA.md
├─ API_SPEC.md
├─ SMOKE_TEST.md
├─ TROUBLESHOOTING.md
├─ CHANGELOG.md
├─ docs/
│  ├─ concept-note.md
│  ├─ bridge-architecture.md
│  ├─ security-and-sandboxing.md
│  └─ upstream-friendly-notes.md
├─ adapters/
│  ├─ ingest/
│  ├─ artifact/
│  ├─ claim-preset/
│  └─ hints/
├─ examples/
│  ├─ analysis-task/
│  ├─ planning-task/
│  └─ scheduled-report/
├─ scripts/
│  ├─ smoke/
│  ├─ mocks/
│  └─ setup/
└─ testdata/
   ├─ sample-events/
   ├─ sample-outputs/
   └─ sample-hints/
```

## Bridge boundaries

### Hermes remains responsible for

- execution lifecycle
- tools/toolsets
- skills and memory
- sessions/channels/scheduling

### StratOS remains responsible for

- strategy artifacts and claims
- delayed outcome review
- recurring error pattern detection
- STU generation and lifecycle
- evaluation, promotion, rollback

### Bridge responsibilities

- eligibility decision per task
- event emission (`task.started`, `task.completed`, `task.feedback`, `outcome.available`)
- optional hint retrieval (`GET /strategy-hints`)
- minimal UX-facing status

## v0 task selection

See [`TASK_TYPE_GUIDE.md`](./TASK_TYPE_GUIDE.md) for full policy.

Recommended inclusions:

- analysis tasks
- planning tasks
- scheduled report tasks

Recommended exclusions:

- casual chat / one-off Q&A
- pure tool execution and file movement
- tasks without reviewable future outcomes

## Quick start

1. Copy config:
   - `cp integrations/hermes/CONFIG.example.yaml /path/to/runtime/hermes-stratos.yaml`
2. Review API contract:
   - [`API_SPEC.md`](./API_SPEC.md)
3. Validate event payload shape:
   - [`EVENT_SCHEMA.md`](./EVENT_SCHEMA.md)
4. Run smoke workflow:
   - [`SMOKE_TEST.md`](./SMOKE_TEST.md)

## Current maturity

- ✅ Skeleton docs and directory layout
- ✅ Example config and smoke script
- ✅ Mock payloads in `testdata/`
- ⏳ Adapter implementation pending

See [`CHANGELOG.md`](./CHANGELOG.md) for update history.
