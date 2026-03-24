<p align="center">
  <img src="../docs/assets/stratos.svg" alt="StratOS" width="420" />
</p>

<p align="center">
  <strong>How to graft StratOS into an existing agent system.</strong>
</p>

<p align="center">
  <a href="../README.md">
    <img src="https://img.shields.io/badge/Back-README-111827?style=for-the-badge" alt="README" />
  </a>
  <a href="./architecture.md">
    <img src="https://img.shields.io/badge/Back-Architecture-1f2937?style=for-the-badge" alt="Architecture" />
  </a>
  <a href="../apps/finance">
    <img src="https://img.shields.io/badge/Reference-Finance-374151?style=for-the-badge" alt="Finance Reference" />
  </a>
</p>

<p align="center">
  <a href="#what-this-doc-covers">What this doc covers</a>
  ·
  <a href="#integration-principle">Integration principle</a>
  ·
  <a href="#three-adoption-paths">Adoption paths</a>
  ·
  <a href="#minimum-integration">Minimum integration</a>
  ·
  <a href="#runtime-contract">Runtime contract</a>
  ·
  <a href="#anti-patterns">Anti-patterns</a>
</p>

<hr />

<h2 id="what-this-doc-covers">What this doc covers</h2>

<p>
  This document explains how to integrate StratOS into an <strong>existing agent system</strong>.
</p>

<p>
  It is written for developers who already have one of these:
</p>

<ul>
  <li>a single-agent app</li>
  <li>a workflow / orchestration layer</li>
  <li>a multi-agent runtime</li>
  <li>a task executor built on top of LLMs and tools</li>
</ul>

<p>
  StratOS is not meant to replace those systems.
  It gives them a <strong>strategy runtime</strong>.
</p>

<hr />

<h2 id="integration-principle">Integration principle</h2>

<blockquote>
  <p>
    <strong>Keep your existing agent runtime. Insert StratOS where strategy should become explicit, executable, and testable.</strong>
  </p>
</blockquote>

<p>
  In practical terms:
</p>

<ul>
  <li>your app still owns user interaction, workflow, and domain logic</li>
  <li>your orchestrator still owns task sequencing and state flow</li>
  <li>your tool layer still owns execution capabilities</li>
  <li><strong>StratOS owns strategy compilation, rule execution, evaluation, and controlled evolution</strong></li>
</ul>

<hr />

<h2 id="where-stratos-sits">Where StratOS sits</h2>

<pre><code>User / API / Workflow
        ↓
Existing Agent Runtime
        ↓
     StratOS
(STU / Compiler / Rule Engine / Evaluation)
        ↓
 Model Gateway / Model Router
        ↓
  LLM / Tools / Memory
</code></pre>

<p>
  This is the most important integration idea:
</p>

<p>
  <strong>StratOS should sit between task intent and model execution.</strong>
</p>

<p>
  That is where strategy can be injected, enforced, logged, evaluated, and improved.
</p>

<hr />

<h2 id="three-adoption-paths">Three adoption paths</h2>

<h3>Path A — wrap a single-agent system</h3>

<p>
  This is the easiest starting point.
</p>

<pre><code>Existing App
   ↓
task_context
   ↓
StratOS Compiler + Rule Engine
   ↓
Model Gateway
   ↓
LLM
</code></pre>

<p>
  Best for:
</p>

<ul>
  <li>one-agent assistants</li>
  <li>domain copilots</li>
  <li>LLM apps with fragile prompt logic</li>
</ul>

<p>
  Main value:
</p>

<ul>
  <li>stop hardcoding strategy in prompts</li>
  <li>turn correction logic into reusable strategy assets</li>
  <li>gain rule execution traces and replayability</li>
</ul>

<h3>Path B — insert under an orchestrator</h3>

<p>
  This is the best fit for workflow-first systems.
</p>

<pre><code>Workflow / Orchestrator
   ↓
task selection
   ↓
StratOS
   ↓
Model Router / Gateway
   ↓
Model / Tools
</code></pre>

<p>
  Best for:
</p>

<ul>
  <li>LangGraph-style systems</li>
  <li>custom DAG / workflow runtimes</li>
  <li>multi-step task pipelines</li>
</ul>

<p>
  Main value:
</p>

<ul>
  <li>centralize strategy instead of scattering it across nodes</li>
  <li>apply different strategy bundles to different task types</li>
  <li>upgrade / downgrade model routes through routing policy</li>
</ul>

<h3>Path C — integrate only the review and evolution loop</h3>

<p>
  This path keeps your online runtime mostly unchanged.
</p>

<pre><code>Existing Production Output
        ↓
Structured Review
        ↓
Error Attribution
        ↓
Candidate STU
        ↓
Evaluation / Experiment
        ↓
Future Rollout
</code></pre>

<p>
  Best for:
</p>

<ul>
  <li>teams that want low-risk adoption</li>
  <li>systems that already work but do not learn systematically</li>
  <li>phased migration plans</li>
</ul>

<p>
  Main value:
</p>

<ul>
  <li>adopt the self-improvement loop first</li>
  <li>delay deep runtime integration</li>
  <li>validate whether STU-based strategy evolution is useful in your domain</li>
</ul>

<hr />

<h2 id="minimum-integration">Minimum integration</h2>

<p>
  You do <strong>not</strong> need the full StratOS stack on day one.
</p>

<p>
  The smallest useful integration is:
</p>

<ul>
  <li>a <strong>task context</strong></li>
  <li>an <strong>active STU loader</strong></li>
  <li>a <strong>Strategy Compiler</strong></li>
  <li>a <strong>Rule Execution Engine</strong></li>
  <li>a <strong>Model Gateway adapter</strong></li>
</ul>

<p>
  With only those five pieces, you already get:
</p>

<ul>
  <li>task-aware strategy injection</li>
  <li>structured rule enforcement</li>
  <li>routing control</li>
  <li>traceable execution effects</li>
</ul>

<hr />

<h2 id="runtime-contract">Runtime contract</h2>

<p>
  A clean integration depends on one contract:
</p>

<blockquote>
  <p>
    <strong>apps provide context; StratOS provides strategy execution.</strong>
  </p>
</blockquote>

<h3>Input contract</h3>

<p>
  Your app or orchestrator should provide a task-level context object.
</p>

<pre><code>{
  "task_type": "prediction_generation",
  "thesis_type": "valuation",
  "risk_level": "high",
  "ticker": "AAPL"
}
</code></pre>

<p>
  You can extend this shape for your own domain.
</p>

<p>
  For example:
</p>

<ul>
  <li><code>content_type</code></li>
  <li><code>campaign_goal</code></li>
  <li><code>lead_stage</code></li>
  <li><code>customer_segment</code></li>
</ul>

<h3>Strategy selection contract</h3>

<p>
  StratOS should load active strategy assets and filter them by task context.
</p>

<pre><code>active_stu
   ↓
strategy_filter(task_context)
   ↓
relevant_stu
</code></pre>

<p>
  This prevents irrelevant strategies from being injected into the wrong task.
</p>

<h3>Compiler contract</h3>

<p>
  Relevant STUs are compiled into three layers:
</p>

<pre><code>{
  "prompt_layer": [],
  "rule_layer": [],
  "routing_layer": {}
}
</code></pre>

<p>
  These layers must remain structurally separate.
</p>

<ul>
  <li><strong>Prompt Layer</strong> explains intent</li>
  <li><strong>Rule Layer</strong> enforces constraints</li>
  <li><strong>Routing Layer</strong> controls execution path</li>
</ul>

<h3>Execution contract</h3>

<p>
  Rules should execute in three stages:
</p>

<table>
  <tr>
    <th align="left">Stage</th>
    <th align="left">What happens</th>
  </tr>
  <tr>
    <td valign="top"><strong>Pre-generation</strong></td>
    <td valign="top">validate required inputs, evidence checks, caps, prerequisites</td>
  </tr>
  <tr>
    <td valign="top"><strong>In-generation</strong></td>
    <td valign="top">apply structured constraints to generation</td>
  </tr>
  <tr>
    <td valign="top"><strong>Post-generation</strong></td>
    <td valign="top">validate output, retry, downgrade, repair, or reject</td>
  </tr>
</table>

<h3>Logging contract</h3>

<p>
  Every strategy effect should be traceable.
</p>

<p>
  At minimum, log:
</p>

<ul>
  <li>which STUs were active</li>
  <li>which rules were applied</li>
  <li>what runtime effects were produced</li>
  <li>whether retry / reject / downgrade occurred</li>
</ul>

<hr />

<h2 id="a-minimal-request-path">A minimal request path</h2>

<pre><code>1. App creates task_context
2. StratOS loads active STUs
3. StratOS filters strategies for the task
4. Strategy Compiler produces:
   - prompt_layer
   - rule_layer
   - routing_layer
5. Rule Engine runs pre-generation rules
6. Model Gateway selects route
7. Model call executes with constraints
8. Rule Engine runs post-generation checks
9. App receives structured output + execution trace
</code></pre>

<p>
  This is the smallest end-to-end integration that still preserves the architecture.
</p>

<hr />

<h2 id="what-your-existing-system-should-keep-owning">What your existing system should keep owning</h2>

<p>
  StratOS works best when it does <strong>not</strong> swallow the whole app.
</p>

<p>
  Your existing system should usually continue owning:
</p>

<ul>
  <li>user-facing workflows</li>
  <li>UI and product surface</li>
  <li>domain APIs</li>
  <li>tool implementations</li>
  <li>memory store design</li>
  <li>business-side scheduling and triggers</li>
</ul>

<p>
  StratOS should own:
</p>

<ul>
  <li>strategy representation</li>
  <li>strategy filtering</li>
  <li>strategy compilation</li>
  <li>rule execution</li>
  <li>evaluation and experiment lifecycle</li>
  <li>behavioral correction traces</li>
</ul>

<hr />

<h2 id="how-to-map-your-domain">How to map your own domain</h2>

<p>
  The finance app is only a reference implementation.
</p>

<p>
  To adapt StratOS to your own domain, keep the core and swap the app-level context.
</p>

<table>
  <tr>
    <th align="left">Finance example</th>
    <th align="left">Equivalent in another domain</th>
  </tr>
  <tr>
    <td valign="top"><code>ticker</code></td>
    <td valign="top"><code>campaign_id</code> / <code>lead_id</code> / <code>content_topic</code></td>
  </tr>
  <tr>
    <td valign="top"><code>thesis_type</code></td>
    <td valign="top"><code>task_subtype</code> / <code>decision_mode</code></td>
  </tr>
  <tr>
    <td valign="top"><code>risk_level</code></td>
    <td valign="top"><code>priority</code> / <code>sensitivity</code></td>
  </tr>
  <tr>
    <td valign="top"><code>review</code></td>
    <td valign="top"><code>evaluation</code> / <code>QA</code> / <code>postmortem</code></td>
  </tr>
</table>

<p>
  The point is not to reuse finance concepts.
</p>

<p>
  The point is to reuse the <strong>strategy lifecycle</strong>.
</p>

<hr />

<h2 id="graduated-adoption">Graduated adoption</h2>

<p>
  The recommended migration path is:
</p>

<h3>Stage 1 — centralize strategy</h3>

<ul>
  <li>move correction logic out of prompts and business code</li>
  <li>define STUs</li>
  <li>compile them into prompt / rule / routing layers</li>
</ul>

<h3>Stage 2 — enforce strategy at runtime</h3>

<ul>
  <li>introduce Rule Execution Engine</li>
  <li>add pre / in / post validation</li>
  <li>start recording structured rule traces</li>
</ul>

<h3>Stage 3 — introduce review-driven evolution</h3>

<ul>
  <li>review outputs systematically</li>
  <li>extract error patterns</li>
  <li>produce candidate strategies</li>
</ul>

<h3>Stage 4 — introduce safe rollout</h3>

<ul>
  <li>evaluate candidates offline</li>
  <li>use shadow / canary / partial / full rollout modes</li>
  <li>keep or rollback based on observed behavior</li>
</ul>

<hr />

<h2 id="integration-checklist">Integration checklist</h2>

<ul>
  <li>define a task context schema</li>
  <li>load active STUs outside app business logic</li>
  <li>compile strategy into prompt / rule / routing layers</li>
  <li>execute rules locally, not only inside prompts</li>
  <li>route model calls through a controlled gateway</li>
  <li>record execution traces for replay and evaluation</li>
  <li>keep domain logic in <code>apps/</code> and core machinery in <code>packages/</code></li>
</ul>

<hr />

<h2 id="anti-patterns">Anti-patterns</h2>

<p>
  These are the most common bad integrations.
</p>

<h3>Bad integration 1 — using StratOS as prompt templates only</h3>

<p>
  If STUs are reduced to plain prompt text, you lose:
</p>

<ul>
  <li>rule executability</li>
  <li>routing control</li>
  <li>evaluation reuse</li>
  <li>safe replay and auditability</li>
</ul>

<h3>Bad integration 2 — bypassing the compiler</h3>

<p>
  If business code assembles strategy directly, the architecture collapses into ad hoc patches.
</p>

<h3>Bad integration 3 — scattering rule logic across apps</h3>

<p>
  If every app reimplements its own behavioral correction logic, the core stops being reusable.
</p>

<h3>Bad integration 4 — rolling out untested strategy changes</h3>

<p>
  If candidate strategies go directly into production, you lose controlled evolution.
</p>

<hr />

<h2 id="a-practical-example">A practical example</h2>

<p>
  Suppose you already have a content-generation agent.
</p>

<p>
  Without StratOS:
</p>

<ul>
  <li>prompt patches accumulate over time</li>
  <li>quality regressions are hard to explain</li>
  <li>corrections are not reusable across tasks</li>
</ul>

<p>
  With StratOS:
</p>

<ul>
  <li>you define strategy assets for tone, evidence, confidence, and routing</li>
  <li>you compile them per task</li>
  <li>you enforce output constraints through rules</li>
  <li>you review failures and turn them into candidate strategy improvements</li>
</ul>

<p>
  The agent stack stays familiar.
  What changes is that improvement becomes a system feature.
</p>

<hr />

<h2 id="non-goals-of-integration">Non-goals of integration</h2>

<ul>
  <li>you do not need to rewrite your whole agent framework</li>
  <li>you do not need to adopt every StratOS module at once</li>
  <li>you do not need to use finance concepts in non-finance apps</li>
  <li>you do not need model fine-tuning to benefit from StratOS</li>
</ul>

<hr />

<h2 id="guiding-principle">Guiding principle</h2>

<blockquote>
  <p>
    Integrate StratOS where your system needs judgment to become explicit,<br />
    correction to become executable,<br />
    and improvement to become reversible.
  </p>
</blockquote>

<hr />

<h2 id="next">Next</h2>

<p>
  Once integration is clear, the next useful docs are:
</p>

<ul>
  <li><strong>STU spec</strong> — how strategy assets are represented</li>
  <li><strong>Compiler spec</strong> — how Prompt / Rule / Routing layers are produced</li>
  <li><strong>Rule Engine spec</strong> — how runtime enforcement works</li>
  <li><strong>Evaluation spec</strong> — how strategy change is measured</li>
</ul>
