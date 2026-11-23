import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, relative, dirname } from 'node:path';
import { Script } from 'node:vm';
import { parse } from 'parse5';

const built = process.argv[2] === 'dist';
const pageRoot = resolve(built ? 'dist' : 'src');
const assetRoot = resolve(built ? 'dist' : 'public');
const errors = [];
const documentBases = new Map();
const uiMessages = JSON.parse(readFileSync(resolve(assetRoot, 'data/ui_translations.json'), 'utf8'));
const uiKeys = Object.keys(uiMessages['zh-TW']);
const supportedLanguages = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'hi', 'es'];
const siteCatalogRoot = resolve(assetRoot, 'data/site_i18n');
const siteSources = JSON.parse(readFileSync(resolve(siteCatalogRoot, 'source.json'), 'utf8')).entries;
const siteIndex = JSON.parse(readFileSync(resolve(siteCatalogRoot, 'index.json'), 'utf8')).entries;
if (siteIndex.length !== Object.keys(siteSources).length || siteIndex.some(([id, text]) => siteSources[id]?.source !== text)) errors.push('Site translations: source index does not match the audit catalog');
for (const lang of supportedLanguages.filter(lang => lang !== 'zh-TW')) {
  const messages = JSON.parse(readFileSync(resolve(siteCatalogRoot, lang + '.json'), 'utf8')).messages;
  for (const [id, entry] of Object.entries(siteSources)) {
    if (typeof messages[id] !== 'string' || !messages[id].trim()) errors.push(`Site translations: ${lang} missing ${id}`);
    else if ((messages[id].match(/ZXQVAR\d+QXZ/g) || []).sort().join(',') !== (entry.source.match(/ZXQVAR\d+QXZ/g) || []).sort().join(',')) errors.push(`Site translations: ${lang}.${id} changed template parameters`);
  }
  for (const id of Object.keys(messages)) if (!siteSources[id]) errors.push(`Site translations: ${lang} unknown source ${id}`);
}
const parameters = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',');
for (const language of supportedLanguages) {
  const messages = uiMessages[language] || {};
  for (const key of uiKeys) {
    if (typeof messages[key] !== 'string' || !messages[key].trim()) {
      errors.push(`UI translations: ${language} is missing ${key}`);
    } else if (parameters(messages[key]) !== parameters(uiMessages['zh-TW'][key])) {
      errors.push(`UI translations: ${language}.${key} has inconsistent placeholders`);
    }
  }
  for (const key of Object.keys(messages)) {
    if (!uiKeys.includes(key)) errors.push(`UI translations: unexpected key ${language}.${key}`);
  }
}
for (const language of Object.keys(uiMessages)) {
  if (!supportedLanguages.includes(language)) errors.push(`UI translations: unsupported language ${language}`);
}
const showcaseMessages = JSON.parse(readFileSync(resolve(assetRoot, 'data/home_showcase_translations.json'), 'utf8'));
const showcaseFields = {
  hot_springs: ['name', 'spring_quality', 'highlights', 'day_trip'],
  festivals: ['name', 'date_display', 'shots', 'badge', 'highlights', 'reserved_seats', 'transit'],
};
for (const [group, fields] of Object.entries(showcaseFields)) {
  const records = JSON.parse(readFileSync(resolve(assetRoot, `data/${group}.json`), 'utf8'));
  const ids = records.map(record => record.id);
  if (new Set(ids).size !== ids.length) errors.push(`Showcase source: duplicate IDs in ${group}`);
  for (const language of supportedLanguages) {
    const entries = showcaseMessages[language]?.[group] || {};
    for (const record of records) {
      const entry = entries[record.id] || {};
      const path = `${language}.${group}.${record.id}`;
      for (const field of fields) {
        if (typeof entry[field] !== 'string' || !entry[field].trim()) {
          errors.push(`Showcase translations: ${path} is missing ${field}`);
        } else if (language === 'zh-TW') {
          const source = field === 'badge' ? record.scale.split('・')[0] : record[field];
          if (entry[field] !== source) errors.push(`Showcase translations: source changed; refresh ${path}.${field}`);
        }
      }
      for (const field of Object.keys(entry)) {
        if (!fields.includes(field)) errors.push(`Showcase translations: unexpected field ${path}.${field}`);
      }
    }
    for (const id of Object.keys(entries)) {
      if (!ids.includes(id)) errors.push(`Showcase translations: unknown source ID ${language}.${group}.${id}`);
    }
  }
}
for (const [language, groups] of Object.entries(showcaseMessages)) {
  if (!supportedLanguages.includes(language)) errors.push(`Showcase translations: unsupported language ${language}`);
  for (const group of Object.keys(groups)) {
    if (!Object.hasOwn(showcaseFields, group)) errors.push(`Showcase translations: unknown group ${language}.${group}`);
  }
}
let jsonCount = 0;
let scriptCount = 0;
const spotMessages = JSON.parse(readFileSync(resolve(assetRoot, 'data/spot_translations.json'), 'utf8'));
const spotSources = JSON.parse(readFileSync(resolve(assetRoot, 'data/spots.json'), 'utf8'));
if (new Set(spotSources.map(row => row.id)).size !== spotSources.length) errors.push('Spot source: duplicate IDs are not permitted');
const spotAliases = JSON.parse(readFileSync(resolve(assetRoot, 'data/spot_aliases.json'), 'utf8')).aliases;
for (const entry of spotAliases) if (!spotSources.some(row => row.id === entry.canonical.id && row.title === entry.canonical.title && row.region === entry.canonical.region)) errors.push('Spot alias target does not match a canonical source: ' + entry.legacy.id);
const spotValue = (record, path) => path.split('.').reduce((value, key) => value?.[key], record);
const spotFields = ['title', 'subtitle', 'tag', 'desc', 'locationDetail', 'bloomStatus', 'species', 'nightHours', 'sakuraCafe.name', 'sakuraCafe.feature'];
for (const [key, entry] of Object.entries(spotMessages.entries || {})) {
  const source = entry.source || {};
  const fields = Object.keys(source.fields || {});
  for (const required of ['title', 'tag', 'desc', 'locationDetail']) {
    if (!fields.includes(required)) errors.push(`Spot translations: ${key} source is missing ${required}`);
  }
  for (const field of fields) {
    if (!spotFields.includes(field)) errors.push(`Spot translations: unknown field ${key}.${field}`);
  }
  if (!spotSources.some(record => record.id === source.id && record.region === source.region && record.theme === source.theme && fields.every(field => spotValue(record, field) === source.fields[field]))) {
    errors.push(`Spot translations: source changed or identity does not match ${key}`);
  }
  for (const language of supportedLanguages) {
    const copy = entry.translations?.[language] || {};
    for (const field of fields) {
      if (typeof copy[field] !== 'string' || !copy[field].trim()) errors.push(`Spot translations: ${key}.${language} is missing ${field}`);
      else if (language === 'zh-TW' && copy[field] !== source.fields[field]) errors.push(`Spot translations: original copy does not match ${key}.${field}`);
    }
    for (const field of Object.keys(copy)) {
      if (!fields.includes(field)) errors.push(`Spot translations: unexpected field ${key}.${language}.${field}`);
    }
  }
  for (const language of Object.keys(entry.translations || {})) {
    if (!supportedLanguages.includes(language)) errors.push(`Spot translations: unsupported language ${key}.${language}`);
  }
}

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
  const target = resolve(path.startsWith('/') ? pageRoot : (documentBases.get(page) || dirname(page)), `.${path.startsWith('/') ? '' : '/'}${path}`);
  const publicTarget = resolve(assetRoot, path.replace(/^\//, ''));
  if (![target, publicTarget].some((p) => existsSync(p) && statSync(p).isFile())) {
    errors.push(`${relative(pageRoot, page)}: missing local resource ${value}`);
  }
}

function inspect(node, page) {
  const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
  for (const [name, key] of Object.entries(attrs)) {
    if ((name === 'data-i18n' || name.startsWith('data-i18n-')) && !uiKeys.includes(key)) {
      errors.push(`${relative(pageRoot, page)}: unknown UI translation key ${key}`);
    }
  }
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

const pages = [...files(pageRoot)].filter(name => name.endsWith('.html')).map(name => relative(pageRoot, name));
for (const name of pages) {
  const page = resolve(pageRoot, name);
  const html = readFileSync(page, 'utf8');
  const base = html.match(/<base[^>]+href=["']([^"']+)["']/i);
  if (base) documentBases.set(page, resolve(dirname(page), base[1]));
  inspect(parse(html), page);
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
  console.log(`Checked ${pages.length} pages, ${jsonCount} JSON files, ${scriptCount} scripts and ${uiKeys.length} UI keys in ${supportedLanguages.length} languages (${built ? 'dist' : 'source'}).`);
}
