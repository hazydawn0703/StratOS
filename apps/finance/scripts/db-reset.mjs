import { existsSync, unlinkSync } from 'node:fs';
import { dbPath } from './db-common.mjs';

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}
console.log('finance db reset');
