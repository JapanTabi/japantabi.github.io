import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAdminServer } from '../../admin/server.mjs';

const directory = await mkdtemp(join(tmpdir(), 'tabi-admin-browser-'));
await writeFile(join(directory, 'spots.json'), JSON.stringify([
  { id: 'sakura', title: '目黑川櫻花', region: 'tokyo', desc: '原始介紹', hasNightLight: true, lat: 35.6, highlights: ['夜櫻'] },
  { id: 'snow', title: '二世谷雪場', region: 'hokkaido', desc: '粉雪景點', hasNightLight: false, lat: 42.8, highlights: [] },
]));
await writeFile(join(directory, 'i18n.json'), JSON.stringify({ 'zh-TW': { brandTitle: '日旅報報' }, en: { brandTitle: 'JAPAN TABI' } }));
const server = createAdminServer({ dataDir: directory, backupDir: join(directory, 'backups') });
server.listen(4176, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await rm(directory, { recursive: true, force: true }); process.exit(0); }));
