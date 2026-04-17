# Finance Setup Deployment Runbook (Phase D2)

## 1) Install + build

```bash
pnpm install --frozen-lockfile
pnpm clean
pnpm build
```

## 2) Prepare env

Copy `apps/finance/.env.example` and set values as needed:

- `FINANCE_SETUP_SECRET_KEY`
- `FINANCE_WEB_PORT`
- `FINANCE_WEB_AUTOSTART`
- optional provider placeholders (`FINANCE_MARKET_*`, `FINANCE_NEWS_*`, `FINANCE_EVENT_*`)

## 3) Start web runtime

```bash
pnpm finance:web:start
```

Then open:

- Setup Wizard: `http://127.0.0.1:4310/finance/setup`
- Setup Status: `http://127.0.0.1:4310/finance/setup/status`

## 4) Wizard flow (recommended)

1. Save config via `POST /api/finance/setup/save-config`
2. Bootstrap default finance resources via `POST /api/finance/setup/bootstrap`
3. Run health checks via `POST /api/finance/setup/healthcheck`
4. Execute first run via `POST /api/finance/setup/demo-run`
5. Verify status via `GET /api/finance/setup/status`

## 5) Verify outputs after demo run

Use existing pages to confirm setup is operational:

- Dashboard: `/finance/dashboard`
- Reports: `/finance/reports`
- Predictions: `/finance/predictions`
- Timeline: `/finance/timeline`
- Run Center: `/finance/run-center`
- Runtime Settings: `/finance/settings/runtime`

## 6) Reconfigure / retry

If `setupState` is `requires_reconfigure` or `invalid`:

- resubmit `/api/finance/setup/save-config`
- rerun `/api/finance/setup/bootstrap`
- rerun `/api/finance/setup/healthcheck`
- inspect `/api/finance/setup/history`
