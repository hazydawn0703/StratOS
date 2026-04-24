# TASK TYPE GUIDE

本文档定义 Hermes task types 与 StratOS 追踪范围的最小对齐规则（Phase H0 基线）。

## 统一 task types（v0）

- `analysis`
- `planning`
- `scheduled_report`

## Include in v0

### `analysis`

- 市场分析
- 竞品分析
- 风险/场景分析

### `planning`

- 优先级规划
- 下一步建议
- 决策备忘录

### `scheduled_report`

- 周期性总结
- 周期性审计与建议

## Exclude in v0

- casual chat / generic Q&A
- 纯工具调用或文件搬运
- 无法在未来复核结果的任务

## Eligibility checklist

一个任务仅在以下条件全部满足时进入桥接：

1. 任务输出具有可持续业务影响。
2. 未来可以观测 outcome（人工反馈或指标）。
3. `task_type` 在白名单中。
4. 输入输出可满足最小安全策略（脱敏/可存档）。

## Mapping guidance

Hermes task type 原值如果是别名，应在 integration 层先归一化为上述三类之一，再发送事件。
