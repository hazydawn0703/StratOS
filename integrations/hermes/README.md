# StratOS × Hermes

**Hermes-native bridge for review-driven strategy governance**

Hermes is great at running agents.  
StratOS is built to make strategy improvement **reviewable, testable, and safe**.

This integration lets **eligible Hermes tasks** enter the StratOS governance loop without rewriting Hermes core runtime.

---

## What this integration is

This bridge connects **Hermes Agent** to **StratOS** in a layered way:

- **Hermes** remains responsible for:
  - agent execution
  - tools and toolsets
  - skills and memory
  - sessions and messaging gateways
  - cron scheduling
  - general runtime behavior

- **StratOS** remains responsible for:
  - structured strategy artifacts
  - claim extraction
  - delayed outcome review
  - recurring error pattern detection
  - STU generation
  - evaluation / experiment
  - promotion / rollback

This is **not** a core merge.  
This is **not** a replacement for Hermes learning loop.  
This is an **optional bridge** for higher-governance, higher-review tasks.

---

## Why this exists

Most agent systems can improve in some form.

But in production, a harder question appears:

> How do you make that improvement controlled?

In many systems, when an agent fails, improvement is still mostly manual:

- rewrite the prompt
- add another rule
- patch the workflow
- try again

That does not create a reliable strategy loop.

StratOS adds the missing governance layer:

- outputs become structured artifacts
- artifacts produce reviewable claims
- future outcomes trigger reviews
- repeated failures become reusable strategy units
- changes are evaluated before rollout
- experiments can be promoted or rolled back safely

This bridge brings that loop to Hermes **without forcing Hermes to own StratOS complexity**.

---

## Core idea

> **Hermes learns fast. StratOS makes strategy improvement reviewable, testable, and safe.**

This integration should treat StratOS as:

**an external strategy governance backend**

not as:

- a replacement memory system
- a replacement skills engine
- a rewrite of Hermes runtime
- a deep semantic merge into Hermes core

---

## Relationship model

### Hermes handles

- task execution
- tools
- skills
- memory
- sessions
- channel interaction
- cron jobs
- model/runtime behavior

### StratOS handles

- `TaskContext`
- `StrategyArtifact`
- `StrategyClaim`
- `OutcomeRecord`
- `OutcomeReview`
- `ErrorPattern`
- `STU`
- `EvaluationResult`
- `ExperimentResult`
- `PromotionDecision`

### The bridge handles

- deciding which Hermes tasks are StratOS-trackable
- emitting task and feedback events to StratOS
- optionally fetching strategy hints before eligible tasks
- surfacing minimal status back into Hermes UX

---

## What should cross the bridge

Only a small amount of data should cross the bridge in v0.1.

### 1. Task start context

Hermes tells StratOS that an eligible task is starting.

Used for:

- building `TaskContext`
- registering task lineage
- optional pre-task strategy hints

### 2. Task result payload

Hermes sends finished output and minimal metadata.

Used for:

- artifact adaptation
- claim extraction
- structured persistence

### 3. Feedback or external outcome

Hermes sends user feedback, business signal, scheduled result, or manual annotation.

Used for:

- outcome review
- error utilization
- quality tracking

### 4. Strategy hint retrieval

Hermes optionally asks StratOS for active hints before eligible tasks.

Used for:

- low-intrusion strategy injection
- controlled improvement
- no deep runtime merge

---

## Recommended first task types

To keep scope under control, this integration should **not** track all Hermes tasks.

### Good first candidates

#### Analysis tasks

Examples:

- market analysis
- competitor analysis
- scenario analysis
- risk assessment

#### Planning tasks

Examples:

- next-step recommendation
- prioritization
- route suggestion
- decision memo generation

#### Scheduled report tasks

Examples:

- daily summary
- weekly review
- recurring audit
- recurring recommendations

These are good candidates because they naturally produce outputs that can later be reviewed against outcomes.

---

## Tasks to exclude in v0.1

The following should stay outside StratOS tracking initially:

- casual chat
- simple Q&A
- pure tool execution
- file movement
- one-off snippets
- ephemeral searches
- tasks without future reviewable consequences

---

## Minimal bridge flow

### Step 1

Hermes receives a task normally.

### Step 2

The bridge checks whether the task is StratOS-trackable.

### Step 3

If eligible, Hermes may fetch strategy hints from StratOS.

### Step 4

Hermes executes the task using its normal runtime.

### Step 5

Hermes sends task completion payload to StratOS.

### Step 6

StratOS converts raw output into:

- `StrategyArtifact`
- `StrategyClaim`

### Step 7

Later, feedback or external outcome arrives.

### Step 8

StratOS runs `OutcomeReview`, identifies `ErrorPattern`, and may generate `STU candidate`.

### Step 9

If a strategy update eventually becomes active, Hermes can consume new hints in future eligible tasks.

---

## What Hermes should expose natively

If Hermes later supports a more native bridge, the preferred native surface is still very small.

### Event emission

Hermes should be able to emit events such as:

- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

### Hint retrieval

Hermes should optionally call something like:

- `GET /strategy-hints`

before eligible tasks.

### UI visibility

Hermes may optionally show:

- tracked by StratOS
- review due later
- active strategy hints loaded
- under observation

### Configuration

Hermes should expose bridge configuration without making StratOS mandatory.

---

## What must stay outside Hermes core

The following should remain in StratOS, not Hermes core:

- claim admission logic
- review trigger logic
- error pattern promotion logic
- evaluation policy
- promotion policy
- bias alert policy
- STU lifecycle and governance

This split keeps responsibilities clean.

---

## What this integration is **not**

This bridge is **not** intended to:

- replace Hermes skills with STUs
- replace Hermes memory with StratOS storage
- make StratOS objects first-class Hermes core objects
- require Hermes to own PromotionDecision logic
- send all Hermes traffic into StratOS
- turn Hermes into StratOS

The goal is narrower and cleaner:

> make Hermes natively capable of sending high-value tasks into StratOS’ governance loop

---

## Recommended implementation shape

The recommended implementation is:

### `integrations/hermes`

Suggested structure:

```text
integrations/hermes
├─ README.md
├─ docs/
│  ├─ concept-note.md
│  ├─ interface-spec.md
│  └─ event-schema.md
├─ sidecar/
│  ├─ ingest-client/
│  ├─ event-emitter/
│  └─ hint-fetcher/
├─ adapters/
│  ├─ task-context/
│  ├─ artifact/
│  └─ feedback/
├─ examples/
│  ├─ analysis-task/
│  ├─ planning-task/
│  └─ scheduled-report/
└─ scripts/# StratOS × Hermes

**Hermes-native bridge for review-driven strategy governance**

Hermes is great at running agents.  
StratOS is built to make strategy improvement **reviewable, testable, and safe**.

This integration lets **eligible Hermes tasks** enter the StratOS governance loop without rewriting Hermes core runtime.

---

## What this integration is

This bridge connects **Hermes Agent** to **StratOS** in a layered way:

- **Hermes** remains responsible for:
  - agent execution
  - tools and toolsets
  - skills and memory
  - sessions and messaging gateways
  - cron scheduling
  - general runtime behavior

- **StratOS** remains responsible for:
  - structured strategy artifacts
  - claim extraction
  - delayed outcome review
  - recurring error pattern detection
  - STU generation
  - evaluation / experiment
  - promotion / rollback

This is **not** a core merge.  
This is **not** a replacement for Hermes learning loop.  
This is an **optional bridge** for higher-governance, higher-review tasks.

---

## Why this exists

Most agent systems can improve in some form.

But in production, a harder question appears:

> How do you make that improvement controlled?

In many systems, when an agent fails, improvement is still mostly manual:

- rewrite the prompt
- add another rule
- patch the workflow
- try again

That does not create a reliable strategy loop.

StratOS adds the missing governance layer:

- outputs become structured artifacts
- artifacts produce reviewable claims
- future outcomes trigger reviews
- repeated failures become reusable strategy units
- changes are evaluated before rollout
- experiments can be promoted or rolled back safely

This bridge brings that loop to Hermes **without forcing Hermes to own StratOS complexity**.

---

## Core idea

> **Hermes learns fast. StratOS makes strategy improvement reviewable, testable, and safe.**

This integration should treat StratOS as:

**an external strategy governance backend**

not as:

- a replacement memory system
- a replacement skills engine
- a rewrite of Hermes runtime
- a deep semantic merge into Hermes core

---

## Relationship model

### Hermes handles

- task execution
- tools
- skills
- memory
- sessions
- channel interaction
- cron jobs
- model/runtime behavior

### StratOS handles

- `TaskContext`
- `StrategyArtifact`
- `StrategyClaim`
- `OutcomeRecord`
- `OutcomeReview`
- `ErrorPattern`
- `STU`
- `EvaluationResult`
- `ExperimentResult`
- `PromotionDecision`

### The bridge handles

- deciding which Hermes tasks are StratOS-trackable
- emitting task and feedback events to StratOS
- optionally fetching strategy hints before eligible tasks
- surfacing minimal status back into Hermes UX

---

## What should cross the bridge

Only a small amount of data should cross the bridge in v0.1.

### 1. Task start context

Hermes tells StratOS that an eligible task is starting.

Used for:

- building `TaskContext`
- registering task lineage
- optional pre-task strategy hints

### 2. Task result payload

Hermes sends finished output and minimal metadata.

Used for:

- artifact adaptation
- claim extraction
- structured persistence

### 3. Feedback or external outcome

Hermes sends user feedback, business signal, scheduled result, or manual annotation.

Used for:

- outcome review
- error utilization
- quality tracking

### 4. Strategy hint retrieval

Hermes optionally asks StratOS for active hints before eligible tasks.

Used for:

- low-intrusion strategy injection
- controlled improvement
- no deep runtime merge

---

## Recommended first task types

To keep scope under control, this integration should **not** track all Hermes tasks.

### Good first candidates

#### Analysis tasks

Examples:

- market analysis
- competitor analysis
- scenario analysis
- risk assessment

#### Planning tasks

Examples:

- next-step recommendation
- prioritization
- route suggestion
- decision memo generation

#### Scheduled report tasks

Examples:

- daily summary
- weekly review
- recurring audit
- recurring recommendations

These are good candidates because they naturally produce outputs that can later be reviewed against outcomes.

---

## Tasks to exclude in v0.1

The following should stay outside StratOS tracking initially:

- casual chat
- simple Q&A
- pure tool execution
- file movement
- one-off snippets
- ephemeral searches
- tasks without future reviewable consequences

---

## Minimal bridge flow

### Step 1

Hermes receives a task normally.

### Step 2

The bridge checks whether the task is StratOS-trackable.

### Step 3

If eligible, Hermes may fetch strategy hints from StratOS.

### Step 4

Hermes executes the task using its normal runtime.

### Step 5

Hermes sends task completion payload to StratOS.

### Step 6

StratOS converts raw output into:

- `StrategyArtifact`
- `StrategyClaim`

### Step 7

Later, feedback or external outcome arrives.

### Step 8

StratOS runs `OutcomeReview`, identifies `ErrorPattern`, and may generate `STU candidate`.

### Step 9

If a strategy update eventually becomes active, Hermes can consume new hints in future eligible tasks.

---

## What Hermes should expose natively

If Hermes later supports a more native bridge, the preferred native surface is still very small.

### Event emission

Hermes should be able to emit events such as:

- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

### Hint retrieval

Hermes should optionally call something like:

- `GET /strategy-hints`

before eligible tasks.

### UI visibility

Hermes may optionally show:

- tracked by StratOS
- review due later
- active strategy hints loaded
- under observation

### Configuration

Hermes should expose bridge configuration without making StratOS mandatory.

---

## What must stay outside Hermes core

The following should remain in StratOS, not Hermes core:

- claim admission logic
- review trigger logic
- error pattern promotion logic
- evaluation policy
- promotion policy
- bias alert policy
- STU lifecycle and governance

This split keeps responsibilities clean.

---

## What this integration is **not**

This bridge is **not** intended to:

- replace Hermes skills with STUs
- replace Hermes memory with StratOS storage
- make StratOS objects first-class Hermes core objects
- require Hermes to own PromotionDecision logic
- send all Hermes traffic into StratOS
- turn Hermes into StratOS

The goal is narrower and cleaner:

> make Hermes natively capable of sending high-value tasks into StratOS’ governance loop

---

## Recommended implementation shape

The recommended implementation is:

### `integrations/hermes`

Suggested structure:

```text
integrations/hermes
├─ README.md
├─ docs/
│  ├─ concept-note.md
│  ├─ interface-spec.md
│  └─ event-schema.md
├─ sidecar/
│  ├─ ingest-client/
│  ├─ event-emitter/
│  └─ hint-fetcher/
├─ adapters/
│  ├─ task-context/
│  ├─ artifact/
│  └─ feedback/
├─ examples/
│  ├─ analysis-task/
│  ├─ planning-task/
│  └─ scheduled-report/
└─ scripts/
