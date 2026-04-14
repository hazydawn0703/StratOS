# StratOS Finance App (`apps/finance`)

## 1) 定位

`apps/finance` 是 StratOS monorepo 中基于 framework 的 finance 应用层实现。

它是：
- finance 领域对象、任务、页面与 API 的应用层
- setup / bootstrap / deployment onboarding 的入口

它不是：
- StratOS framework 本身
- 独立模型 SDK

> 本应用不直接调用任何厂商模型 SDK；模型调用路径始终通过 framework 的 `packages/model-router` 与 `packages/model-gateway`。

## 2) 架构边界

- `apps/finance`：finance 领域 app（UI/API、任务编排入口、setup）
- `packages/*`：framework 能力（router/gateway/compiler/rule/replay/audit 等）
- `apps/finance/src/infrastructure/*`：finance app 的基础设施适配层（SQLite/queue/scheduler/sql executor）

边界原则：finance app 不复制 framework 引擎，只做 app 层配置与接线。

## 3) 功能概览

- Portfolio / Watchlist 管理
- Reports / Predictions / Reviews
- Error Intelligence / STU Candidate
- Strategy Lab / Experiment Center
- Bias / Timeline / Replay Diagnostics
- Runtime Settings（provider/model/routing/guardrails）
- Setup Wizard + Setup Status
- Run Center / Task Ops

## 4) 环境要求

- Node.js >= 20
- pnpm >= 10（仓库使用 `pnpm@10.0.0`）
- 本地可用 SQLite（通过 Node sqlite3 CLI 适配）
- 支持部署模式：`local` / `staging` / `production`（通过 setup 选择）

## 5) Quick Start（推荐主入口）

推荐使用 **app 局部命令**（最少步骤）：

```bash
pnpm install --frozen-lockfile
pnpm --filter @stratos/finance run setup
pnpm --filter @stratos/finance run dev
```

启动后打开：
- Setup Wizard: `http://127.0.0.1:4310/finance/setup`

## 6) Setup Wizard

入口页面：
- `/finance/setup`
- `/finance/setup/status`

步骤：
1. Welcome / Mode Select
2. Infrastructure Config
3. AI Runtime Config
4. Finance Bootstrap
5. Task Automation Init
6. Health Check
7. Demo Run / First Run

完成后会初始化：
- default portfolio / watchlist / benchmark
- 默认任务调度记录（schedule）
- runtime settings（setup 输入写入 runtime 可消费配置）

CLI 对应命令：
- healthcheck: `pnpm --filter @stratos/finance run healthcheck`
- demo run: `pnpm --filter @stratos/finance run demo-run`

## 7) 常用命令

### 推荐（app 局部）

```bash
pnpm --filter @stratos/finance run setup
pnpm --filter @stratos/finance run dev
pnpm --filter @stratos/finance run build
pnpm --filter @stratos/finance run typecheck
pnpm --filter @stratos/finance run test
pnpm --filter @stratos/finance run db:init
pnpm --filter @stratos/finance run db:migrate
pnpm --filter @stratos/finance run db:seed
pnpm --filter @stratos/finance run setup:bootstrap
pnpm --filter @stratos/finance run setup:reset
pnpm --filter @stratos/finance run healthcheck
pnpm --filter @stratos/finance run demo-run
```

### 根命令（可选）

```bash
pnpm finance:setup
pnpm finance:setup:bootstrap
pnpm finance:setup:reset
pnpm finance:healthcheck
pnpm finance:demo-run
pnpm finance:db:init
pnpm finance:db:migrate
pnpm finance:db:seed
```

## 8) 配置说明

- App Config（setup non-secret）
  - mode / infrastructure / app bootstrap 选项 / automation
- Runtime Config（framework 可消费）
  - provider profile / model aliases / reviewer/fallback / routing defaults / guardrails
- Secret Refs
  - setup 单独输入并受保护存储
  - API 读取只返回 configured/ref 摘要，不回显明文

## 9) 部署到服务器（最小流程）

1. 准备 Node + pnpm 环境
2. 运行 installer：`pnpm --filter @stratos/finance run setup`
3. 启动服务：`pnpm --filter @stratos/finance run dev`
4. 打开 setup UI：`/finance/setup`
5. 执行 bootstrap
6. 运行 healthcheck
7. 执行 demo run
8. 验证：
   - Dashboard: `/finance/dashboard`
   - Run Center: `/finance/run-center`
   - Timeline: `/finance/timeline`
   - Runtime Settings: `/finance/settings/runtime`

## 10) 当前阶段限制

- 当前更适合 private/staging/internal beta 场景
- 真实 provider 的生产级稳定性工程尚未完成
- 不建议直接视作公网最终生产版

## 11) 故障排查

- build/typecheck/test 失败
  - 先执行：`pnpm clean && pnpm build && pnpm typecheck && pnpm test`
- setup 未完成
  - 查看 `/finance/setup/status` 的 `missingSteps`
  - 必要时先执行 `pnpm --filter @stratos/finance run setup:reset`，再执行 save-config / bootstrap / healthcheck / demo-run
- healthcheck 失败
  - 先跑 `pnpm --filter @stratos/finance run healthcheck`
  - 再检查 setup status 与 runtime settings
- demo run 无产物
  - 检查 `/finance/run-center` 的 task 状态
  - 查看 `/finance/reports`、`/finance/predictions`、`/finance/timeline`

## 未来分发预留（非当前阶段）

未来可考虑提供 `pnpm dlx` / `npx` 或独立 installer CLI；当前阶段不将 `apps/finance` 发布为独立 npm library，因为它仍依赖 monorepo framework 包并作为 app 运行。
