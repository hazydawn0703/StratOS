# Bridge Architecture

## Components

1. **Eligibility gate**: Determines whether a task should be tracked.
2. **Event emitter**: Sends lifecycle events to StratOS ingest API.
3. **Hint fetcher**: Pulls active strategy hints for eligible tasks.
4. **Adapters**: Map Hermes-native payloads to StratOS contracts.

## Flow

1. Task arrives in Hermes.
2. Eligibility gate evaluates task type/policy.
3. (Optional) Hint fetcher requests hints.
4. Hermes executes task normally.
5. Event emitter sends completion and feedback/outcome events.
6. StratOS performs downstream governance workflows.
