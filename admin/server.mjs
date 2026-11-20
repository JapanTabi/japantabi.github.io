import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createStore, AdminError } from './store.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const uiRoot = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function createAdminServer(options = {}) {
  const store = createStore({ dataDir: options.dataDir || resolve(project, 'public/data'), backupDir: options.backupDir || resolve(project, '.admin-backups') });
  const token = randomBytes(32).toString('hex');
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (req.headers.host !== new URL(origin).host || (req.headers.origin && req.headers.origin !== origin)) throw new AdminError(403, '僅允許從本機後台存取。');
      const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
      if (pathname.startsWith('/api/')) {
        if (req.method === 'GET' && pathname === '/api/catalog') return json(200, { files: await store.catalog(), token });
        const match = /^\/api\/data\/([a-z0-9_]+\.json)(?:\/(history|restore))?$/.exec(pathname);
        if (!match) throw new AdminError(404, '找不到這個操作。');
        const [, file, action] = match;
        if (req.method === 'GET' && !action) return json(200, await store.load(file));
        if (req.method === 'GET' && action === 'history') return json(200, await store.history(file));
        if (!((req.method === 'PUT' && !action) || (req.method === 'POST' && action === 'restore'))) throw new AdminError(405, '不支援這個操作。');
        if (req.headers['x-admin-token'] !== token || !req.headers['content-type']?.startsWith('application/json')) throw new AdminError(403, '請從後台重新載入後再操作。');
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 8 * 1024 * 1024) throw new AdminError(413, '資料超過 8 MB 上限。');
          chunks.push(chunk);
        }
        let input;
        try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AdminError(400, 'JSON 格式錯誤。'); }
        if (!input || typeof input !== 'object' || typeof input.revision !== 'string' || (!action && !Object.hasOwn(input, 'data'))) throw new AdminError(400, '請提供完整資料與版本。');
        return json(200, action ? await store.restore(file, input.backup, input.revision) : await store.save(file, input.data, input.revision));
      }
      if (req.method !== 'GET') throw new AdminError(405, '不支援這個操作。');
      let target;
      if (pathname.startsWith('/site/images/')) {
        const root = await realpath(resolve(project, 'public/images'));
        target = await realpath(resolve(root, pathname.slice('/site/images/'.length)));
        if (!target.startsWith(root + sep)) throw new AdminError(404, '找不到圖片。');
      } else {
        const files = { '/': 'index.html', '/main.js': 'main.js', '/styles.css': 'styles.css' };
        if (!files[pathname]) throw new AdminError(404, '找不到頁面。');
        target = resolve(uiRoot, files[pathname]);
      }
      const bytes = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
      res.end(bytes);
    } catch (error) {
      json(error.status || (error.code === 'ENOENT' ? 404 : 500), { error: error.status ? error.message : '操作失敗，請檢查終端紀錄。' });
      if (!error.status && error.code !== 'ENOENT') console.error(error);
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.ADMIN_PORT || 4175);
  createAdminServer().listen(port, '127.0.0.1', () => {
    console.log(`\n日本旅遊報報管理後台：http://127.0.0.1:${port}/\n儲存至 public/data/；備份位於 .admin-backups/。\n`);
  });
}
