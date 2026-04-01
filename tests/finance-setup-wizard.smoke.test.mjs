import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceWebRuntime } from '../apps/finance/dist/web/FinanceWebRuntime.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('setup wizard page and status page are served', async () => {
  const runtime = new FinanceWebRuntime();
  const server = runtime.start(4323);
  await sleep(200);

  const wizard = await fetch('http://127.0.0.1:4323/finance/setup');
  const wizardHtml = await wizard.text();
  assert.equal(wizard.status, 200);
  assert.ok(wizardHtml.includes('Setup Wizard'));

  const status = await fetch('http://127.0.0.1:4323/finance/setup/status');
  const statusHtml = await status.text();
  assert.equal(status.status, 200);
  assert.ok(statusHtml.includes('Setup Status'));

  server.close();
});
