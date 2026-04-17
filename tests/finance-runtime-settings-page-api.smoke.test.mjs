import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceWebRuntime } from '../apps/finance/dist/web/FinanceWebRuntime.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('runtime settings page and api smoke', async () => {
  const runtime = new FinanceWebRuntime();
  const port = 4500 + Math.floor(Math.random() * 20000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = runtime.start(port);
  await sleep(200);

  const page = await fetch(`${baseUrl}/finance/settings/runtime`);
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.ok(html.includes('Runtime Settings'));

  const api = await fetch(`${baseUrl}/api/finance/settings/runtime`);
  const json = await api.json();
  assert.equal(api.status, 200);
  assert.ok(json.runtimeOverview);

  server.close();
});
