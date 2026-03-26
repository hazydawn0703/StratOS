# Monorepo Dependency & Import Audit (Phase G)

Date: 2026-03-26

## Scope
- `packages/*`
- `apps/*`

## Findings

1. `@stratos/*` imports were present and target packages all exist with valid `name` fields.
2. Direct dependency declarations were mostly present, but TS compile mode (`tsc --noEmit` per package) did not honor cross-package source graphs under NodeNext without built declaration artifacts.
3. Internal package manifests were missing consistent `exports` and `build` scripts, making long-term package boundary behavior ambiguous.
4. Workspace lacked a root TS project reference graph (`tsconfig.json` with `references`) and used recursive per-package typecheck, causing unstable order and module resolution failures.

## Fix checklist implemented

- [x] Added root `tsconfig.json` references graph for packages/apps.
- [x] Switched root scripts to `tsc -b` topology (`build`, `typecheck`, `clean`).
- [x] Enabled composite/references build mode across package/app tsconfigs.
- [x] Normalized package metadata (`main`, `types`, `exports`, `build`, `typecheck`, `clean`) for all internal TS projects.
- [x] Normalized internal workspace dependency version specifiers to `workspace:*`.
- [x] Fixed a strict generic constraint in `StrategyRuntimeKernel` exposed by the real build graph.

## Outcome
- `pnpm install` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
