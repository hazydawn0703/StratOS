import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceWebRuntime } from '../apps/finance/dist/web/FinanceWebRuntime.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('finance web runtime serves page and api', async () => {
  const runtime = new FinanceWebRuntime();
  const server = runtime.start(4321);
  await sleep(200);

  const page = await fetch('http://127.0.0.1:4321/finance/dashboard');
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.ok(html.includes('Dashboard'));

  const api = await fetch('http://127.0.0.1:4321/api/finance/metrics');
  const data = await api.json();
  assert.equal(api.status, 200);
  assert.ok(data.metrics);
  server.close();
});
