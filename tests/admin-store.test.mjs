import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../admin/store.mjs';
import { createAdminServer } from '../admin/server.mjs';
import { request } from 'node:http';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'tabi-admin-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'spots.json'), JSON.stringify([{ id: 'a', title: '原始景點', custom: { untouched: [1, true, null] } }]));
  return { root, store: createStore({ dataDir: root, backupDir: join(root, 'backups') }) };
}

test('save preserves nested data, creates backup and can restore', async (t) => {
  const { store } = await fixture(t);
  const original = await store.load('spots.json');
  const edited = structuredClone(original.data); edited[0].title = '更新景點';
  const saved = await store.save('spots.json', edited, original.revision);
  assert.deepEqual((await store.load('spots.json')).data, edited);
  const [backup] = await store.history('spots.json');
  const restored = await store.restore('spots.json', backup, saved.revision);
  assert.deepEqual(restored.data, original.data);
  assert.equal((await store.history('spots.json')).length, 2);
});

test('stale and simultaneous edits cannot overwrite newer data', async (t) => {
  const { store } = await fixture(t);
  const original = await store.load('spots.json');
  const first = [{ ...original.data[0], title: '第一份' }];
  const second = [{ ...original.data[0], title: '第二份' }];
  const results = await Promise.allSettled([store.save('spots.json', first, original.revision), store.save('spots.json', second, original.revision)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.find((result) => result.status === 'rejected').reason.status, 409);
  assert.deepEqual((await store.load('spots.json')).data, first);
});

test('reject traversal, invalid shapes, missing fields, and additional duplicate IDs', async (t) => {
  const { store } = await fixture(t);
  const { data, revision } = await store.load('spots.json');
  for (const name of ['../spots.json', 'missing.json', 'spots.json/../../package.json']) await assert.rejects(store.load(name), { status: 404 });
  for (const invalid of [{}, [null], [{ id: 'a' }], [...data, ...data]]) await assert.rejects(store.save('spots.json', invalid, revision), { status: 422 });
  assert.deepEqual((await store.load('spots.json')).data, data);
});

test('preexisting duplicate IDs remain editable but cannot gain another duplicate', async (t) => {
  const { store, root } = await fixture(t);
  await writeFile(join(root, 'spots.json'), JSON.stringify([{ id: 'a', title: '一' }, { id: 'a', title: '二' }]));
  const original = await store.load('spots.json');
  original.data[0].title = '更新';
  const saved = await store.save('spots.json', original.data, original.revision);
  await assert.rejects(store.save('spots.json', [...saved.data, { id: 'a', title: '三' }], saved.revision), { status: 422 });
  const removed = await store.save('spots.json', [saved.data[0]], saved.revision);
  const [backup] = await store.history('spots.json');
  const restored = await store.restore('spots.json', backup, removed.revision);
  assert.equal(restored.data.length, 2);
});

test('HTTP API blocks cross-origin writes and requires its local session token', async (t) => {
  const { root } = await fixture(t);
  const server = createAdminServer({ dataDir: root, backupDir: join(root, 'backups') });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { token } = await (await fetch(origin + '/api/catalog')).json();
  const original = await (await fetch(origin + '/api/data/spots.json')).json();
  const body = JSON.stringify({ ...original, data: [{ ...original.data[0], title: '中文儲存測試' }] });
  const send = (headers, input = body) => fetch(origin + '/api/data/spots.json', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: input });
  assert.equal((await send({})).status, 403);
  assert.equal((await send({ 'X-Admin-Token': token, Origin: 'https://other.example' })).status, 403);
  assert.equal((await send({ 'X-Admin-Token': token }, '{oops')).status, 400);
  assert.equal((await send({ 'X-Admin-Token': token, Origin: origin })).status, 200);
  assert.equal(JSON.parse(await readFile(join(root, 'spots.json'), 'utf8'))[0].title, '中文儲存測試');
  const wrongHostStatus = await new Promise((resolve, reject) => {
    const req = request(origin + '/api/catalog', { headers: { Host: 'attacker.example' } }, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(wrongHostStatus, 403);
});
