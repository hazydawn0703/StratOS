# StratOS Framework PRD

## 0. 文档定位

本文档定义 **StratOS Framework** 本身，作为框架开发、架构校对、实现验收与后续多场景接入的统一依据。

StratOS 不是某个具体业务系统，也不是某个垂直领域的应用产品。它是一个面向**策略型 Agent** 的 **Strategy Runtime + Self-Training Loop Framework**，用于支持策略生成、约束执行、结果复盘、错误利用、离线评估、线上实验与持续优化。

本文档的目标不是描述 finance、content、ads、sales、ops 等任一具体场景，而是抽象出这些场景共同依赖的框架能力，使其能够共享统一的策略基础设施。

### 0.1 文档适用范围

本文档适用于以下对象：

- StratOS monorepo 中 `packages/*` 的框架开发
- 各场景 `apps/*` 的接入规范与边界约束
- AI IDE / Codex / ChatGPT 等代码生成系统的实现校对指南
- 框架后续架构评审、版本升级与能力扩展

### 0.2 本文档不覆盖的内容

以下内容不属于本文档范围：

- 具体业务场景的领域对象与页面设计
- 具体业务场景的数据源接入与指标定义
- 某个应用的产品 UI/UX 方案
- 某个行业专属的 review 标准
- 底座模型参数训练、LoRA 训练或预训练过程

### 0.3 与应用层文档的关系

StratOS Framework PRD 是框架层真源文档。

所有 `apps/*` 文档均只能：

- 补充具体领域实现
- 约束具体业务对象
- 扩展具体任务流程
- 定义具体领域验收标准

不得在应用层文档中重新定义框架核心对象、框架生命周期、框架运行时管线或框架版本语义。

若应用层文档与本框架 PRD 存在冲突，以本文件为准。

---

## 1. 背景与问题定义

### 1.1 当前 Agent 系统的共同缺陷

无论是单 Agent 还是多 Agent 系统，只要其中存在“负责产出策略”的节点，通常都会面对以下问题：

1. Agent 会生成内容，但不会系统性利用历史错误
2. Agent 会积累经验，但经验通常以自然语言散落在 prompt、日志或人工总结中，无法稳定复用
3. Agent 会随着场景演进不断增加规则，但规则缺乏版本化、评估与回滚机制
4. Agent 的行为变化通常直接体现在 prompt 修改中，难以区分“优化”与“漂移”
5. Agent 产出是否真正改善，往往缺乏离线评估与线上实验闭环
6. 同一类策略经验难以跨任务、跨应用、跨实例共享

### 1.2 核心矛盾

当前多数 Agent 框架更关注：

- Tool use
- Workflow orchestration
- Memory
- Planning
- Context management

但真正决定一个 Agent 能否长期变强的，往往不是它“会不会调用工具”，而是它能否：

- 把重要判断结构化
- 把结果拿回来复盘
- 把错误沉淀成可执行的策略单元
- 在不破坏生产稳定性的前提下持续试错与进化

### 1.3 StratOS 的定位

StratOS 不替代 Agent Framework。

StratOS 为 Agent Framework 提供的是：

> 一个可运行、可复盘、可评估、可实验、可演化的策略运行时。

它重点解决的是：

- 策略如何被表达
- 策略如何被注入
- 策略如何被执行
- 策略如何被评估
- 策略如何从错误中自我演化

---

## 2. 产品目标

### 2.1 核心目标

StratOS Framework 的核心目标如下：

1. 为策略型 Agent 提供统一的策略运行时
2. 让关键输出具备结构化、可验证、可复盘能力
3. 让历史错误能进入可追踪、可复用的优化管线
4. 让策略变更具备评估、实验、发布与回滚机制
5. 让不同应用共享同一套策略基础设施
6. 让私有实例可以在不共享私有业务数据的前提下共享结构化策略资产

### 2.2 设计原则

#### 原则一：应用与框架彻底分层
框架只定义通用能力与协议，不定义业务对象。

#### 原则二：所有重要策略输出都应尽量结构化
不能被提取、追踪、验证的输出，无法进入自我训练闭环。

#### 原则三：错误不是日志噪声，而是训练资产
错误必须被识别、分类、利用，而不是仅被记录。

#### 原则四：新策略必须先评估，再实验，后激活
不允许“改了 prompt 就直接上线”成为默认工作流。

#### 原则五：框架默认优化的是策略层，而不是参数层
StratOS 的第一性原理是策略自训练，不是底模重训练。

#### 原则六：支持私有实例演化，支持开放结构协作
私有数据与 API Key 保持本地，结构化策略资产可共享。

### 2.3 非目标

StratOS 当前不以以下目标为直接建设对象：

- 通用机器人控制系统
- 通用工具调用框架
- 通用长期记忆系统
- UI 低代码平台
- 业务分析中台
- 模型训练平台

---

## 3. 适用对象与边界

### 3.1 适用对象

StratOS 适用于所有会产出**策略性内容**的 Agent 或 Agent Node，包括但不限于：

- 判断型 Agent
- 规划型 Agent
- 调度型 Agent
- 审核型 Agent
- 包装编排型 Agent
- 策略研究型 Agent
- 任务分配型 Agent
- 纠偏型 Agent

### 3.2 不适用对象

以下类型节点通常不需要直接接入 StratOS：

- 纯执行节点
- 纯工具调用节点
- 纯数据搬运节点
- 纯协议转换节点
- 无策略产出、无判断链路的机械型节点

### 3.3 多 Agent 系统中的定位

StratOS 不要求自己接管整个多 Agent 协作系统。

在多 Agent 系统中：

- 纯执行型 Agent 可以不接入 StratOS
- 负责产出策略内容的节点应接入 StratOS
- 调度员 Agent 若负责任务分配策略，也可接入 StratOS
- 协作层可继续由现有 Agent Framework 管理
- StratOS 只负责策略节点的运行时与自我训练闭环

也就是说，StratOS 优化的是“会产出策略的单点”，而不是替代多 Agent 系统本身。

---

## 4. 系统定义

### 4.1 一句话定义

StratOS 是一个面向策略型 Agent 的策略运行时与自我训练闭环框架。

### 4.2 系统本质

StratOS 的本质可以抽象为六层：

1. **Strategy Artifact Generation Layer**  
   生成结构化策略产物
2. **Structured Claim Extraction Layer**  
   从产物中提取可追踪主张
3. **Outcome Review Layer**  
   在结果出现后对历史主张进行复核
4. **Error Utilization Layer**  
   从 review 中发现错误模式并形成可利用资产
5. **Self-Training Layer**  
   将错误模式提炼为策略单元并受控注入未来运行
6. **Experimentation Layer**  
   对新策略进行离线评估、线上实验与发布回滚

### 4.3 核心闭环

StratOS 的标准闭环为：

**Action → Artifact → Claim → Outcome → Review → Error Pattern → STU → Compile → Next Action**

其中：

- Action：某次任务执行
- Artifact：本次执行生成的结构化策略产物
- Claim：从产物中提取出的关键主张
- Outcome：后续真实结果或反馈
- Review：对历史主张的结果复核
- Error Pattern：可重复归类的错误模式
- STU：由错误模式提炼出的策略单元
- Compile：将 STU 编译进入未来运行时
- Next Action：新一轮任务执行

---

## 5. 框架能力边界

### 5.1 StratOS 负责什么

StratOS 负责以下能力：

- 定义通用策略对象
- 管理策略单元生命周期
- 管理策略注入与执行
- 支撑 review 与错误利用
- 支撑离线评估与线上实验
- 支撑策略资产版本化
- 支撑策略回放与审计
- 支撑多模型、多 Provider 路由
- 支撑应用层接入统一框架协议

### 5.2 StratOS 不负责什么

StratOS 不负责以下内容：

- 定义应用层具体业务对象
- 实现具体应用页面
- 替业务决定什么指标代表成功
- 管理所有 Agent 的调度逻辑
- 定义某个行业的知识库结构
- 直接替代数据库、中间件、消息队列等基础设施

---

## 6. 核心概念与对象模型

框架层必须使用通用对象名，不允许使用 finance、ads、content 等领域词汇替代框架核心概念。

### 6.1 TaskContext

表示某次任务运行时的上下文。

包含但不限于：

- task_id
- task_type
- app_id
- actor_id
- input_payload
- runtime_env
- historical_context
- enabled_features
- evaluation_mode
- experiment_bucket

### 6.2 StrategyArtifact

表示某次任务生成的人类可读 + 机器可读策略产物。

它不是单纯文本，而是带有结构边界的中间对象。不同应用可映射为报告、方案、决策草案、脚本规划、审核意见、分配方案等。

要求：

- 必须有 schema
- 必须有生成时间与生成来源
- 必须可回放
- 必须能被后续 claim extractor 消费

### 6.3 StrategyClaim

表示从 StrategyArtifact 中提取出来的、可追踪、可验证或可复核的关键主张单元。

一个 Artifact 可以对应多个 Claim。

Claim 的价值在于：

- 将“模糊输出”切分成“可复核单元”
- 让未来 review 有明确对象
- 让策略效果能够部分量化

Claim 可表现为：

- 预测性主张
- 判断性主张
- 风险性主张
- 优先级主张
- 路由性主张
- 约束性主张

### 6.4 OutcomeRecord

表示在一段时间后回收的真实结果、反馈或外部观测事实。

OutcomeRecord 可能来自：

- 应用业务系统
- 外部 API
- 人工标注
- 用户反馈
- 观察任务
- 自动采集任务

### 6.5 OutcomeReview

表示系统对历史 Claim 的复核结果。

Review 至少包含：

- 复核对象
- 复核时点
- 结果判断
- 误差描述
- 归因说明
- 是否形成错误模式候选

### 6.6 ErrorPattern

表示从多个 Review 中提炼出的可重复、可命名、可归类的错误模式。

ErrorPattern 不是单次失败原因，而是能够跨样本复现的稳定模式。

它应支持：

- taxonomy 分类
- 严重度
- 频率统计
- 触发上下文
- 证据样本
- 可修正方向

### 6.7 STU

STU（Self-Training Unit）是 StratOS 的核心策略资产。

它是由历史错误模式、行为偏差、评估发现或人工经验沉淀出来的、可注入运行时的结构化行为控制单元。

STU 必须满足：

- 结构化
- 可版本化
- 可评估
- 可实验
- 可回滚
- 可组合
- 可作用于未来任务

### 6.8 EvaluationSet

表示用于离线评估某个 STU、规则集、编译策略或模型路由策略的标准样本集。

### 6.9 StrategyExperiment

表示新策略在真实运行环境中的实验记录。

### 6.10 RoutingPolicy

表示模型、规则、执行链路或审核路径的选择策略。

---

## 7. Self-Training 的定义边界

### 7.1 Self-Training 是什么

在 StratOS 中，Self-Training 指的是：

> 系统基于历史运行结果与错误模式，对未来行为策略进行结构化优化与受控注入的过程。

### 7.2 Self-Training 不是什么

Self-Training 不等于：

- 底模参数训练
- 自动改代码后直接上线
- 通过长 prompt 无限堆规则
- 只做日志总结不进入执行链路
- 单次人工经验记录

### 7.3 当前阶段的默认边界

在现阶段，StratOS 默认只优化：

- Prompt Layer
- Rule Layer
- Routing Layer

不将参数训练作为框架默认能力。

未来若需要引入参数级训练能力，也必须作为独立可选扩展层，而不是污染当前核心运行时。

---

## 8. STU 设计

### 8.1 STU 的作用

STU 用于承载策略经验，而不是承载原始事实。

它回答的问题不是“世界上发生了什么”，而是：

- 遇到什么模式时应更谨慎
- 某类任务应优先考虑哪些结构
- 某种错误应如何规避
- 某种判断应满足哪些前置约束
- 哪些场景应切换模型、提升审核或禁止输出

### 8.2 STU 的分层

STU 可以作用于三层：

#### 8.2.1 Prompt Layer
通过结构化 prompt 注入行为指导、审查清单、注意事项与推理约束。

#### 8.2.2 Rule Layer
通过显式规则约束输入、输出、校验、拒绝、补充和后处理。

#### 8.2.3 Routing Layer
通过路由规则改变模型选择、链路选择、是否复核、是否升级审核等运行路径。

### 8.3 STU 的来源

STU 可以来自：

- 自动错误提炼
- 离线评估发现
- 实验结果归纳
- 人工专家输入
- 社区共享资产

### 8.4 STU 的最小字段建议

```json
{
  "stu_id": "stu_xxx",
  "name": "Avoid vague claims under uncertain evidence",
  "version": "1.0.0",
  "status": "candidate",
  "scope": {
    "apps": ["*"],
    "task_types": ["analysis", "planning"],
    "artifact_types": ["strategy_artifact"]
  },
  "source": {
    "type": "error_pattern",
    "ref_ids": ["ep_001"]
  },
  "objective": "Reduce unsupported high-confidence claims",
  "prompt_layer": {
    "instructions": [
      "When evidence is incomplete, explicitly mark uncertainty.",
      "Do not present assumptions as facts."
    ]
  },
  "rule_layer": {
    "pre_conditions": [],
    "output_checks": [
      {
        "type": "unsupported_claim_check",
        "severity": "high"
      }
    ]
  },
  "routing_layer": {
    "escalate_review_when": [
      "high_impact_task == true"
    ]
  },
  "evaluation": {
    "baseline_version": "none",
    "target_metrics": [
      "unsupported_claim_rate",
      "calibration_score"
    ]
  },
  "rollout": {
    "mode": "candidate_only"
  }
}
```

### 8.5 STU 生命周期

STU 必须具备受控生命周期：

- `draft`：草稿态，尚未进入评估
- `candidate`：候选态，可被评估系统消费
- `evaluating`：离线评估中
- `experimenting`：线上实验中
- `active`：已激活，进入生产编译链路
- `deprecated`：废弃，不再用于新任务
- `archived`：归档，仅供审计与回放

### 8.6 STU 版本语义

STU 必须使用版本号。

要求：

- 不得覆盖旧版本
- 不得用同一版本号表达不同内容
- 实验必须绑定具体版本
- 回放必须能还原到具体版本
- 跨实例共享时必须保留原始版本信息

建议使用 semver：

- major：策略语义发生重大变化
- minor：增强但兼容
- patch：小修正、描述修复、非行为性优化

---

## 9. STU Registry

### 9.1 定义

STU Registry 是 StratOS 的策略资产注册中心，负责 STU 的注册、索引、版本管理、状态管理、加载与分发。

### 9.2 核心职责

- 注册 STU
- 存储 STU 元数据与正文
- 查询适用 STU
- 管理版本与状态
- 管理激活与停用
- 检测冲突与重复作用域
- 支持导入与导出
- 供 Strategy Compiler 拉取编译输入

### 9.3 最低能力要求

Registry 至少要支持：

- 按 app 过滤
- 按 task_type 过滤
- 按 artifact_type 过滤
- 按状态过滤
- 按版本过滤
- 按标签过滤
- 冲突提醒
- 引用关系追踪

### 9.4 冲突规则

当多个 STU 同时作用于相同范围时，Registry 或 Compiler 至少需要能识别以下冲突：

- 指令冲突
- 规则冲突
- 路由冲突
- 优先级冲突
- 重复约束

---

## 10. Strategy Compiler

### 10.1 定义

Strategy Compiler 负责将当前任务上下文与适用 STU 编译为可执行运行时上下文。

它不是简单拼 prompt，而是将：

- TaskContext
- Active STUs
- Candidate STUs（在特定模式下）
- Feature Flags
- Experiment Assignments
- RoutingPolicy
- App-level adapters

编译成最终运行时策略包。

### 10.2 输入

Compiler 的输入包括但不限于：

- task context
- app config
- active STUs
- experiment bucket
- routing defaults
- feature flags
- environment info

### 10.3 输出

Compiler 的输出建议为统一的 `CompiledStrategyContext`：

- compiled prompt directives
- compiled rule directives
- compiled routing directives
- runtime metadata
- audit metadata

### 10.4 核心职责

- 识别适用策略范围
- 合并多个 STU
- 处理冲突与优先级
- 生成统一运行时上下文
- 写入审计元数据
- 支持回放还原

### 10.5 合并策略建议

建议优先级顺序：

1. 系统硬约束
2. 安全规则
3. app-level 强制规则
4. active STU
5. experiment STU
6. candidate STU（仅非生产或评估模式）
7. 默认行为模板

---

## 11. Rule Execution Engine

### 11.1 定义

Rule Execution Engine 用于执行规则层策略，使 STU 不仅停留在 prompt 建议，而能以显式规则方式干预运行。

### 11.2 执行阶段

规则至少应支持以下阶段：

#### 11.2.1 Pre-Generation
在模型生成前对输入进行校验、补充、拒绝或改写。

#### 11.2.2 In-Generation
在生成过程中进行流式检查、中断、重采样、追加约束或切换模型。

#### 11.2.3 Post-Generation
对生成结果进行校验、修正、标注、拒绝、要求重试或进入二次审核。

#### 11.2.4 Post-Review
在 review 完成后触发统计、标签、错误模式候选归档等动作。

### 11.3 规则类型建议

- input validator
- output validator
- unsupported claim detector
- ambiguity detector
- calibration checker
- evidence completeness checker
- route escalator
- fallback trigger
- hard reject rule
- human review trigger

### 11.4 设计要求

Rule Engine 必须满足：

- 可追踪执行日志
- 可配置严重度
- 可区分 hard / soft rule
- 可独立测试
- 可回放
- 可被 app 扩展，但不能被 app 绕过

---

## 12. Strategy Artifact 与 Claim 管线

### 12.1 为什么必须有 Artifact 层

很多系统直接把“最终自然语言输出”当成一切，但这会导致：

- 无法稳定提取关键主张
- 无法形成统一 review 协议
- 无法跨任务比较
- 无法建立可复用评估集

因此 StratOS 必须要求策略型任务先生成结构化 Artifact，再从中提取 Claim。

### 12.2 Artifact 设计要求

- 结构必须可解析
- 必须有明确 schema 版本
- 必须带运行时上下文引用
- 必须可回放与审计
- 必须支持应用层扩展字段

### 12.3 Claim 提取要求

Claim Extractor 可以由规则、模型或混合策略实现，但必须做到：

- 输出稳定 schema
- 保留 claim 与 artifact 的映射关系
- 保留 claim 的证据来源字段
- 保留 claim 的可验证窗口信息

### 12.4 Claim 最小字段建议

```json
{
  "claim_id": "claim_xxx",
  "artifact_id": "artifact_xxx",
  "claim_type": "risk_judgment",
  "statement": "The current plan lacks sufficient evidence for launch.",
  "confidence": 0.62,
  "verifiability": "reviewable",
  "review_due_at": "2026-03-30T10:00:00Z",
  "evidence_refs": ["section_2", "source_4"],
  "tags": ["high_impact", "needs_followup"]
}
```

---

## 13. Outcome Review Engine

### 13.1 定义

Outcome Review Engine 负责在适当时点，对历史 Claim 与对应 OutcomeRecord 进行复核，判断历史策略输出是否成立、是否偏差、是否存在系统性错误。

### 13.2 Review 的价值

Review 是 StratOS 自我训练的中轴。

没有 Review，就没有：

- 错误发现
- 误差归因
- 偏差监控
- STU 形成
- 策略真优化

### 13.3 Review 输入

- claim
- artifact
- runtime metadata
- actual outcome
- external evidence
- human annotation（可选）

### 13.4 Review 输出

Review 输出至少应包含：

- review_id
- review_target
- result_label
- error_summary
- attribution
- severity
- error_pattern_candidate
- reviewer_type
- review_timestamp

### 13.5 Review 类型

- 自动复核
- 人工复核
- 混合复核
- 延时复核
- 批量回溯复核

---

## 14. Error Utilization Engine

### 14.1 定义

Error Utilization Engine 负责将分散的 Review 结果转化为可利用的结构化优化资产。

### 14.2 关键职责

- 识别高频错误
- 聚类相似错误
- 形成错误 taxonomy
- 输出错误证据包
- 生成 STU 候选
- 为人工审核提供聚合视图

### 14.3 为什么不能停留在“失败日志”

如果系统只有失败日志，而没有 ErrorPattern：

- 无法区分偶发错误和系统性错误
- 无法形成可复用优化资产
- 无法稳定驱动 STU 生成
- 无法横向比较不同策略的改进效果

### 14.4 ErrorPattern 生命周期建议

- observed
- clustered
- named
- validated
- promoted_to_stu_candidate
- archived

---

## 15. Evaluation Engine

### 15.1 定义

Evaluation Engine 负责在离线环境中评估 STU、Compiler 策略、Rule 规则、RoutingPolicy 或模型选择策略的效果，为是否上线实验提供依据。

### 15.2 为什么必须先离线评估

新策略若不经离线评估直接进入生产，会带来两个问题：

1. 真实效果未知
2. 一旦退化，难以定位原因是模型波动、规则冲突还是策略本身失效

### 15.3 评估对象

- 单个 STU
- STU 组合
- Rule set
- Compiler merge strategy
- Routing policy
- Model choice
- App adapter strategy

### 15.4 评估指标建议

框架层不绑定具体业务指标，但要求支持以下通用指标类别：

- correctness
- verifiability
- calibration
- ambiguity penalty
- unsupported claim rate
- overconfidence rate
- error recurrence rate
- structured completeness
- review alignment
- cost / latency impact

### 15.5 评估结果

评估结果至少应输出：

- baseline version
- candidate version
- metric deltas
- risk notes
- sample failures
- promote recommendation

---

## 16. Experiment Engine

### 16.1 定义

Experiment Engine 负责把通过离线评估的策略候选受控地带入真实运行环境，并追踪其线上表现。

### 16.2 实验模式

建议支持以下模式：

- shadow：只运行不生效
- canary：小流量生效
- partial：部分任务类型生效
- cohort：特定人群/桶生效
- full：全量启用

### 16.3 核心能力

- 实验分桶
- 版本绑定
- 指标观测
- 回滚条件
- 晋升条件
- 实验报告输出

### 16.4 晋升路径

建议统一晋升路径：

`candidate -> evaluated -> experimenting -> active`

不允许跳过评估与实验直接激活，除非处于人工强制模式并留有审计记录。

### 16.5 晋升协议与策略绑定

StratOS Framework 定义 STU 的晋升协议，但不在框架层预设具体应用场景下的晋升阈值、样本门槛、观察窗口或业务成功指标。

框架层负责统一 STU 从 `candidate` 到 `evaluated`、`experimenting`、`active` 的生命周期流转，统一评估结果、实验结果、晋升决策、审计记录与回滚机制；  
具体某个 STU 何时可以进入 `active`，应由应用层通过 `PromotionPolicy` 或等价配置决定。

#### 16.5.1 框架层职责

框架层应提供以下能力：

- 统一的晋升状态流转
- 统一的 `EvaluationResult` / `ExperimentResult` 结果结构
- 统一的 `PromotionDecision` 决策输出
- 统一的审计记录格式
- 统一的版本绑定与回滚入口

Framework 定义的是晋升协议，而不是晋升阈值。

#### 16.5.2 应用层职责

每个应用应根据自身任务类型、产物类型与目标场景定义可执行的 `PromotionPolicy`。

该策略应至少说明：

- 适用范围
- baseline 选择方式
- 观测指标集合
- 最小样本要求
- 最小观察窗口
- 实验阶段要求
- 晋升条件
- 持续观察条件
- 回滚条件
- 是否需要人工审批

未提供 `PromotionPolicy` 的 STU，不应被自动提升为 `active`。

#### 16.5.3 策略生成与使用原则

`PromotionPolicy` 可以由用户手动配置，也可以由系统基于历史数据生成候选版本。  
但凡进入生产判断的策略，必须可查看、可持久化、可审计、可版本化、可回放。

系统可以建议晋升规则，但不应在不可审计的情况下隐式修改晋升标准。

#### 16.5.4 晋升决策输出

每次晋升判断都应输出标准化 `PromotionDecision`，建议至少包含：

- `promote`
- `hold`
- `rollback`
- `deprecate`
- `manual_review`

其中，`promote` 表示允许进入 `active`，`hold` 表示继续观察，`rollback` 表示回退至稳定版本，`deprecate` 表示停止推进，`manual_review` 表示转入人工判断。

#### 16.5.5 自动晋升前提

框架允许自动晋升，但自动晋升必须满足以下条件：

- 存在有效的 `PromotionPolicy`
- 存在明确的 baseline 对照
- 存在完整的 `EvaluationResult` 与 `ExperimentResult`
- 存在可追溯的版本绑定
- 存在可执行的回滚路径
- 不违反应用层定义的审批要求

任一条件不满足时，系统不应自动将 STU 置为 `active`。

#### 16.5.6 审计要求

每次晋升、继续观察、回滚、废弃或人工介入，都应留下可追踪的审计记录。  
审计记录至少应包含 STU 版本、baseline 版本、实验信息、所用策略版本、决策结果、决策依据摘要、风险说明、决策时间与决策来源。

#### 16.5.7 边界说明

该机制的目的不是在框架层统一所有应用的通过标准，而是在统一生命周期与决策协议的前提下，将具体指标定义与阈值设定留给应用层。

也就是说：

- Framework 统一晋升机制
- App 定义晋升标准
- STU 的激活过程必须可控、可解释、可回放

### 16.6 Required App Policies

StratOS Framework 定义各类运行策略的协议与消费入口，但不在框架层预设具体应用场景下的阈值、样本门槛、观察窗口、审批规则或业务成功指标。

框架层负责统一 Policy 的协议结构、消费位置、结果结构与阻断机制；  
具体哪些对象可进入闭环、何时触发 review、何时允许生成 STU candidate、何时通过 evaluation、何时晋升为 active、何时升级路由、何时触发 bias 告警，应由应用层通过 App Policies 或等价配置决定。

除非应用层已提供对应 Policy，否则相关自动化能力不得默认启用。

#### 16.6.1 ClaimAdmissionPolicy

`ClaimAdmissionPolicy` 用于定义某一应用中，哪些 `StrategyArtifact` 输出可以被提取为 `StrategyClaim`，以及哪些 Claim 允许进入后续 review、evaluation 与 promotion 管线。

框架层负责：

- 统一 Claim admission 协议
- 统一 Claim 可验证性分级结构
- 统一 Claim admission 校验入口
- 统一 admission 失败阻断机制

应用层应至少说明：

- 可进入 Claim 提取的 `artifact_type`
- 可接纳的 `claim_type`
- 最低结构完整性要求
- 最低证据要求
- 可验证性分级标准
- 默认 `review_due_at` 计算规则
- 排除规则
- 高影响 Claim 的额外 admission 条件

未通过 `ClaimAdmissionPolicy` 校验的输出，不得进入正式 Claim 闭环。

#### 16.6.2 ReviewTriggerPolicy

`ReviewTriggerPolicy` 用于定义某一应用中，何种 Claim 需要被复核、在何时复核、由何种方式复核，以及何种结果可视为 review 完成。

框架层负责：

- 统一 review trigger 协议
- 统一 `OutcomeReview` 结果结构
- 统一 review 状态机
- 统一 review 缺失阻断机制

应用层应至少说明：

- 各类 Claim 的默认 review 触发时点
- 最晚 review 截止时点
- 自动复核 / 人工复核 / 混合复核的适用条件
- 高影响 Claim 是否必须双重复核
- `inconclusive` / `expired` / `skipped` 判定规则
- review 完成条件
- review 缺失时对 evaluation / promotion 的阻断规则

未满足 `ReviewTriggerPolicy` 的 Claim，不得计入正式 review 结果。

#### 16.6.3 ErrorPatternPromotionPolicy

`ErrorPatternPromotionPolicy` 用于定义某一应用中，何种 `ErrorPattern` 具备被提升为 `STU candidate` 的资格。

框架层负责：

- 统一 ErrorPattern 晋升协议
- 统一 `STU candidate` 输出结构
- 统一样本聚合与去重入口
- 统一晋升阻断机制

应用层应至少说明：

- 最低出现频次
- 最低严重度要求
- 最少覆盖的任务数 / Claim 数 / Review 数
- 是否要求跨时间窗口复现
- 是否要求跨任务类型或跨输入分布复现
- 去重规则
- 自动晋升条件
- 必须人工确认的条件
- 不得晋升的排除规则

未达到 `ErrorPatternPromotionPolicy` 门槛的错误模式，不得自动生成正式 `STU candidate`。

#### 16.6.4 EvaluationPolicy

`EvaluationPolicy` 用于定义某一应用中，候选策略、候选 STU、规则集或路由策略在离线评估阶段的通过标准、失败标准与人工复审条件。

框架层负责：

- 统一 evaluation 协议
- 统一 `EvaluationResult` 结果结构
- 统一 baseline / candidate 绑定方式
- 统一 evaluation 失败阻断机制

应用层应至少说明：

- 评估对象类型
- baseline 选择规则
- 必测指标集合
- hard gate / soft gate 分类
- 指标权重与综合评分规则
- 最低样本量要求
- 最低覆盖范围要求
- 必须优于 baseline 的关键指标
- 允许持平或轻微退化的非关键指标
- 通过 / 失败 / 待人工复审的判定规则
- 评估结果有效期

未通过 `EvaluationPolicy` 的 candidate，不得进入 experiment。

#### 16.6.5 PromotionPolicy

`PromotionPolicy` 用于定义某一应用中，`STU candidate` 在经过 evaluation 与 experiment 后，何时可以晋升为 `active`，以及何种条件下必须回滚、降级或继续观察。

框架层负责：

- 统一晋升状态流转
- 统一 `PromotionDecision` 决策输出
- 统一审计记录格式
- 统一版本绑定与回滚入口

应用层应至少说明：

- 适用范围
- baseline 选择方式
- 观测指标集合
- 最小样本要求
- 最小观察窗口
- 实验阶段要求
- 晋升条件
- 持续观察条件
- 回滚条件
- 是否需要人工审批

未满足 `PromotionPolicy` 的 candidate，不得被标记为 `active`。

#### 16.6.6 RoutingDecisionPolicy

`RoutingDecisionPolicy` 用于定义某一应用中，任务在何种条件下切换模型、切换执行链路、升级为双重审核、进入人工审核或降级为保守模式。

框架层负责：

- 统一 routing decision 协议
- 统一 `RoutingDecision` 输出结构
- 统一 route fallback 入口
- 统一高风险任务阻断机制

应用层应至少说明：

- 不同 `task_type` 的默认路由
- 高影响任务识别规则
- uncertainty 升级阈值
- 触发 reviewer model 的条件
- 触发 dual review 的条件
- 进入人工审核的条件
- 成本 / 时延约束下的降级规则
- 高风险任务禁止使用的模型或链路
- STU / Rule 命中后的路由修正规则
- 路由失败后的 fallback 顺序

未定义 `RoutingDecisionPolicy` 的高影响任务，不得启用自动动态路由。

#### 16.6.7 BiasAlertPolicy

`BiasAlertPolicy` 用于定义某一应用中，何种行为信号与结果信号的组合可被识别为偏差风险、告警事件或人工审查事件。

框架层负责：

- 统一 bias alert 协议
- 统一偏差事件结构
- 统一告警分级入口
- 统一 bias 到 review / candidate 输入池的转接入口

应用层应至少说明：

- 需要监控的行为信号集合
- 需要监控的结果信号集合
- 统计窗口与观察粒度
- 普通漂移 / 预警 / 正式告警的分级标准
- 必须进入人工分析的条件
- 可进入 ErrorPattern / STU candidate 输入池的条件
- 告警抑制、去重与降噪规则
- 连续告警后的治理动作建议

当前版本中，`BiasAlertPolicy` 只驱动监控、告警、审查与候选输入，不得直接绕过 evaluation / promotion 管线修改 active 策略。

#### 16.6.8 Policy Registration and Enforcement

所有 `apps/*` 实现应通过统一配置入口注册其 App Policies。

框架层应能在运行时检查当前应用是否已提供必需 Policy，并在缺失时执行以下约束：

- 缺失 `ClaimAdmissionPolicy`：不得建立正式 Claim 闭环
- 缺失 `ReviewTriggerPolicy`：不得启用正式自动 review
- 缺失 `ErrorPatternPromotionPolicy`：不得自动生成 STU candidate
- 缺失 `EvaluationPolicy`：不得执行正式离线评估
- 缺失 `PromotionPolicy`：不得将任何 candidate 标记为 `active`
- 缺失 `RoutingDecisionPolicy`：高影响任务不得启用自动动态路由
- 缺失 `BiasAlertPolicy`：可禁用偏差告警，但不得宣称已具备偏差治理能力

应用层不得通过修改框架核心逻辑绕过上述约束。

#### 16.6.9 Implementation Constraint

App Policies 的作用是将应用层标准参数化，而不是将框架核心逻辑业务化。

实现上应满足以下约束：

- Policy 由应用层声明，不由框架硬编码业务阈值
- Policy 可版本化、可审计、可回放
- Policy 修改应可追踪其生效范围与影响窗口
- Policy 不得绕过 `candidate -> evaluation -> experiment -> active / rollback` 的标准路径
- 所有与 active 状态相关的判定，最终都必须回收到可执行 Policy，而不是自然语言备注

---

## 17. Bias Monitoring

### 17.1 定义

Bias Monitoring 用于监控系统在策略输出与结果表现之间是否存在持续性偏差。

在 StratOS 中，Bias 不是单纯“说错了”，而是：

> 行为模式与结果模式长期耦合后形成的方向性偏差

### 17.2 监控对象

可从两类信号联合观察：

#### 17.2.1 行为信号
- 置信度分布
- 拒绝率
- 升级审核率
- 风险提示率
- 某类 claim 输出倾向
- 某类模型或链路使用倾向

#### 17.2.2 结果信号
- 复核通过率
- 误差方向
- 严重错误占比
- 回滚率
- 高影响任务失败率

### 17.3 当前阶段边界

Bias Monitoring 当前阶段以“监控与告警”为主。

它可以：

- 发现漂移
- 标记风险
- 为 STU 候选生成提供输入

但不应在当前版本中直接自动修改生产策略，避免系统在不透明条件下发生自激进化。

---

## 18. Model Gateway 与 Model Router

### 18.1 Model Gateway

Model Gateway 是模型调用统一入口，负责屏蔽不同模型 Provider 的差异。

至少应支持：

- provider abstraction
- request / response normalization
- timeout
- retry
- usage logging
- cost logging
- structured output mode
- tracing

### 18.2 Model Router

Model Router 负责决定某次任务使用哪个模型、哪条链路、是否二次复核、是否升级审核。

其决策依据可来自：

- task type
- impact level
- uncertainty
- active STU
- routing policy
- cost constraints
- latency constraints

### 18.3 路由目标

路由不仅是“选哪个模型”，也包括：

- 是否启用 reviewer model
- 是否走低成本初筛 + 高质量终审
- 是否进入人工审核
- 是否降级为保守模式

---

## 19. Replay、Audit 与 Feature Flags

### 19.1 Replay

Replay 能力用于对某次历史任务进行可复现还原。

为了支持 Replay，系统必须保存：

- 输入上下文
- 编译后策略上下文
- STU 版本
- 规则执行日志
- 模型请求元数据
- 输出 artifact
- claim 提取结果
- review 与 outcome 结果

### 19.2 Audit

Audit 能力用于支撑：

- 问题追查
- 策略责任归因
- 上线变更审计
- 回滚依据
- 实验结果核验

### 19.3 Feature Flags

Feature Flags 用于对框架能力进行分阶段启用。

典型场景：

- 是否启用 candidate STU 编译
- 是否启用某类 post-rule
- 是否启用自动 review
- 是否启用某类 bias monitor
- 是否启用新 Router 逻辑

---

## 20. Monorepo 结构与包职责

### 20.1 总体结构

建议 monorepo 结构如下：

```text
/apps
  /finance
  /content
  /ads
/packages
  /core-schema
  /runtime-types
  /stu
  /stu-registry
  /strategy-compiler
  /rule-engine
  /artifact-pipeline
  /claim-extractor
  /review-engine
  /error-utilization
  /evaluation-engine
  /experiment-engine
  /bias-monitor
  /model-gateway
  /model-router
  /replay-debug
  /feature-flags
/infrastructure
  /db
  /queue
  /storage
  /config
  /observability
/stu-packs
/benchmarks
```

### 20.2 packages 最小职责说明

#### core-schema
定义框架通用 schema 与版本协议。

#### runtime-types
定义运行时对象与接口类型。

#### stu
定义 STU 数据结构、校验与生命周期模型。

#### stu-registry
管理 STU 注册、查询、版本与状态。

#### strategy-compiler
把上下文与 STU 编译为运行时策略包。

#### rule-engine
执行规则层约束。

#### artifact-pipeline
管理 Artifact 生成后的持久化与分发。

#### claim-extractor
从 Artifact 中提取结构化 Claim。

#### review-engine
对 Claim 与 Outcome 进行复核。

#### error-utilization
从 Review 聚类错误并生成 STU 候选。

#### evaluation-engine
离线评估候选策略。

#### experiment-engine
负责线上实验与晋升回滚，消费 `PromotionPolicy`，结合 `EvaluationResult` 与 `ExperimentResult` 输出 `PromotionDecision`，并据此执行晋升、继续观察或回滚。

#### bias-monitor
偏差监控与告警。

#### model-gateway
统一模型调用抽象。

#### model-router
模型与链路路由策略。

#### replay-debug
回放、审计与调试能力。

#### feature-flags
灰度控制与能力开关。

### 20.3 apps 层职责

`apps/*` 只负责：

- 领域对象
- 领域 schema 扩展
- 领域任务定义
- 领域数据源接入
- 领域 UI / API
- 领域指标解释
- 领域级评估数据集

不得在 `apps/*` 中复制或重写 `packages/*` 的框架能力。

---

## 21. 数据协议层要求

### 21.1 为什么必须有协议层

如果没有稳定协议层：

- 不同 app 会重新发明自己的对象命名
- 无法共享 STU 和 benchmark
- 无法统一 replay 与 audit
- AI IDE 很容易把领域对象错误上升为框架对象

### 21.2 框架协议层最低要求

所有核心对象必须：

- 有稳定 schema
- 有 schema version
- 有唯一 id
- 可序列化
- 可跨服务传输
- 可被持久化
- 可被回放

### 21.3 应用层扩展方式

应用层可以在不破坏框架协议的前提下扩展字段。

推荐方式：

- 保留框架核心字段不变
- 允许 app-specific `payload`
- 允许 app-specific `metadata`
- 禁止替换核心对象的语义

---

## 22. 运行流程

### 22.1 标准运行时流程

1. 应用层发起任务
2. 生成 TaskContext
3. Strategy Compiler 拉取适用 STU 并编译运行时策略
4. Rule Engine 在 pre 阶段处理输入
5. Model Router 决定模型与链路
6. Model Gateway 发起生成
7. Rule Engine 在 in / post 阶段执行检查与修正
8. 生成 StrategyArtifact
9. Claim Extractor 提取 StrategyClaim
10. Artifact 与 Claim 持久化
11. 到达 review 时点后回收 OutcomeRecord
12. Review Engine 执行复核
13. Error Utilization 识别 ErrorPattern
14. 生成 STU candidate
15. Evaluation Engine 执行离线评估
16. Experiment Engine 做线上实验
17. 通过后激活为 active STU
18. 下一轮任务继续使用优化后的策略上下文

### 22.2 强制约束

以下约束必须成立：

- 未编译任务不得直接进入模型调用
- 未记录版本信息的 STU 不得进入生产
- 未经过协议校验的 Artifact 不得进入 Claim 提取
- 未绑定 baseline 的策略评估结果不得参与晋升判断
- 实验中策略必须可回滚

---

## 23. AI IDE / 自动开发约束

为了保证 AI IDE 能正确实现 StratOS，而不把某个 app 的逻辑误写成框架能力，必须明确以下要求：

### 23.1 开发顺序

推荐开发顺序：

1. `packages/core-schema`
2. `packages/runtime-types`
3. `packages/stu`
4. `packages/stu-registry`
5. `packages/strategy-compiler`
6. `packages/rule-engine`
7. `packages/artifact-pipeline`
8. `packages/claim-extractor`
9. `packages/review-engine`
10. `packages/error-utilization`
11. `packages/evaluation-engine`
12. `packages/experiment-engine`
13. `packages/model-gateway`
14. `packages/model-router`
15. `packages/replay-debug`
16. `apps/*` 接入

### 23.2 编码原则

- 先 schema，后实现
- 先接口，后适配器
- 先 mock pipeline，后真实 provider
- 先本地可跑，后接远程服务
- app 不得绕过 compiler / registry / rule engine 直调模型

### 23.3 最低测试要求

每个核心包至少应有：

- schema validation test
- happy path test
- failure path test
- replay compatibility test（核心包）

---

## 24. 非功能需求

### 24.1 可观测性

系统应能观测：

- 任务量
- 编译耗时
- 模型耗时
- 规则命中率
- Claim 产出率
- Review 覆盖率
- ErrorPattern 发现率
- STU 晋升率
- 回滚率
- 成本与延迟

### 24.2 可扩展性

框架必须允许新增：

- 新 app
- 新 task type
- 新 artifact type
- 新 claim type
- 新 rule type
- 新 provider
- 新 routing strategy

且不要求改动框架核心对象定义。

### 24.3 可部署性

StratOS 必须支持：

- local
- staging
- production

同时应能适配：

- 本地文件存储 / 云对象存储
- 本地 SQLite / 远程数据库
- 本地队列 / 云队列
- 环境变量配置 / 远程配置中心

### 24.4 私有性与协作

系统设计应支持：

- 私有数据本地保留
- 私有 API Key 本地保留
- STU / benchmark / schema 可选择性共享
- 不依赖中心化数据上传才能完成进化

---

## 25. 验收标准

### 25.1 架构验收

以下条件成立，才可认为框架边界清晰：

- `packages/*` 不包含具体领域词汇硬编码
- `apps/*` 不复制框架核心逻辑
- 新 app 接入时不需要修改框架核心对象
- STU、Compiler、Rule Engine、Evaluation、Experiment 之间职责清晰

### 25.2 运行时验收

以下能力必须可运行：

- STU 可注册、查询、激活、停用
- Compiler 可基于上下文编译运行时策略
- Rule Engine 可在至少 pre/post 两阶段执行
- Artifact 可持久化并带 schema version
- Claim 可被结构化提取
- Review 可对历史 Claim 执行复核
- ErrorPattern 可由 Review 聚类得到
- STU candidate 可由错误模式生成
- Evaluation 可对 candidate 与 baseline 比较
- Experiment 可进行最小化分桶实验
- Replay 可还原至少一条端到端链路

### 25.3 泛化验收

以下条件成立，才可证明框架具备泛化能力：

- finance app 接入不需要在框架内写 portfolio/ticker 等对象
- content app 接入不需要在框架内写 script/brand 等对象
- ads app 接入不需要在框架内写 campaign/creative 等对象
- 三类 app 均可映射到统一的 Artifact / Claim / Review / STU 流程

### 25.4 风险控制验收

以下条件必须满足：

- 新 STU 默认不能直接全量生效
- 所有 active STU 必须可追溯到版本与来源
- 所有实验必须可回滚
- 所有回放必须能定位到策略上下文

---

## 26. 里程碑建议

### Phase 1：框架最小闭环
目标：跑通单应用、单任务类型的最小端到端闭环。

包含：

- core-schema
- stu
- stu-registry
- strategy-compiler
- rule-engine（pre/post）
- artifact-pipeline
- claim-extractor
- review-engine
- 基础 replay

### Phase 2：评估与实验
目标：让候选策略具备离线评估与小流量实验能力。

包含：

- evaluation-engine
- experiment-engine
- feature-flags
- baseline/candidate 对比
- 最小回滚能力

### Phase 3：错误利用与偏差监控
目标：让系统从 review 走向稳定的 STU 生成与偏差观察。

包含：

- error-utilization
- bias-monitor
- STU candidate generation
- 基础 taxonomy

### Phase 4：多应用接入与共享资产
目标：验证框架泛化性。

包含：

- 第二个 app 接入
- 通用 benchmark
- STU pack 导入导出
- 多 provider 路由

---

## 27. 开源与协作原则

StratOS 的开源策略不是“集中所有数据”，而是：

> 私有实例演化，开放结构协作。

这意味着：

- 用户运行自己的实例
- 用户保留自己的数据和 API Key
- 社区共享 schema、STU、benchmarks、rules、taxonomy
- 框架推动共享的是结构，而不是私有运行数据

这也是 StratOS 能长期成立的关键：

- 私密业务数据不会被强制中心化
- 结构化经验却可以在社区中不断增强

---

## 28. 待决策问题

以下问题应在框架开发过程中持续收敛，但不阻塞本 PRD 首版落地：

1. Claim Extractor 默认采用规则、模型还是混合策略
2. STU 与 Rule 的边界是否进一步拆分成独立资产类型
3. Error taxonomy 由框架提供空壳，还是提供通用基础类目
4. Replay 是否默认保存完整 prompt 文本，还是只保存结构化编译结果
5. 多实例共享 STU 时如何处理信任评级与来源权重
6. 参数级训练扩展是否应进入独立实验性 package

---

## 29. 结语

StratOS 的目标不是让 Agent 只是“会做事”。

StratOS 的目标是让 Agent：

- 能形成策略
- 能为策略负责
- 能从错误中学习
- 能把经验沉淀成结构化资产
- 能在受控条件下持续进化

如果一个 Agent 系统只有行动能力，而没有策略运行时、自我训练闭环、评估机制和实验机制，它最多只能不断重复行为；很难稳定提升自身策略质量。

StratOS 要解决的，正是这个问题。

