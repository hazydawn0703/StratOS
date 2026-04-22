# SMOKE TEST

Minimal end-to-end verification using local mock payloads.

## Objective

Confirm that:

1. sample events can be posted successfully
2. hint retrieval works for eligible task types
3. payload formatting and auth are valid

## Run

```bash
bash integrations/hermes/scripts/smoke/run_local_smoke.sh
```

## Expected

- Event ingest endpoint returns `202`
- Hint endpoint returns `200` and `hints` array
- Script exits with status code `0`

## Troubleshooting

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md).
