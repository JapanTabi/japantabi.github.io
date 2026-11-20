// A strict static server: unlike Vite preview, missing URLs never fall back to HTML.
// The subpath mount makes accidental /images/... requests fail as on GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { port: { type: 'string' }, base: { type: 'string' } } });
const root = resolve('dist');
const base = values.base || '/';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith(base)) throw new Error('Outside site base');
    let target = resolve(root, path.slice(base.length) || 'index.html');
    if (!target.startsWith(root + sep)) throw new Error('Outside static root');
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(Number(values.port || 4173), '127.0.0.1');
