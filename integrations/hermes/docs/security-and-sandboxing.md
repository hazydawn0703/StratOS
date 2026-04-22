# Security and Sandboxing

## Baseline controls

- API key authentication for bridge calls
- TLS in transit to StratOS endpoint
- tenant isolation via `tenant_id`
- PII redaction before event emission

## Recommendations

- rotate credentials regularly
- emit structured audit logs for all bridge calls
- avoid transmitting raw sensitive tool outputs unless required
- enforce allowlist-based task eligibility
