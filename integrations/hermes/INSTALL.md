# INSTALL

本文档用于在本地或受控测试环境安装 Hermes ↔ StratOS 集成桥接。

## Baseline versions

- bridge version: `hermes-bridge.v0.1`
- event schema version: `hermes.events.v0.1`
- hint response version: `hermes.hints.v0.1`

## 前置条件

- 可运行的 Hermes 实例
- 可访问的 StratOS 服务地址
- 可用的 API key（Bearer token）
- `bash`、`curl`、`jq`

## 1) 准备配置

```bash
cp integrations/hermes/CONFIG.example.yaml /tmp/hermes-stratos.yaml
```

至少修改：

- `bridge.strat_os_endpoint`
- `bridge.api_key`
- `bridge.trackable_task_types`

## 2) 校验 StratOS 可达性

```bash
export STRATOS_BASE="http://localhost:8080"
curl -sS "$STRATOS_BASE/health" | jq .
```

## 3) 在 Hermes 注册桥接

Hermes 侧需实现最小桥接动作：

1. 在任务开始/完成/反馈/结果可用时发送事件到
   - `POST /integrations/hermes/events`
2. 在可追踪任务执行前（可选）拉取 hints：
   - `GET /integrations/hermes/strategy-hints`
3. 保持 fail-open：StratOS 不可达时不阻断 Hermes 原任务执行。

## 4) 运行 smoke test

```bash
bash integrations/hermes/scripts/smoke/run_local_smoke.sh
```

## 5) 建议的下一步

- 从 `analysis` 任务开始接入，再扩展到 `planning` 与 `scheduled_report`
- 打开 ingest 与 hints 的日志追踪
- 配置 retry/backoff 与 dead-letter 处理
