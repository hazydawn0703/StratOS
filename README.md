# StratOS

**StratOS is a Strategy Operating System for Agents.**

Most agent frameworks focus on **skills**, **tools**, and **memory**.  
StratOS focuses on something equally important but often missing:

> **Strategy — how an agent decides, learns from mistakes, and improves over time.**

---

## 🧠 What is StratOS?

StratOS is a framework that enables agents to:

- generate structured decisions
- evaluate outcomes
- extract error patterns
- evolve strategies
- apply behavioral corrections safely

It turns this loop into a first-class system:
Action → Outcome → Review → Error → Strategy → Next Action

---

## 🔥 Why StratOS?

LLMs can act, but they don’t reliably improve.

StratOS introduces:

- **Self-Training Units (STU)**  
  Versioned, structured strategy units derived from historical errors

- **STU Registry**  
  Strategy registration, loading, versioning, and activation

- **Strategy Compiler**  
  Converts STUs into:
  - Prompt Layer
  - Rule Layer
  - Routing Layer

- **Rule Execution Engine**  
  Executes structured rules before / during / after generation

- **Evaluation & Experiment System**  
  Tests strategies before rollout

- **Bias Monitoring**  
  Distinguishes real improvement from behavioral drift

---

## 🧩 Core Concept

StratOS separates:

### Skills
> What an agent can do

### Strategy
> How an agent decides and improves

StratOS is a **strategy layer**, not a tool layer.

---

## 🏗️ Architecture

Application Layer
 - ├─ Finance Assistant
 - ├─ Content Agent
 - ├─ Ads Optimization
 - ├─ Sales Agent
 - └─ Ops Automation

StratOS Core
 - ├─ STU Registry
 - ├─ Strategy Compiler
 - ├─ Rule Engine
 - ├─ Evaluation Engine
 - ├─ Experiment Engine
 - ├─ Bias Monitor
 - └─ Routing

Agent Layer
 - ├─ LLM
 - ├─ Skills / Tools
 - └─ Memory

Infrastructure
 - ├─ Model Gateway
 - ├─ Storage
 - ├─ Queue
 - └─ Config

---

## 💼 First Use Case: Finance

The first implementation of StratOS is a **finance reasoning system**:

- portfolio tracking
- prediction generation
- timed review
- error extraction
- strategy evolution
- bias monitoring

This is a **reference implementation**, not the framework itself.

---

## 🌍 Open Source Philosophy

StratOS follows:

> **Private-instance evolution + open structural collaboration**

This means:

- users run their own instances
- users keep their own data and API keys
- the community shares:
  - schemas
  - taxonomies
  - rules
  - strategies (STUs)
  - benchmarks

No centralized data dependency.

---

## 📦 Repository Structure

This is a **monorepo**:
apps/ → domain implementations
packages/ → core framework
stu-packs/ → reusable strategies
benchmarks/ → evaluation datasets

---

## 🚀 Roadmap

- STU standard & lifecycle
- Strategy Compiler
- Rule Execution Engine
- Evaluation & Experiment system
- Bias monitoring
- Replay / auditability

---

## 🧠 Guiding Principle

> Agents should not only act.  
> They should improve how they act.
