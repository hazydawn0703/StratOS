# Bridge Architecture

## 架构定位

- 宿主运行时：Hermes
- 治理运行时：StratOS
- 集成层：`integrations/hermes/`（可选启用）

## 组件分层

1. **Ingest adapter**
   - 校验 Hermes 事件
   - 映射最小 TaskContext 输入
   - 保留原始 payload 供追踪/回放
2. **Artifact adapter**
   - 把 Hermes 输出转为 `StrategyArtifact`
   - 失败时保留 raw output 并记录 adaptation failure
3. **Claim preset adapter**
   - 基于 artifact 抽取最小 claim
   - 只做 admission baseline，不替代策略引擎
4. **Hints endpoint**
   - Hermes 执行前按 task_type 拉取可选 hints
   - 支持空结果稳定返回

## 关键接口（v0）

- `POST /integrations/hermes/events`
- `GET /integrations/hermes/strategy-hints`

## 端到端流程

1. Hermes 接收任务。
2. 若 `task_type` 在白名单中，则桥接层准备接入。
3. 可选调用 hints endpoint 获取策略提示。
4. Hermes 正常执行任务。
5. 通过 ingest endpoint 发送生命周期事件。
6. StratOS 在内部完成 artifact/claim/review 等治理流程。

## 失败处理原则

- 网络失败、校验失败、下游暂不可达时，桥接层写入错误日志。
- Hermes 主执行流不中断（fail-open）。
