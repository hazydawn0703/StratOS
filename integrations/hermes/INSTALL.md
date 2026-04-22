# INSTALL

This guide bootstraps the StratOS × Hermes bridge in local development.

## Prerequisites

- Hermes runtime available in your environment
- Reachable StratOS API endpoint
- A service token/API key with bridge ingest permission
- `bash`, `curl`, and `jq`

## 1) Prepare configuration

```bash
cp integrations/hermes/CONFIG.example.yaml /tmp/hermes-stratos.yaml
```

Edit:

- `bridge.strat_os_endpoint`
- `bridge.api_key`
- `bridge.trackable_task_types`

## 2) Validate endpoint connectivity

```bash
curl -sS "$STRATOS_BASE/health" | jq .
```

## 3) Register bridge in Hermes runtime

Implementation-specific, but minimally Hermes should:

- load YAML configuration
- call bridge eligibility check before task execution
- emit task events after lifecycle milestones
- request strategy hints before eligible tasks

## 4) Verify with smoke test

Run the script from this repository:

```bash
bash integrations/hermes/scripts/smoke/run_local_smoke.sh
```

## 5) Next steps

- tune trackable task list
- configure retry policy and dead-letter queue
- enable observability dashboards for ingest and hint latency
