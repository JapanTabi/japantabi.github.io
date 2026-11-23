import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, relative, dirname } from 'node:path';
import { Script } from 'node:vm';
import { parse } from 'parse5';

const built = process.argv[2] === 'dist';
const pageRoot = resolve(built ? 'dist' : 'src');
const assetRoot = resolve(built ? 'dist' : 'public');
const errors = [];
let jsonCount = 0;
let scriptCount = 0;

function* files(root) {
  for (const item of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, item.name);
    if (item.isDirectory()) yield* files(path);
    else yield path;
  }
}

function checkScript(source, filename) {
  try {
    new Script(source, { filename });
    scriptCount++;
  } catch (error) {
    errors.push(`${filename}: ${error.message}`);
  }
}

function checkReference(value, page) {
  if (!value || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(value) || value.includes('${')) return;
  const path = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!path) return;
  if (built && path.startsWith('/')) {
    errors.push(`${relative(pageRoot, page)}: root-relative URL breaks project Pages hosting: ${value}`);
  }
  const target = resolve(path.startsWith('/') ? pageRoot : dirname(page), `.${path.startsWith('/') ? '' : '/'}${path}`);
  const publicTarget = resolve(assetRoot, path.replace(/^\//, ''));
  if (![target, publicTarget].some((p) => existsSync(p) && statSync(p).isFile())) {
    errors.push(`${relative(pageRoot, page)}: missing local resource ${value}`);
  }
}

function inspect(node, page) {
  const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
  if (['script', 'img', 'link', 'a', 'source', 'iframe'].includes(node.tagName)) {
    checkReference(attrs.src ?? attrs.href, page);
  }
  if (node.tagName === 'script' && !attrs.src && (!attrs.type || attrs.type === 'text/javascript')) {
    checkScript((node.childNodes || []).map((child) => child.value || '').join(''), page);
  }
  for (const child of node.childNodes || []) inspect(child, page);
  if (node.content) inspect(node.content, page);
}

if (!existsSync(pageRoot)) throw new Error('Run npm run build before checking dist.');

const pages = readdirSync(pageRoot).filter((name) => name.endsWith('.html'));
for (const name of pages) {
  const page = resolve(pageRoot, name);
  inspect(parse(readFileSync(page, 'utf8')), page);
}
for (const path of files(assetRoot)) {
  if (extname(path) === '.json') {
    try {
      JSON.parse(readFileSync(path, 'utf8'));
      jsonCount++;
    } catch (error) {
      errors.push(`${path}: ${error.message}`);
    }
  } else if (extname(path) === '.js') {
    checkScript(readFileSync(path, 'utf8'), path);
    for (const match of readFileSync(path, 'utf8').matchAll(/fetch\(\s*['"](\/?data\/[^'"]+\.json)['"]/g)) {
      checkReference(match[1], resolve(pageRoot, 'index.html'));
    }
  }
}
// Inline data requests also need to survive the directory migration.
for (const name of pages) {
  const page = resolve(pageRoot, name);
  for (const match of readFileSync(page, 'utf8').matchAll(/fetch\(\s*['"](\/?data\/[^'"]+\.json)['"]/g)) {
    checkReference(match[1], page);
  }
}

if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} pages, ${jsonCount} JSON files, ${scriptCount} scripts (${built ? 'dist' : 'source'}).`);
}
