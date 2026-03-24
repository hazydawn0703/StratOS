<p align="center">
  <img src="../docs/assets/stratos.svg" alt="StratOS" width="420" />
</p>

<p align="center">
  <strong>The architecture of a strategy runtime for agents.</strong>
</p>

<p align="center">
  <a href="../README.md">
    <img src="https://img.shields.io/badge/Back-README-111827?style=for-the-badge" alt="README" />
  </a>
  <a href="./integration.md">
    <img src="https://img.shields.io/badge/Next-Integration-1f2937?style=for-the-badge" alt="Integration" />
  </a>
  <a href="../apps/finance">
    <img src="https://img.shields.io/badge/Reference-Finance-374151?style=for-the-badge" alt="Finance Reference" />
  </a>
</p>

<p align="center">
  <a href="#what-this-doc-covers">What this doc covers</a>
  ·
  <a href="#layer-model">Layer model</a>
  ·
  <a href="#runtime-flow">Runtime flow</a>
  ·
  <a href="#core-subsystems">Core subsystems</a>
  ·
  <a href="#monorepo-boundaries">Monorepo boundaries</a>
  ·
  <a href="#strategy-lifecycle">Strategy lifecycle</a>
</p>

<hr />

<h2 id="what-this-doc-covers">What this doc covers</h2>

<p>
  This document explains how StratOS is structured as a <strong>strategy runtime</strong>.
</p>

<p>
  It does <strong>not</strong> describe one specific app.
  The finance system is only the first reference implementation built on top of the core.
</p>

<p>
  If you want the conceptual overview, read <a href="../README.md">README.md</a>.<br />
  If you want to graft StratOS into an existing agent system, read <a href="./integration.md">integration.md</a>.
</p>

<hr />

<h2 id="design-posture">Design posture</h2>

<p>
  StratOS is built around one architectural decision:
</p>

<blockquote>
  <p>
    <strong>domain applications live in <code>apps/</code>, while strategy infrastructure lives in <code>packages/</code>.</strong>
  </p>
</blockquote>

<p>
  This keeps strategy evolution reusable across many domains:
  finance, content, ads, sales, ops, and more.
</p>

<p>
  In other words:
</p>

<ul>
  <li><strong>apps/</strong> express domain behavior</li>
  <li><strong>packages/</strong> express reusable strategy machinery</li>
  <li><strong>infrastructure</strong> provides storage, queues, model access, and configuration</li>
</ul>

<hr />

<h2 id="layer-model">Layer model</h2>

<pre><code>apps/*
  ↓
packages/*
  ↓
infrastructure
</code></pre>

<p>
  More concretely:
</p>

<pre><code>Application Layer
 ├─ Finance Assistant
 ├─ Content Agent
 ├─ Ads Optimization
 ├─ Sales Agent
 └─ Ops Automation

StratOS Core
 ├─ STU Registry
 ├─ Strategy Compiler
 ├─ Rule Execution Engine
 ├─ Evaluation Engine
 ├─ Experiment Engine
 ├─ Bias Monitor
 ├─ Routing
 └─ Shared Schemas

Agent / Model Layer
 ├─ LLM
 ├─ Skills / Tools
 └─ Memory

Infrastructure
 ├─ Model Gateway
 ├─ Storage
 ├─ Queue / Scheduler
 └─ Config / Runtime Adapters
</code></pre>

<p>
  StratOS does not replace the agent layer.
  It sits between application intent and model execution, giving the system a strategy runtime.
</p>

<hr />

<h2 id="runtime-flow">Runtime flow</h2>

<p>
  At runtime, strategy is not hardcoded inside app logic.
  It is compiled and executed through a controlled path.
</p>

<pre><code>STU Registry
    ↓
load_active_stu
    ↓
strategy_filter
    ↓
Strategy Compiler
    ↓
{
  prompt_layer,
  rule_layer,
  routing_layer
}
    ↓
Rule Execution Engine
    ↓
Model Gateway
    ↓
Model / Tools
    ↓
Structured Output
    ↓
Review / Evaluation / Replay
</code></pre>

<p>
  This path is the architectural center of StratOS.
</p>

<ul>
  <li><strong>STU</strong> is the declarative strategy asset</li>
  <li><strong>Compiler</strong> transforms strategy into executable layers</li>
  <li><strong>Rule Execution Engine</strong> is where strategy actually takes effect</li>
  <li><strong>Model Gateway</strong> is the controlled execution entry</li>
</ul>

<hr />

<h2 id="core-subsystems">Core subsystems</h2>

<h3>1. STU Registry</h3>

<p>
  The STU Registry is the source of active strategy assets.
</p>

<ul>
  <li>stores versioned STUs</li>
  <li>loads active strategy units for the current task</li>
  <li>supports activation, deprecation, and governance</li>
  <li>keeps strategy separate from app code</li>
</ul>

<h3>2. Strategy Compiler</h3>

<p>
  The compiler converts active STUs plus task context into three executable layers:
</p>

<ul>
  <li><strong>Prompt Layer</strong> — behavioral instruction</li>
  <li><strong>Rule Layer</strong> — structured runtime constraints</li>
  <li><strong>Routing Layer</strong> — model and execution-path control</li>
</ul>

<p>
  The compiler is responsible for merge logic, deduplication, and conflict handling.
</p>

<h3>3. Rule Execution Engine</h3>

<p>
  The Rule Execution Engine is not just a validator.
  It is the runtime location where strategy becomes real behavior.
</p>

<p>
  It supports three execution stages:
</p>

<ul>
  <li><strong>Pre-generation</strong> — validate required inputs, evidence coverage, confidence caps</li>
  <li><strong>In-generation</strong> — impose structural generation constraints</li>
  <li><strong>Post-generation</strong> — validate outputs, repair, retry, reject, or downgrade</li>
</ul>

<p>
  Every rule execution should leave a structured trace for review, replay, and auditability.
</p>

<h3>4. Evaluation Engine</h3>

<p>
  The Evaluation Engine measures whether a strategy change actually improves the system.
</p>

<ul>
  <li>runs offline checks</li>
  <li>compares candidate strategy against baselines</li>
  <li>detects metric movement before rollout</li>
</ul>

<h3>5. Experiment Engine</h3>

<p>
  The Experiment Engine controls rollout.
</p>

<ul>
  <li>stages strategy changes safely</li>
  <li>supports canary / gray release behavior</li>
  <li>enables keep / rollback decisions</li>
</ul>

<h3>6. Bias Monitor</h3>

<p>
  Not every behavioral change is an improvement.
</p>

<p>
  The Bias Monitor distinguishes:
</p>

<ul>
  <li>real improvement</li>
  <li>behavioral drift</li>
  <li>over-correction</li>
  <li>confidence distortion</li>
</ul>

<h3>7. Model Gateway</h3>

<p>
  The Model Gateway is the execution entry below strategy runtime.
</p>

<ul>
  <li>abstracts model providers</li>
  <li>supports routing upgrades / downgrades</li>
  <li>keeps application code from coupling directly to model calls</li>
</ul>

<hr />

<h2 id="execution-stages">Execution stages</h2>

<p>
  A key architectural constraint in StratOS is that rules must be executable, not decorative.
</p>

<table>
  <tr>
    <th align="left">Stage</th>
    <th align="left">Purpose</th>
    <th align="left">Examples</th>
  </tr>
  <tr>
    <td valign="top"><strong>Pre-generation</strong></td>
    <td valign="top">shape the request before any model call</td>
    <td valign="top">required fields, counter-evidence checks, confidence caps</td>
  </tr>
  <tr>
    <td valign="top"><strong>In-generation</strong></td>
    <td valign="top">constrain generation itself</td>
    <td valign="top">required sections, schema hints, uncertainty notes</td>
  </tr>
  <tr>
    <td valign="top"><strong>Post-generation</strong></td>
    <td valign="top">validate and correct outputs after generation</td>
    <td valign="top">schema validation, retries, downgrade, refusal, repair</td>
  </tr>
</table>

<hr />

<h2 id="monorepo-boundaries">Monorepo boundaries</h2>

<p>
  StratOS only stays reusable if the repository boundary is enforced strictly.
</p>

<h3>What belongs in <code>packages/</code></h3>

<ul>
  <li>STU definitions and lifecycle</li>
  <li>STU Registry</li>
  <li>Strategy Compiler</li>
  <li>Rule Execution Engine</li>
  <li>Evaluation Engine</li>
  <li>Experiment Engine</li>
  <li>Bias Monitoring</li>
  <li>Model Gateway</li>
  <li>shared schemas and infrastructure abstractions</li>
</ul>

<h3>What belongs in <code>apps/</code></h3>

<ul>
  <li>domain concepts such as portfolio, ticker, market data, campaign, lead</li>
  <li>domain-specific APIs and UI</li>
  <li>workflow logic tied to a business surface</li>
  <li>application-specific orchestration on top of StratOS core</li>
</ul>

<h3>Forbidden moves</h3>

<ul>
  <li>duplicating package logic inside apps</li>
  <li>putting domain logic inside packages</li>
  <li>hardcoding strategy directly in app code</li>
  <li>bypassing the compiler to inject strategy manually</li>
</ul>

<hr />

<h2 id="examples-of-boundary">Examples of boundary decisions</h2>

<table>
  <tr>
    <th align="left">Belongs in core</th>
    <th align="left">Belongs in app</th>
  </tr>
  <tr>
    <td valign="top"><code>counterevidence rule</code></td>
    <td valign="top"><code>valuation logic</code></td>
  </tr>
  <tr>
    <td valign="top"><code>STU definition</code></td>
    <td valign="top"><code>investment prediction UI</code></td>
  </tr>
  <tr>
    <td valign="top"><code>bias calculation</code></td>
    <td valign="top"><code>bias dashboard rendering</code></td>
  </tr>
</table>

<hr />

<h2 id="strategy-lifecycle">Strategy lifecycle</h2>

<p>
  StratOS is not just a runtime architecture.
  It is a lifecycle architecture.
</p>

<pre><code>Action
  ↓
Outcome
  ↓
Review
  ↓
Error Attribution
  ↓
Candidate Strategy
  ↓
Evaluation
  ↓
Experiment / Rollout
  ↓
Monitoring
  ↓
Keep or Rollback
</code></pre>

<p>
  The critical idea is simple:
</p>

<blockquote>
  <p>
    errors are not only logs — they are inputs for future behavioral correction.
  </p>
</blockquote>

<hr />

<h2 id="reference-applications">Reference applications</h2>

<p>
  The first proving ground is <strong>apps/finance</strong>.
</p>

<p>
  It demonstrates how StratOS can support:
</p>

<ul>
  <li>structured prediction extraction</li>
  <li>timed review workflows</li>
  <li>error pattern capture</li>
  <li>strategy evolution under constraints</li>
  <li>bias-aware improvement</li>
</ul>

<p>
  But architecture-wise, finance is only one app layer.
  The same core should remain reusable for content, ads, sales, and ops.
</p>

<hr />

<h2 id="non-goals">Non-goals of this architecture</h2>

<ul>
  <li>StratOS is not a replacement for every agent framework</li>
  <li>StratOS is not a domain app by itself</li>
  <li>StratOS is not model fine-tuning infrastructure</li>
  <li>StratOS is not a centralized data platform</li>
  <li>StratOS is not a generic tool marketplace</li>
</ul>

<hr />

<h2 id="guiding-constraint">Guiding constraint</h2>

<blockquote>
  <p>
    Strategy must be explicit.<br />
    Strategy must be executable.<br />
    Strategy must be testable.<br />
    Strategy must be reversible.
  </p>
</blockquote>

<hr />

<h2 id="next">Next</h2>

<p>
  This document explains <strong>what StratOS is made of</strong>.
</p>

<p>
  The next document, <a href="./integration.md">integration.md</a>, should explain
  <strong>how to graft StratOS into an existing agent system</strong> with minimal disruption.
</p>
