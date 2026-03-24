# StratOS

**From tool-using agents to strategy-evolving systems.**

**StratOS is a Strategy Operating System for Agents.**

Most agent frameworks are built around:

- **skills** — what an agent can do  
- **tools** — what an agent can call  
- **memory** — what an agent can retain  

StratOS is built for the missing layer:

> **Strategy — how an agent decides, learns from failure, and improves over time.**

---

## Why StratOS

Today, agents can act.  
But when they fail, improvement is still mostly manual:

- rewrite the prompt
- add another rule
- patch the workflow
- try again

That does not scale.

As agents become persistent, multi-step, and high-stakes, they need something stronger:

> a way to **observe failure, extract patterns, evolve strategy, and apply correction safely**.

StratOS exists to make that loop a first-class system.

---

## What StratOS makes possible

StratOS turns this into runtime infrastructure:

**Action → Outcome → Review → Error → Strategy → Next Action**

It helps agents:

- generate structured decisions
- evaluate outcomes
- extract recurring error patterns
- convert lessons into reusable strategy units
- test changes before rollout
- improve behavior without losing control

---

## Core idea

Most frameworks focus on **capability**.

StratOS focuses on **judgment**.

### Skills
**What an agent can do**

### Strategy
**How an agent decides and improves**

StratOS is not another tool layer.  
It is a **strategy layer** for intelligent systems.

---

## Core primitives

- **Self-Training Units (STU)**  
  Versioned strategy units derived from failures, reviews, and behavioral patterns

- **STU Registry**  
  Strategy loading, versioning, activation, and governance

- **Strategy Compiler**  
  Compiles STUs into:
  - Prompt Layer
  - Rule Layer
  - Routing Layer

- **Rule Execution Engine**  
  Executes structured control logic before / during / after generation

- **Evaluation & Experiment System**  
  Tests strategy changes before production rollout

- **Bias Monitoring**  
  Distinguishes real improvement from drift

---

## Architecture

```text
Application Layer
 - Finance Assistant
 - Content Agent
 - Ads Optimization
 - Sales Agent
 - Ops Automation

StratOS Core
 - STU Registry
 - Strategy Compiler
 - Rule Engine
 - Evaluation
 - Experiment
 - Bias Monitor
 - Routing

Agent Layer
 - LLM
 - Skills / Tools
 - Memory

Infrastructure
 - Model Gateway
 - Storage
 - Queue
 - Config

---

StratOS does not replace your agent framework.  
It gives it a **strategy runtime**.

---

## First proving ground: Finance

The first implementation of StratOS is a finance reasoning system with:

- portfolio tracking
- prediction generation
- timed review
- error extraction
- strategy evolution
- bias monitoring

Finance is the first reference implementation — not the limit of the framework.

---

## Open source philosophy

> **Private-instance evolution, open structural collaboration**

- run your own instance
- keep your own data and API keys
- share schemas, rules, STUs, and benchmarks with the community

StratOS is designed so that strategic structure can be shared without centralizing private operational data.

---

## Repository structure

- `apps/` — domain implementations
- `packages/` — StratOS core
- `stu-packs/` — reusable strategy assets
- `benchmarks/` — evaluation datasets

---

## Guiding principle

> Agents should not only act.  
> They should improve how they act.
