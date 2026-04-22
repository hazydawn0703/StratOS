# TROUBLESHOOTING

## 401 Unauthorized

- Verify `bridge.api_key` is correct.
- Check token expiry/rotation policy.

## 400 Bad Request

- Validate payload against [`EVENT_SCHEMA.md`](./EVENT_SCHEMA.md).
- Ensure required fields are present and correctly typed.

## 429 Too Many Requests

- Enable retry/backoff in bridge config.
- Reduce event burst size.

## Hints empty for expected task

- Confirm task type is in allowlist.
- Verify tenant scope and hint activation window.
- Check strategy has been promoted/activated in StratOS.

## High latency

- Lower payload size (`events.include_raw_output: false`).
- Tune `request_timeout_ms` and retry settings.
- Investigate network path to StratOS endpoint.
