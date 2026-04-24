# Upstream-friendly Notes

## 目标

让 Hermes 上游可以低成本接入 StratOS，而不被 StratOS 实现细节强绑定。

## 设计策略

1. **可选开关**
   - 所有桥接能力均可配置启停。
2. **轻量契约**
   - 仅暴露少量稳定 endpoint 与 schema 版本号。
3. **fail-open**
   - StratOS 不可达时不阻断 Hermes 原能力。
4. **最小任务集**
   - v0 只支持 `analysis/planning/scheduled_report`，避免过早泛化。

## 不推荐做法

- 在 Hermes core domain model 中引入 StratOS 专有对象
- 在 integration 层承载 promotion/evaluation 等治理策略
- 为所有宿主框架抽象统一 mega-adapter（过度设计）

## 向上游提交建议

若后续需要 upstream PR，应优先提交：

- 可配置 hook 点（事件发送、hint 拉取）
- 非侵入日志与观测埋点
- 与本目录一致的最小协议文档
