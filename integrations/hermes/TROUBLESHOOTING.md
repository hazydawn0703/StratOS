# TROUBLESHOOTING

## Endpoint 不可达

现象：`curl: (7) Failed to connect` 或超时。

排查：

- 检查 `bridge.strat_os_endpoint` 是否正确。
- 检查目标服务是否已启动、端口是否开放。
- 检查网络策略或代理配置。

## invalid event payload

现象：`POST /integrations/hermes/events` 返回 `400`。

排查：

- 对照 [`EVENT_SCHEMA.md`](./EVENT_SCHEMA.md) 检查必填字段。
- 确认 `event_type` 在四类白名单中。
- 确认 `task_type` 在 `analysis/planning/scheduled_report` 白名单中。

## task_type 未配置

现象：可追踪任务未进入桥接。

排查：

- 检查 `bridge.trackable_task_types`。
- 确认 Hermes 侧任务类型已归一化到文档标准命名。

## artifact adaptation fail

现象：后续流程显示无法适配 artifact。

排查：

- 确认 `task.completed` 提供了 `raw_output_inline` 或 `raw_output_ref`。
- 查看 integration 层错误日志中的 adaptation failure record。

## no claims extracted

现象：artifact 已有但 claim 数量为 0。

排查：

- 检查输出是否具备可追踪 statement。
- 检查 claim admission 最小规则（空 statement / 不可复核）。

## empty hints

现象：hints endpoint 返回空数组。

排查：

- 这是合法结果，不应视为错误。
- 检查 `task_type`、`actor_id`、`domain_tag` 过滤条件是否过严。
- 检查 active hints 是否尚未发布或已过期。

## bad config path

现象：Hermes 启动时报配置文件找不到。

排查：

- 确认配置路径与实际部署路径一致。
- 使用绝对路径加载配置。
- 检查容器挂载路径是否正确。
