<p align="center">
  <img src="docs/assets/stratos-logo.svg" alt="StratOS" width="360" />
</p>

<p align="center">
  <strong>From tool-using agents to strategy-evolving systems.</strong>
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License" />
  </a>
  <a href="docs/architecture.md">
    <img src="https://img.shields.io/badge/Docs-Architecture-111827?style=for-the-badge" alt="Architecture" />
  </a>
  <a href="docs/integration.md">
    <img src="https://img.shields.io/badge/Docs-Integration-1f2937?style=for-the-badge" alt="Integration" />
  </a>
  <a href="apps/finance">
    <img src="https://img.shields.io/badge/App-Finance%20Reference-374151?style=for-the-badge" alt="Finance Reference" />
  </a>
</p>

<p align="center">
  <a href="docs/architecture.md">Architecture</a>
  ·
  <a href="docs/integration.md">Integration</a>
  ·
  <a href="apps/finance">Finance Reference</a>
  ·
  <a href="stu-packs">STU Packs</a>
  ·
  <a href="benchmarks">Benchmarks</a>
</p>

<p>
  <strong>StratOS</strong> is a <em>Strategy Operating System for Agents</em>.
</p>

<p>
  Most agent frameworks are built around <strong>skills</strong>, <strong>tools</strong>, and <strong>memory</strong>.
  StratOS is built for the missing layer:
</p>

<blockquote>
  <p><strong>Strategy — how an agent decides, learns from failure, and improves over time.</strong></p>
</blockquote>

<p>
  It does not replace your agent framework.
  It gives it a <strong>strategy runtime</strong>.
</p>

<hr />

<h2>Why StratOS exists</h2>

<p>
  Today, agents can act.
  But when they fail, improvement is still mostly manual:
</p>

<ul>
  <li>rewrite the prompt</li>
  <li>add another rule</li>
  <li>patch the workflow</li>
  <li>try again</li>
</ul>

<p>
  That does not scale.
</p>

<p>
  As agents become persistent, multi-step, and high-stakes, they need something stronger:
</p>

<blockquote>
  <p>
    a system that can <strong>observe failure, extract patterns, evolve strategy, and apply correction safely</strong>.
  </p>
</blockquote>

<p>
  StratOS exists to make that loop a first-class system.
</p>

<hr />

<h2>What StratOS makes possible</h2>

<p>
  StratOS turns this into runtime infrastructure:
</p>

<p>
  <strong>Action → Outcome → Review → Error → Strategy → Next Action</strong>
</p>

<p>
  It helps agents:
</p>

<ul>
  <li>generate structured decisions</li>
  <li>evaluate outcomes</li>
  <li>extract recurring error patterns</li>
  <li>convert lessons into reusable strategy units</li>
  <li>test changes before rollout</li>
  <li>improve behavior without losing control</li>
</ul>

<hr />

<h2>Core idea</h2>

<p>
  Most frameworks focus on <strong>capability</strong>.
  StratOS focuses on <strong>judgment</strong>.
</p>

<table>
  <tr>
    <td valign="top"><strong>Skills</strong></td>
    <td valign="top">What an agent can do</td>
  </tr>
  <tr>
    <td valign="top"><strong>Strategy</strong></td>
    <td valign="top">How an agent decides and improves</td>
  </tr>
</table>

<p>
  StratOS is not another tool layer.
  It is a <strong>strategy layer</strong> for intelligent systems.
</p>

<hr />

<h2>Core primitives</h2>

<ul>
  <li>
    <strong>Self-Training Units (STU)</strong><br />
    Versioned strategy units derived from failures, reviews, and behavioral patterns
  </li>
  <li>
    <strong>STU Registry</strong><br />
    Strategy loading, versioning, activation, and governance
  </li>
  <li>
    <strong>Strategy Compiler</strong><br />
    Compiles strategy into Prompt Layer, Rule Layer, and Routing Layer
  </li>
  <li>
    <strong>Rule Execution Engine</strong><br />
    Executes structured control logic before, during, and after generation
  </li>
  <li>
    <strong>Evaluation & Experiment System</strong><br />
    Tests strategy changes before production rollout
  </li>
  <li>
    <strong>Bias Monitoring</strong><br />
    Distinguishes real improvement from drift
  </li>
</ul>

<hr />

<h2>How it fits</h2>

<pre><code>Application Layer
 ├─ Finance Assistant
 ├─ Content Agent
 ├─ Ads Optimization
 ├─ Sales Agent
 └─ Ops Automation

StratOS Core
 ├─ STU Registry
 ├─ Strategy Compiler
 ├─ Rule Engine
 ├─ Evaluation
 ├─ Experiment
 ├─ Bias Monitor
 └─ Routing

Agent Layer
 ├─ LLM
 ├─ Skills / Tools
 └─ Memory

Infrastructure
 ├─ Model Gateway
 ├─ Storage
 ├─ Queue
 └─ Config
</code></pre>

<p>
  StratOS does not replace your orchestration layer.
  It gives your system a <strong>strategy runtime</strong>.
</p>

<hr />

<h2>First proving ground: Finance</h2>

<p>
  The first implementation of StratOS is a finance reasoning system with:
</p>

<ul>
  <li>portfolio tracking</li>
  <li>prediction generation</li>
  <li>timed review</li>
  <li>error extraction</li>
  <li>strategy evolution</li>
  <li>bias monitoring</li>
</ul>

<p>
  Finance is the first reference implementation — not the limit of the framework.
</p>

<hr />

<h2>Open source philosophy</h2>

<blockquote>
  <p><strong>Private-instance evolution, open structural collaboration</strong></p>
</blockquote>

<ul>
  <li>run your own instance</li>
  <li>keep your own data and API keys</li>
  <li>share schemas, rules, STUs, and benchmarks with the community</li>
</ul>

<p>
  StratOS is designed so that strategic structure can be shared
  without centralizing private operational data.
</p>

<hr />

<h2>Repository structure</h2>

<ul>
  <li><code>apps/</code> — domain implementations</li>
  <li><code>packages/</code> — StratOS core</li>
  <li><code>stu-packs/</code> — reusable strategy assets</li>
  <li><code>benchmarks/</code> — evaluation datasets</li>
</ul>

<hr />

<h2>Guiding principle</h2>

<blockquote>
  <p>
    Agents should not only act.<br />
    They should improve how they act.
  </p>
</blockquote>
