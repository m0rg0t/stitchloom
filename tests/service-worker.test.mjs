import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
test('service-worker activation preserves unrelated apps caches on a shared origin', async () => {
  const handlers = new Map(); const deleted = []; let completion;
  vm.runInNewContext(readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8'), {
    self: { addEventListener: (name, callback) => handlers.set(name, callback), clients: { claim() {} } },
    caches: { keys: async () => ['another-app-v1', 'stitchloom-v28', 'stitchloom-v29'], delete: async key => { deleted.push(key); } },
  });
  handlers.get('activate')({ waitUntil: promise => { completion = promise; } });
  await completion; assert.deepEqual(deleted, ['stitchloom-v28']);
});
