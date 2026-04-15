import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceWebRuntime } from '../apps/finance/dist/web/FinanceWebRuntime.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('runtime settings page and api smoke', async () => {
  const runtime = new FinanceWebRuntime();
  const server = runtime.start(4325);
  await sleep(200);

  const page = await fetch('http://127.0.0.1:4325/finance/settings/runtime');
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.ok(html.includes('Runtime Settings'));

  const api = await fetch('http://127.0.0.1:4325/api/finance/settings/runtime');
  const json = await api.json();
  assert.equal(api.status, 200);
  assert.ok(json.runtimeOverview);

  server.close();
});
