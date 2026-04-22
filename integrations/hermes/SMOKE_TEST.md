# SMOKE TEST

本 smoke test 用于验证文档基线接口在本地可连通。

## 目标

确认：

1. `POST /integrations/hermes/events` 可接收示例事件
2. `GET /integrations/hermes/strategy-hints` 可返回结构化响应（包括空结构）
3. 配置字段、认证头、路径命名与文档一致

## 运行

```bash
bash integrations/hermes/scripts/smoke/run_local_smoke.sh
```

## 预期

- ingest endpoint 返回 `202`（或开发环境 mock 约定成功码）
- hints endpoint 返回 `200` 且包含：`version`、`hints`、`active_stu_refs`、`route_flags`
- 脚本退出码为 `0`

## 样例输入

- events: `integrations/hermes/testdata/sample-events/`
- hints: `integrations/hermes/testdata/sample-hints/`

## 失败排查

见 [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)。
