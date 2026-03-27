# 《带自我训练闭环的自动投资判断与复盘系统 PRD》
## StratOS 下的 `apps/finance` 应用级重构版

---

## 0. 文档定位

本文档定义 **StratOS monorepo 中 `apps/finance` 的应用级 PRD**。

它不是 StratOS Framework 本身，不重新定义框架核心对象、框架生命周期、运行时主干管线、STU 协议、Compiler 协议、Rule Engine 协议、Evaluation / Experiment 协议，也不在应用层重写框架级版本语义。

本文档只负责三件事：

1. 定义金融场景中的业务对象、任务流程、页面、API 与验收标准
2. 将 StratOS Framework 的通用对象映射到 finance 场景
3. 为 `apps/finance` 提供必须落地的 App Policies、阈值口径与领域约束

### 0.1 与框架 PRD 的关系

分层关系必须保持：

```text
apps/finance（本 PRD）
    ↓
packages/*（StratOS Framework）
    ↓
infrastructure
```

若本文档与 `strat_os_framework_prd_V2.md` 冲突，以框架 PRD 为准。

### 0.2 本文档覆盖范围

本文档覆盖：

- finance 场景下的领域对象
- finance 场景任务类型与执行顺序
- finance 场景的 Artifact / Claim / Outcome / Review 映射
- finance 场景的 App Policies
- finance 场景的页面与 API
- finance 场景的领域验收标准
- finance 场景对 framework packages 的接入方式

本文档不覆盖：

- STU 通用协议定义
- STU Registry 通用实现
- Strategy Compiler 通用实现
- Rule Execution Engine 通用实现
- Evaluation / Experiment / Promotion 通用协议定义
- 通用模型网关与路由框架实现
- 多场景通用 schema 的根协议定义

### 0.3 AI IDE 必须遵守的边界

所有下列能力必须实现于 `packages/*`，不得在 `apps/finance` 中复制：

- STU / STU Registry
- Strategy Compiler
- Rule Execution Engine
- Claim Extractor 通用接口
- Review Engine 通用接口
- Error Utilization Engine
- Evaluation Engine
- Experiment Engine
- Bias Monitor
- Model Gateway / Model Router
- Replay / Audit / Feature Flags

所有下列能力必须实现于 `apps/finance/*`：

- portfolio / holding / watchlist / market universe
- market data adapter / news adapter / event adapter
- finance artifact schema 扩展
- finance claim schema 扩展
- finance review rubric 与 score 口径
- finance App Policies
- finance UI / API
- finance benchmark / evaluation dataset
- finance-specific dashboards 与分析页面

### 0.4 一句话定义

`apps/finance` 是一个基于 StratOS 的投资判断与复盘应用：

> 它持续生成金融研究产物，将其中可验证的投资主张结构化入库，在未来按时间或事件回收结果并执行复盘，再把重复错误转化为受控策略优化，最终让后续投资判断越来越稳。

---

## 1. 产品目标

### 1.1 核心目标

构建一个面向个人投资者或小型研究者的 finance 应用，使其能够：

- 管理持仓、关注列表与研究对象
- 自动生成组合日报、周报、单标的深度跟踪与风险提醒
- 将报告中的关键投资判断抽取为可验证 Prediction
- 为每条 Prediction 绑定复盘触发器与验证窗口
- 自动或半自动执行未来 Review
- 将错误沉淀为金融领域错误模式，而不是只保留日志
- 将通过评估与实验的 active STU 真正重新注入到未来判断中
- 在不自动下单的前提下，让研究与复盘体系持续变强

### 1.2 用户价值

用户获得的不是“替他买卖”的黑箱，而是一个：

- 持续整理市场信息的研究秘书
- 把模糊观点压成结构化主张的判断记录器
- 自动按时间和事件追责的复盘系统
- 能从自己历史错误里提炼约束的策略运行环境

### 1.3 非目标

MVP 不实现：

- 自动交易下单
- 券商账户写操作
- 高频交易终端
- 参数级模型训练
- 公共 SaaS 多租户复杂权限体系
- 面向机构销售的合规报告系统
- 对全市场做实时量化交易级别信号输出

---

## 2. Finance 应用在 StratOS 中的映射

框架层定义的是通用运行对象；finance 应用必须把这些对象映射成金融领域可执行对象，而不是重新发明一套平行框架。

### 2.1 核心对象映射

| Framework 对象 | finance 应用映射 | 说明 |
|---|---|---|
| TaskContext | FinanceTaskContext | 某次 finance 任务的上下文，如日更、周更、review、error scan |
| StrategyArtifact | FinanceReport / FinanceDecisionArtifact | 报告、风险提醒、观察摘要、组合结论 |
| StrategyClaim | FinancePrediction | 从 artifact 中提取的可验证投资主张 |
| OutcomeRecord | MarketOutcome / CorporateOutcome / PortfolioOutcome | 到期后的市场、公司事件或组合结果 |
| OutcomeReview | PredictionReview | 对历史预测执行的金融场景复盘 |
| ErrorPattern | FinanceErrorPattern | 在 finance 任务中重复出现的错误模式 |
| STU | Finance-scoped STU | 作用于 finance 任务、claim 类型、风险等级的策略单元 |
| EvaluationSet | FinanceBenchmarkSet | 用于 finance 场景离线评估的标准样本 |
| StrategyExperiment | FinanceStrategyExperiment | finance 任务上的候选策略实验 |
| RoutingPolicy | FinanceRoutingDecisionPolicy | 针对 finance 任务的模型与审核路径策略 |

### 2.2 标准运行主干在 finance 中的落地

框架主干保持不变：

```text
TaskContext
-> Compiler
-> Rule(pre)
-> Router
-> Gateway
-> Rule(in/post)
-> Artifact
-> Claim
-> Persist
-> Outcome
-> Review
-> Error Utilization
-> STU candidate
-> Evaluation
-> Experiment
-> active STU
-> Next Task with optimized context
```

在 `apps/finance` 中，对应为：

```text
FinanceTaskContext
-> load finance app config + active finance STU
-> finance input pre-check
-> choose model path for finance task
-> generate report / review / analysis
-> validate finance schema and claim quality
-> persist finance artifact
-> extract finance predictions
-> wait for market/event outcome
-> run prediction review
-> aggregate finance error patterns
-> generate finance-scoped STU candidate
-> replay on finance benchmark set
-> run finance traffic experiment
-> activate finance STU
-> affect next finance report / prediction / review
```

### 2.3 FinanceTaskType 列表

`apps/finance` 至少定义以下 task types：

- `daily_brief_generation`
- `weekly_portfolio_review`
- `stock_deep_dive`
- `risk_alert_generation`
- `prediction_extraction`
- `prediction_review`
- `error_pattern_scan`
- `finance_candidate_generation`
- `finance_evaluation_run`
- `finance_experiment_check`
- `bias_snapshot_generation`
- `timeline_rebuild`

---

## 3. 领域对象与业务边界

### 3.1 用户与研究对象

finance 应用围绕以下业务对象展开：

- User
- Portfolio
- Holding
- Watchlist Item
- Ticker / Asset
- Market Universe
- Report Source
- Finance Prediction
- Prediction Trigger
- Prediction Review
- Finance Error Pattern

### 3.2 支持的资产类型

MVP 建议优先支持：

- 美股股票
- ETF
- 现金类仓位占位项

可预留但不要求 MVP 完成：

- 港股
- A 股
- ADR
- 期权
- 加密资产
- 宏观指标篮子

### 3.3 报告类型

finance Artifact 在 MVP 中至少分为：

- `daily_brief`
- `weekly_review`
- `stock_deep_dive`
- `risk_alert`
- `event_watch_note`

### 3.4 Prediction 类型

finance Claim 即 Prediction，至少支持：

- `risk`
- `catalyst`
- `valuation`
- `earnings`
- `volatility`
- `allocation`
- `quality`
- `regime`

### 3.5 Outcome 类型

finance Outcome 至少支持：

- `price_window_outcome`
- `earnings_outcome`
- `guidance_outcome`
- `macro_regime_outcome`
- `portfolio_drawdown_outcome`
- `risk_event_outcome`
- `thesis_invalidated_outcome`

### 3.6 复盘边界

本应用中的 Review 不是“主观回顾”，而是围绕某一条 Prediction 的验证：

- 当时说了什么
- 何时应该验证
- 结果究竟发生了什么
- 偏差主要来自方向、时点、证据、置信度还是表达问题
- 是否构成可重复错误模式

---

## 4. Finance Artifact 设计

### 4.1 Artifact 基本要求

finance 应用产出的所有正式研究内容都必须同时包含：

- 人类可读正文
- 机器可读 JSON
- schema version
- task metadata
- source references
- model metadata
- finance app-specific payload

### 4.2 Finance Artifact 最小结构

```json
{
  "artifact_type": "daily_brief",
  "schema_version": "finance.artifact.v1",
  "title": "Portfolio Daily Brief - 2026-03-26",
  "summary": "今日组合最重要的变化是...",
  "sections": [],
  "source_refs": [],
  "portfolio_scope": {
    "portfolio_ids": ["p_001"]
  },
  "app_payload": {
    "watchlist_tickers": ["AAPL", "MSFT"],
    "holding_tickers": ["NVDA", "META"],
    "market_session": "us_regular"
  }
}
```

### 4.3 Artifact 质量约束

finance Artifact 不得：

- 只有自由文本而无结构化 JSON
- 只给结论不给证据
- 只给 bullish side 不给 cautious side
- 输出无法进入 claim extraction 的模糊段落作为主结论

必须尽量具备：

- 研究对象明确
- 时间窗口明确
- 风险提示明确
- 证据与反证边界明确
- 哪些内容可验证、哪些只是背景说明明确

---

## 5. Finance Prediction 设计

### 5.1 Prediction 定义

finance Prediction 是从报告中提取出的、可在未来某个时间或事件条件下验证的投资主张。

### 5.2 Prediction 最小字段

每条 Prediction 至少包含：

- `prediction_id`
- `artifact_id`
- `ticker_nullable`
- `scope`
- `thesis_type`
- `statement`
- `bullish_case`
- `cautious_case`
- `measurable_target`
- `evaluation_method`
- `confidence_score`
- `trigger_type`
- `review_due_at` 或 `review_event_key`
- `uncertainty_note`
- `evidence_refs`
- `claim_admission_grade`

### 5.3 允许进入正式闭环的 Prediction 条件

只有满足 ClaimAdmissionPolicy 的主张才能进入正式闭环。基础要求至少包括：

- 主体清晰：知道在说哪个标的、组合或宏观条件
- 时间清晰：能界定 review 窗口或事件窗口
- 可验证：存在 measurable target 或明确验证方式
- 双侧表达：至少保留 bullish case 与 cautious case 的平衡表达
- 非纯口号：不得只输出诸如“值得关注”“偏谨慎”“长期看好”之类无验证边界句子

### 5.4 典型不合格 Prediction

以下内容默认不进入正式 Prediction：

- 纯资讯摘要
- 无时间窗口的长期口号
- 无目标变量的笼统倾向表达
- 纯价值观判断
- 不可验证的宏大叙事

---

## 6. Finance Outcome 与 Review 设计

### 6.1 OutcomeRecord 来源

finance Outcome 可来自：

- 价格窗口结果
- 财报披露结果
- 指引变化
- 风险事件发生与否
- 波动区间与回撤数据
- 人工复核补录

### 6.2 Review 评分维度

PredictionReview 至少输出：

- `outcome`
- `review_summary`
- `direction_score`
- `timing_score`
- `evidence_score`
- `confidence_calibration_score`
- `specificity_score`
- `vagueness_score`
- `missed_counterevidence`
- `lesson_learned`
- `error_patterns`

### 6.3 Review 结果标签

至少支持：

- `correct`
- `partially_correct`
- `incorrect`
- `inconclusive`
- `expired`
- `skipped`

### 6.4 Review 设计原则

- 不能只判“对/错”
- 必须给出偏差来源
- 必须区分方向错误与时点错误
- 必须记录是否忽视反向证据
- 必须记录置信度是否与结果匹配
- `inconclusive` 不能滥用为回避错误的默认出口

---

## 7. Finance Error Pattern 体系

### 7.1 MVP 错误模式枚举

finance 应用首批至少支持：

- `timing_too_early`
- `timing_too_late`
- `missed_counterevidence`
- `overweighted_short_term_news`
- `overgeneralized_valuation_compression`
- `ignored_market_regime`
- `thesis_not_measurable`
- `confidence_too_high`
- `prediction_too_vague`
- `single_source_bias`
- `underweighted_downside_risk`
- `overreacted_to_event_noise`

### 7.2 ErrorPattern 的 finance 解释要求

每个错误模式都应包含：

- finance 语义名称
- 简要解释
- 常见触发上下文
- 典型坏样例
- 推荐修正方向
- 适用 thesis types
- 适用 risk levels

### 7.3 ErrorPattern 到 STU Candidate 的边界

finance 应用不直接定义 STU 通用协议，但必须定义：

- 哪些 finance error patterns 可以晋升为 STU candidate
- 晋升时使用哪些 finance benchmark
- 哪些风险级别必须人工确认

---

## 8. Required App Policies（finance 版）

本节是 `apps/finance` 对框架 16.6 Required App Policies 的正式落地。

### 8.1 ClaimAdmissionPolicy

#### 8.1.1 目标

决定哪些 finance Artifact 输出可以进入正式 Prediction 闭环。

#### 8.1.2 适用对象

- `daily_brief`
- `weekly_review`
- `stock_deep_dive`
- `risk_alert`

#### 8.1.3 准入规则

Prediction 必须满足：

1. 指向明确对象：股票、组合或宏观主题之一必须明确
2. 具备验证窗口：`review_due_at` 或 `review_event_key` 必须存在其一
3. 具备 measurable target 或明确 evaluation method
4. 不得缺失 `uncertainty_note`
5. 不得只输出单边立场
6. 高影响 Prediction 必须附至少 2 条证据引用，其中至少 1 条不是低可信来源

#### 8.1.4 分级

- `A`: 可直接进入正式 review 闭环
- `B`: 可进入闭环，但必须标记中等不确定性
- `C`: 仅作观察记录，不计入正式评价
- `Rejected`: 不得进入 Claim 闭环

#### 8.1.5 高影响 Claim 附加条件

以下任一情况视为高影响：

- 组合级 allocation 调整建议
- 明确 risk alert
- 高置信度负面或正面判断
- 财报前后的窗口判断

高影响 Claim 额外要求：

- `confidence_score <= 0.85`
- 至少一条 counterevidence 检查结果
- 至少一个可外部验证的 outcome channel

---

### 8.2 ReviewTriggerPolicy

#### 8.2.1 目标

决定 finance Prediction 在何时、以何种方式被复盘。

#### 8.2.2 触发方式

支持两类：

- `time_based`
- `event_based`

#### 8.2.3 默认规则

- `valuation`：默认 20~30 个自然日内复盘
- `risk`：默认 5~15 个自然日内复盘
- `earnings`：在对应 earnings event 后 1~3 日内复盘
- `volatility`：在设定波动窗口结束后复盘
- `allocation`：在组合观察窗口结束后复盘

#### 8.2.4 复盘方式

- 低影响任务：自动复盘
- 中影响任务：自动复盘 + 规则校验
- 高影响任务：自动复盘后可进入人工复核队列

#### 8.2.5 阻断规则

以下情况不得计入正式 review：

- 缺少 outcome 数据
- prediction 已过期且验证窗口定义失效
- 原始 prediction 未通过 ClaimAdmissionPolicy

---

### 8.3 ErrorPatternPromotionPolicy

#### 8.3.1 目标

决定哪些 finance ErrorPattern 可以被正式提升为 STU candidate 输入。

#### 8.3.2 默认门槛

同时满足以下条件时，允许自动生成 candidate：

- 最近 30 天内出现至少 5 次
- 覆盖至少 3 个独立 artifact
- 覆盖至少 2 个独立 review 窗口
- 严重度达到 `medium` 及以上
- 非同一 ticker 的单点偶发异常

#### 8.3.3 必须人工确认的情况

- 仅由单一极端行情窗口触发
- 仅由单个 ticker 引发
- 涉及高风险路由升级
- 可能显著提升成本

#### 8.3.4 不得自动晋升的模式

- 数据缺失导致的伪错误
- 单次黑天鹅导致的极端样本
- 纯用户偏好冲突
- 仅由人工后见之明产生的评价

---

### 8.4 EvaluationPolicy

#### 8.4.1 目标

决定 finance candidate 在离线评估阶段何时通过。

#### 8.4.2 评估对象

- finance-scoped STU candidate
- finance routing candidate
- finance rule bundle candidate

#### 8.4.3 baseline 规则

- 默认使用当前 active 版本作为 baseline
- 若无 active 版本，则使用 `finance-baseline-default`
- baseline 与 candidate 必须绑定同一 benchmark slice

#### 8.4.4 必测指标

- `review_alignment_score`
- `missed_counterevidence_rate`
- `confidence_calibration_score`
- `verifiable_prediction_ratio`
- `vagueness_penalty`
- `cost_delta`
- `latency_delta`

#### 8.4.5 通过条件

candidate 默认需满足：

- `missed_counterevidence_rate` 下降
- `confidence_calibration_score` 改善或至少不恶化
- `vagueness_penalty` 不得显著上升
- `verifiable_prediction_ratio` 不得下降超过设定容忍度
- 成本与延迟未超过策略预算护栏

#### 8.4.6 人工复审条件

- 关键指标一升一降且无明确净收益
- 成本明显上升
- 高影响任务表现分化明显

---

### 8.5 PromotionPolicy

#### 8.5.1 目标

决定 finance candidate 在 experiment 后何时可以进入 `active`。

#### 8.5.2 最低前提

candidate 进入 `active` 前必须具备：

- 有效 EvaluationResult
- 有效 ExperimentResult
- 可追溯 baseline
- 明确回滚路径
- 完整版本绑定

#### 8.5.3 默认晋升条件

- experiment 至少跨越一个完整观察窗口
- 核心质量指标稳定优于 baseline
- 未触发重大成本异常
- 未引发高影响任务错误率显著恶化
- 无明确 bias 告警升级为正式告警

#### 8.5.4 决策输出

必须输出：

- `promote`
- `hold`
- `rollback`
- `deprecate`
- `manual_review`

#### 8.5.5 自动晋升限制

finance app 中下列 candidate 不得自动晋升：

- 涉及重路由升级到 heavy + dual review 的 candidate
- 影响组合级 allocation judgment 的 candidate
- 影响 risk alert 默认触发逻辑的 candidate

---

### 8.6 RoutingDecisionPolicy

#### 8.6.1 目标

定义 finance 任务在不同风险和复杂度下如何选模型、选链路、是否双重审核。

#### 8.6.2 默认分层

- `light`: 新闻清洗、ticker 识别、基础分类、低风险结构化抽取
- `medium`: prediction extraction、review draft、error tagging 初筛
- `heavy`: 周度错误归因、candidate 生成、离线评估解释、高影响任务复核

#### 8.6.3 升级条件

以下情况可从 medium 升级 heavy：

- 高影响组合判断
- rule 命中高风险约束
- uncertainty 高于阈值
- 需执行双重审核

#### 8.6.4 降级条件

- 成本护栏触发
- 非关键任务批处理
- benchmark replay 批量低风险样本

#### 8.6.5 fallback 顺序

- 主模型失败 → 同层 fallback provider
- 同层失败 → 保守降级输出或人工复核队列
- 高影响任务不得静默降级为低层模型并直接给出最终结论

---

### 8.7 BiasAlertPolicy

#### 8.7.1 目标

识别 finance 系统是否在长期运行中出现方向性偏差，而不是把短期环境变化误判为策略进步。

#### 8.7.2 行为信号

- `bullish_ratio`
- `cautious_ratio`
- `risk_alert_ratio`
- `avg_confidence_score`

#### 8.7.3 结果信号

- `bullish_accuracy`
- `cautious_accuracy`
- `risk_alert_accuracy`
- `confidence_calibration_score`
- `missed_counterevidence_rate`

#### 8.7.4 判定原则

必须采用：

> Bias = Behavior Signals × Outcome Signals

不允许只看 bullish ratio 或 confidence shift 就下结论。

#### 8.7.5 告警分级

- `drift_notice`
- `warning`
- `formal_alert`

#### 8.7.6 当前版本限制

BiasAlert 只用于：

- 监控
- 告警
- 候选输入池
- 人工分析提示

不得直接绕过 evaluation / promotion 修改 active 策略。

---

## 9. 数据模型拆分原则

finance 应用必须将“框架通用表”与“应用领域表”拆开。

### 9.1 packages 持有的通用对象（引用，不在本 PRD 重定义）

由 framework packages 持有：

- tasks
- artifacts
- claims
- outcomes
- reviews
- error_patterns
- stu
- evaluation_sets
- evaluations
- experiments
- promotion_decisions
- routing_decisions
- rule_execution_logs
- model_call_logs
- feature_flags

### 9.2 apps/finance 持有的领域表

finance 应用至少定义：

- `finance_portfolios`
- `finance_portfolio_holdings`
- `finance_watchlist_items`
- `finance_assets`
- `finance_report_inputs`
- `finance_prediction_payloads`
- `finance_outcome_payloads`
- `finance_review_payloads`
- `finance_source_documents`
- `finance_bias_snapshots`
- `finance_benchmark_samples`
- `finance_timeline_views`（可为物化视图或查询层聚合）

### 9.3 逻辑映射建议

#### Artifact 映射

- framework: `artifacts`
- finance: `finance_report_inputs` + `artifact.metadata.app_payload`

#### Claim 映射

- framework: `claims`
- finance: `finance_prediction_payloads`

#### Outcome 映射

- framework: `outcomes`
- finance: `finance_outcome_payloads`

#### Review 映射

- framework: `reviews`
- finance: `finance_review_payloads`

### 9.4 禁止行为

- 不允许在 finance app 再定义一套平行的 STU 生命周期表
- 不允许在 finance app 内复制 Evaluation / Experiment 主表语义
- 不允许让 finance app 直接绕开 framework claim / review / experiment 管线

---

## 10. 页面结构

### 10.1 Dashboard

展示：

- 最近报告
- 待复盘 Prediction 数量
- 近 30 天 Review 分布
- 高频 Error Pattern
- 当前 active finance STU 摘要
- 当前 experiment 摘要
- Bias Monitoring 卡片

### 10.2 Portfolio

展示：

- 组合列表
- 持仓列表
- 按标的聚合的 Prediction / Review 历史
- 组合层风险提示

### 10.3 Watchlist

展示：

- 关注标的
- 最近报告命中次数
- 最近风险事件
- 最近预测与复盘结果

### 10.4 Reports

展示：

- 历史 Artifact
- 报告正文
- JSON 结构
- 关联 source refs
- 抽取出的 Predictions

### 10.5 Predictions

展示：

- 预测 statement
- thesis type
- confidence
- trigger
- status
- review due
- bullish / cautious case

### 10.6 Reviews

展示：

- review outcome
- 各评分维度
- 反向证据遗漏
- lesson learned
- 关联 error patterns

### 10.7 Error Intelligence

展示：

- 高频 finance error patterns
- 趋势变化
- 关联 candidate
- 是否正在下降

### 10.8 Strategy Lab

展示：

- finance candidate 列表
- evaluation 结果
- baseline 对比
- 待人工处理项

### 10.9 Experiment Center

展示：

- 当前 finance experiments
- traffic ratio
- 指标对比
- promote / rollback decision

### 10.10 Thesis Timeline

按 ticker 或 portfolio 展示：

- report
- prediction
- review
- error pattern
- candidate
- experiment
- active STU effect

---

## 11. API 设计

### 11.1 Portfolio

- `GET /api/finance/portfolios`
- `POST /api/finance/portfolios`
- `GET /api/finance/holdings`
- `POST /api/finance/holdings`
- `PUT /api/finance/holdings/:id`
- `DELETE /api/finance/holdings/:id`

### 11.2 Watchlist

- `GET /api/finance/watchlist`
- `POST /api/finance/watchlist`
- `PUT /api/finance/watchlist/:id`
- `DELETE /api/finance/watchlist/:id`

### 11.3 Reports / Artifacts

- `GET /api/finance/reports`
- `GET /api/finance/reports/:id`
- `POST /api/finance/tasks/run-daily-brief`
- `POST /api/finance/tasks/run-weekly-review`
- `POST /api/finance/tasks/run-stock-deep-dive`

### 11.4 Predictions / Claims

- `GET /api/finance/predictions`
- `GET /api/finance/predictions/:id`
- `POST /api/finance/predictions/:id/run-review`
- `POST /api/finance/predictions/extract/:artifactId`

### 11.5 Reviews

- `GET /api/finance/reviews`
- `GET /api/finance/reviews/:id`

### 11.6 Error Intelligence

- `GET /api/finance/errors/patterns`
- `POST /api/finance/errors/scan`
- `GET /api/finance/errors/:id/timeline`

### 11.7 Strategy Lab / Experiment

- `GET /api/finance/candidates`
- `POST /api/finance/candidates/:id/evaluate`
- `POST /api/finance/candidates/:id/start-experiment`
- `POST /api/finance/candidates/:id/promote`
- `POST /api/finance/candidates/:id/rollback`

### 11.8 Bias / Timeline

- `GET /api/finance/bias/snapshots`
- `GET /api/finance/timeline`

---

## 12. 任务系统设计

### 12.1 每日晨报任务

输入：

- 当前持仓
- watchlist
- 最新 market / company information
- 当前 active finance STU
- 当前 routing defaults

输出：

- `daily_brief` artifact
- 提取出的 finance predictions
- 需要重点关注的 risk items

### 12.2 每周组合复盘任务

输入：

- 本周 reports
- 本周 pending / reviewed predictions
- 本周 review results
- 本周运行中的 experiments

输出：

- `weekly_review` artifact
- finance system health summary
- 需要进入 error scan 的聚合线索

### 12.3 单股深度跟踪任务

输入：

- 单个 ticker
- 历史 timeline
- 最近 source documents
- 当前 active finance STU

输出：

- `stock_deep_dive` artifact
- 可进入正式闭环的 predictions

### 12.4 到期复盘任务

触发条件：

- `time_based` prediction 到期
- `event_based` prediction 对应事件已确认

输出：

- PredictionReview
- finance review payload
- error pattern candidates

### 12.5 错误扫描任务

周期：

- 每日轻扫描
- 每周正式聚合

职责：

- 聚合最近 7/14/30 天 reviews
- 识别高频 finance error patterns
- 评估是否满足 ErrorPatternPromotionPolicy

### 12.6 候选生成任务

职责：

- 将符合门槛的 finance error patterns 映射为 finance-scoped STU candidate proposal
- 调用 framework candidate pipeline
- 输出 app-level candidate metadata

### 12.7 实验巡检任务

职责：

- 读取 finance experiment 状态
- 计算 app-level 观察指标
- 输出 promote / hold / rollback 建议

---

## 13. Finance Benchmark 与 Evaluation Dataset

### 13.1 数据集来源

finance BenchmarkSet 可来自：

- 历史高质量 report → prediction → outcome → review 链路
- 人工精选案例
- 覆盖关键 thesis types 的回放样本

### 13.2 覆盖要求

MVP benchmark 应尽量覆盖：

- valuation
- earnings
- risk alert
- volatility
- allocation
- regime

### 13.3 样本质量要求

纳入 benchmark 的样本必须：

- 拥有可追溯原 artifact
- 拥有明确 claim
- 拥有可验证 outcome
- 拥有已完成 review 或高质量人工标注

---

## 14. Bias Monitoring（finance 版）

### 14.1 目标

监控系统是否在 finance 判断中出现方向性偏差，而不是简单监控“说多了还是说少了”。

### 14.2 快照指标

至少输出：

- `bullish_ratio`
- `cautious_ratio`
- `risk_alert_ratio`
- `avg_confidence_score`
- `confidence_std`
- `bullish_accuracy`
- `cautious_accuracy`
- `risk_alert_accuracy`
- `missed_counterevidence_rate`

### 14.3 展示位置

- Dashboard Bias 卡片
- Strategy Lab 的 bias overlay
- Experiment Center 的 bias risk note

---

## 15. 技术与部署要求（应用层）

### 15.1 应用层技术栈建议

- Web：Next.js + TypeScript + Tailwind + shadcn/ui
- API：Next.js Route Handlers 或独立 Node service
- ORM：Prisma
- DB：PostgreSQL
- Queue / Scheduler：通过 infrastructure adapter

### 15.2 finance 应用对 infrastructure 的要求

必须通过统一 adapter 使用：

- database
- object storage
- queue
- config
- logger
- scheduler

### 15.3 模型接入要求

finance app 不得直接调用某家模型 SDK。

所有模型调用都必须经过：

- `packages/model-router`
- `packages/model-gateway`

应用层只提供：

- task intent
- impact level
- finance app config
- finance routing policy parameters

---

## 16. 开发阶段（apps/finance 版）

### Phase F1：finance domain 初始化

目标：

- 建立 `apps/finance` 目录骨架
- 定义 finance domain models
- 建立 portfolio / holdings / watchlist 基础 CRUD
- 建立 finance app config 与 policy registration 入口

交付：

- finance domain 可运行
- 基础页面空壳
- App Policies 配置骨架

### Phase F2：artifact → prediction 闭环

目标：

- 接入 finance report generation task
- 接入 finance artifact schema
- 打通 prediction extraction
- 实现 ClaimAdmissionPolicy 校验

交付：

- daily / weekly / deep dive artifact 可生成
- 合格 prediction 可入库

### Phase F3：prediction → outcome → review 闭环

目标：

- 实现 time/event-based trigger
- 实现 finance outcome collection
- 实现 PredictionReview 流程
- 落地 ReviewTriggerPolicy

交付：

- 正式 review 链路可运行

### Phase F4：error intelligence 与 candidate 输入

目标：

- 实现 finance error pattern aggregation
- 落地 ErrorPatternPromotionPolicy
- 接通 framework candidate pipeline

交付：

- finance error patterns 可聚合并生成 candidate proposal

### Phase F5：evaluation / experiment 接入

目标：

- 构建 finance benchmark set
- 接入 finance EvaluationPolicy
- 接入 finance PromotionPolicy
- 打通 Strategy Lab / Experiment Center

交付：

- candidate 可在 finance benchmark 上评估
- finance 实验与晋升可运行

### Phase F6：bias / timeline / polish

目标：

- 落地 BiasAlertPolicy
- 完成 timeline 展示
- 完成 replay-friendly 查询与诊断页
- 优化成本、路由与可观测性

交付：

- finance app 达到持续运行所需的最小稳定度

---

## 17. 验收标准

### 17.1 架构验收

必须满足：

- finance app 不复制 framework 核心逻辑
- finance app 只声明领域对象与领域规则
- 所有 active STU 仍经 framework compiler 注入
- finance app 通过 App Policies 参数化框架，而不是改写框架

### 17.2 功能验收

必须实现：

- portfolio / holdings / watchlist 管理
- finance artifact 生成
- finance prediction 抽取
- 到期 review 执行
- finance error pattern 聚合
- finance candidate 进入 evaluation / experiment 管线
- active STU 能真正回流影响后续 finance 输出

### 17.3 质量验收

- 正式 Prediction 具备尽量明确的验证边界
- Review 能区分方向、时点、证据、置信度问题
- 系统不会通过制造模糊废话来降低错误率
- 高影响任务不得静默降级
- Bias 监控不以单一行为指标下结论

### 17.4 产品原则验收

- 不承诺涨跌预测能力
- 不自动下单
- 不把系统优化成预设单边立场机器
- 重要输出保留 bullish case / cautious case
- 错误必须真正进入未来行为修正，而不是停留在日志层

---

## 18. 给 AI IDE 的应用层执行要求

1. 先引用 framework packages，再实现 finance 适配层。
2. 不要在 `apps/finance` 中重新定义 STU、Compiler、Rule Engine、Evaluation、Experiment 的通用协议。
3. 所有 finance 特有阈值与规则都进入 App Policies。
4. 所有 finance artifact / prediction / review 都必须可回放、可追踪、可绑定 framework 对象。
5. 先用 mock finance tasks 打通端到端链路，再接真实数据源与真实模型。
6. 所有模型调用都必须经过 framework gateway/router。
7. 所有 finance 自优化逻辑都必须遵守：`candidate -> evaluation -> experiment -> active / rollback`。
8. 每个阶段结束后，必须将 finance app 的工程状态追加写入 `docs/development-memory.md`。

---

## 19. 结语

重构后的 `apps/finance` PRD 不再把 framework 能力和 finance 业务揉在一起。

它只做一件正确的事：

> 在 StratOS 已定义的统一策略运行时之上，把“投资研究、预测提取、结果复盘、错误利用、策略回流”这条金融应用链路定义清楚，并把所有 finance 特有标准收束到 App Policies、领域对象、领域任务与领域验收里。

这才是一个真正可长期演进的 `apps/finance` PRD。
