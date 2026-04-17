import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceWebRuntime } from '../apps/finance/dist/web/FinanceWebRuntime.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('setup page and setup api are connected in deployed web runtime', async () => {
  const runtime = new FinanceWebRuntime();
  const server = runtime.start(4324);
  await sleep(200);

  const page = await fetch('http://127.0.0.1:4324/finance/setup');
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.ok(html.includes('/api/finance/setup/save-config'));

  const api = await fetch('http://127.0.0.1:4324/api/finance/setup/status');
  const json = await api.json();
  assert.equal(api.status, 200);
  assert.ok('setupState' in json);

  server.close();
});
