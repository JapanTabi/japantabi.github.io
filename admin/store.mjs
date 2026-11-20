import { readdir, readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { describeFile, notes } from './catalog.mjs';

export class AdminError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const kind = (value) => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

export function createStore({ dataDir, backupDir }) {
  const root = resolve(dataDir);
  const backups = resolve(backupDir);
  let queue = Promise.resolve();

  async function pathFor(file) {
    if (!/^[a-z0-9_]+\.json$/.test(file) || !(await readdir(root)).includes(file)) {
      throw new AdminError(404, '找不到這份資料。');
    }
    return join(root, file);
  }

  async function load(file) {
    const bytes = await readFile(await pathFor(file), 'utf8');
    return { data: JSON.parse(bytes), revision: hash(bytes) };
  }

  function validate(data, original) {
    if (kind(data) !== kind(original)) throw new AdminError(422, '資料最外層的型別必須保持不變。');
    if (Array.isArray(original) && original.length && original.every((item) => kind(item) === 'object')) {
      if (!data.every((item) => kind(item) === 'object')) throw new AdminError(422, '每一筆資料都必須是物件。');
      for (const key of ['id', 'title', 'name']) {
        if (original.every((item) => typeof item[key] === 'string' && item[key].trim())) {
          if (!data.every((item) => typeof item[key] === 'string' && item[key].trim())) throw new AdminError(422, `每筆資料的 ${key} 都必須填寫。`);
        }
      }
      // Existing IDs are not globally unique. Preserve old duplicates, reject additional ones.
      const counts = (items) => {
        const result = new Map();
        for (const item of items) {
          if (item.id !== undefined) result.set(String(item.id), (result.get(String(item.id)) || 0) + 1);
        }
        return result;
      };
      const before = counts(original);
      for (const [id, count] of counts(data)) {
        if (!id.trim() || count > Math.max(1, before.get(id) || 0)) throw new AdminError(422, `ID「${id}」為空或重複，請修改後再儲存。`);
      }
    }
  }

  async function saveNow(file, data, revision, restoreBaseline) {
    const target = await pathFor(file);
    const previous = await readFile(target, 'utf8');
    if (hash(previous) !== revision) throw new AdminError(409, '檔案已被其他操作更新。請先匯出目前草稿，再重新載入最新資料。');
    validate(data, restoreBaseline || JSON.parse(previous));
    const serialized = JSON.stringify(data, null, 2) + '\n';
    if (serialized === previous) return { data, revision, unchanged: true };
    const directory = join(backups, file);
    await mkdir(directory, { recursive: true });
    const backup = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`;
    await writeFile(join(directory, backup), previous, { flag: 'wx' });
    const temporary = join(root, `.${file}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, serialized, { flag: 'wx' });
      // Check again after the backup, before replacing the original file.
      if (hash(await readFile(target, 'utf8')) !== revision) throw new AdminError(409, '儲存期間檔案已更新，請重新載入。');
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(() => {});
    }
    return { data, revision: hash(serialized), backup };
  }

  function save(file, data, revision, restoreBaseline) {
    const task = queue.then(() => saveNow(file, data, revision, restoreBaseline));
    queue = task.catch(() => {});
    return task;
  }

  return {
    load, save,
    async catalog() {
      return Promise.all((await readdir(root)).filter((file) => /^[a-z0-9_]+\.json$/.test(file)).sort().map(async (file) => {
        const { data } = await load(file);
        return { file, ...describeFile(file), note: notes[file] || '', type: kind(data), count: Object.keys(data).length };
      }));
    },
    async history(file) {
      await pathFor(file);
      const directory = join(backups, file);
      const entries = await readdir(directory).catch((error) => error.code === 'ENOENT' ? [] : Promise.reject(error));
      return entries.filter((name) => /^[\w-]+\.json$/.test(name)).sort().reverse().slice(0, 30);
    },
    async restore(file, backup, revision) {
      if (!(await this.history(file)).includes(backup)) throw new AdminError(404, '找不到這份備份。');
      const data = JSON.parse(await readFile(join(backups, file, backup), 'utf8'));
      // Restoring an old version must also preserve the version that is being replaced.
      return save(file, data, revision, data);
    },
  };
}
