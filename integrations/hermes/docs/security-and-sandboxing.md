# Security and Sandboxing

## 安全目标

- 最小化数据暴露
- 明确可修改范围
- 桥接失败可回滚
- 不影响 Hermes 主运行链路

## 基础控制

- API key 鉴权（Bearer token）
- TLS 传输加密
- 基于 `tenant_id` 的隔离
- 可配置的输入输出脱敏

## 受控目录与权限建议（自接入试点）

在受控测试环境中，建议 Hermes 仅可修改：

- `integrations/hermes/CONFIG.example.yaml` 的副本
- `integrations/hermes/scripts/` 下脚本副本
- 运行时专属配置目录（例如 `/tmp/hermes-stratos/`）

不允许：

- 任意改写 `packages/*` StratOS 核心协议
- 改写 `apps/*` 业务运行时
- 跨目录批量重写仓库文件

## 失败与回滚

当桥接变更导致异常时：

1. 关闭 `bridge.enabled` 或 `hints.enabled`
2. 回退到上一版配置文件
3. 清理当次临时脚本与缓存
4. 使用 smoke 脚本重新验证基线

## 审计建议

- 记录每次 event 提交的 `event_id`
- 记录 hints 查询参数与响应摘要
- 不在日志输出完整敏感原文
