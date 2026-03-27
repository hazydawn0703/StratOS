import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryQueueAdapter } from '../packages/infrastructure/dist/index.js';

test('in-memory queue supports retry and dead-letter after max retries', async () => {
  const queue = new InMemoryQueueAdapter(1);
  await queue.enqueue({ type: 'sla', id: 'a1' });

  const item = await queue.dequeue();
  assert.ok(item);
  await queue.retry(item.id);

  const retried = await queue.dequeue();
  assert.ok(retried);
  await queue.retry(retried.id);

  const deadLetters = queue.getDeadLetters();
  assert.equal(deadLetters.length, 1);
  assert.equal(deadLetters[0].id, retried.id);
  assert.equal(deadLetters[0].retries, 2);
});
