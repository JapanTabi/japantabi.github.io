const $ = (id) => document.getElementById(id);
const state = { files: [], file: '', data: null, original: '', revision: '', selected: null, token: '', dirty: false, raw: false, invalid: false, busy: false };
const labels = {
  id: '識別碼', title: '標題', name: '名稱', desc: '介紹', subtitle: '副標題', theme: '主題', category: '分類',
  region: '地區', img: '圖片網址', image: '圖片網址', tag: '標籤', tags: '標籤清單', locationDetail: '交通與位置',
  klookUrl: 'Klook 導購連結', bookingUrl: '飯店導購連結', ticket_url: '購票連結', url: '連結',
  comment: '情報內容', user: '投稿者', season: '季節', time: '時間', spot: '景點', bloom: '花況',
  lat: '緯度', lng: '經度', rank: '排序', route_category: '路線地區', section: '行駛區間',
  operator: '營運單位', highlights: '特色亮點', stations: '停靠車站', itinerary: '建議行程',
  snow: '雪況', transit: '交通', hotels: '飯店', updated_at: '更新時間', official_url: '官方網址',
  name_zh: '中文名稱', name_ja: '日文名稱', jp: '日文名稱', en: '英文名稱',
};
const stringify = (data) => JSON.stringify(data, null, 2);
const clone = (data) => structuredClone(data);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const entries = () => Array.isArray(state.data) ? state.data.map((value, key) => [key, value]) : Object.entries(state.data || {});
const titleOf = (value, key) => object(value) ? String(value.title || value.name || value.name_zh || value.spot || value.id || key) : Array.isArray(value) ? `${key} · ${value.length} 筆` : String(key);
const selectedValue = () => state.selected === null ? undefined : state.data[state.selected];
const meta = () => state.files.find((item) => item.file === state.file);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function notice(message, success = false) {
  $('notice').textContent = message;
  $('notice').className = `notice${success ? ' success' : ''}`;
  $('notice').hidden = !message;
}

async function api(path, method = 'GET', body) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': state.token },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '操作失敗。');
  return result;
}

function updateStatus() {
  state.dirty = state.invalid || (state.data !== null && stringify(state.data) !== state.original);
  $('save-status').textContent = state.busy ? '處理中…' : state.invalid ? 'JSON 格式有誤' : state.dirty ? '有未儲存變更' : '所有變更已儲存';
  $('save-status').className = state.dirty ? 'dirty' : '';
  $('save').disabled = !state.dirty || state.invalid || state.busy;
  for (const id of ['add', 'duplicate', 'delete', 'history', 'reload', 'file-select', 'form-tab', 'json-tab']) $(id).disabled = state.busy || !state.file;
  $('form-tab').disabled ||= state.invalid;
  $('duplicate').disabled ||= state.selected === null || state.raw;
  $('delete').disabled ||= state.selected === null || state.raw;
  $('add').disabled ||= state.raw;
  $('record-count').textContent = entries().length;
}

function changed() { updateStatus(); }

function setAt(path, value) {
  if (!path.length) { state.data = value; return changed(); }
  let parent = state.data;
  for (const key of path.slice(0, -1)) parent = parent[key];
  Object.defineProperty(parent, path.at(-1), { value, writable: true, enumerable: true, configurable: true });
  changed();
}

function labelFor(key) {
  const label = node('span', 'field-name', labels[key] || key);
  if (labels[key]) label.append(node('code', '', key));
  return label;
}

function blank(value) {
  if (Array.isArray(value)) return [];
  if (object(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blank(item)]));
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  return value === null ? null : '';
}

let fieldNumber = 0;
function field(key, value, path) {
  const wrapper = node('div', 'field');
  if (Array.isArray(value) || object(value)) {
    const details = node('details');
    details.dataset.path = JSON.stringify(path);
    const summary = node('summary', '', `${labels[key] || key} · ${Object.keys(value).length} ${Array.isArray(value) ? '項' : '欄位'}`);
    details.append(summary);
    const content = node('div', 'nested-fields');
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const row = node('div', 'array-item');
        const toolbar = node('div', 'array-toolbar');
        toolbar.append(node('span', '', `第 ${index + 1} 項`));
        const buttons = node('div');
        for (const [text, delta] of [['↑', -1], ['↓', 1]]) {
          const button = node('button', '', text);
          button.type = 'button'; button.title = delta < 0 ? '往前移動' : '往後移動';
          button.disabled = index + delta < 0 || index + delta >= value.length;
          button.onclick = () => { [value[index], value[index + delta]] = [value[index + delta], value[index]]; changed(); renderEditor(); };
          buttons.append(button);
        }
        const remove = node('button', 'danger', '移除'); remove.type = 'button';
        remove.onclick = () => { if (confirm('確定移除這一項？')) { value.splice(index, 1); changed(); renderEditor(); } };
        buttons.append(remove); toolbar.append(buttons); row.append(toolbar, field('內容', item, [...path, index])); content.append(row);
      });
      const add = node('button', 'small', '＋ 新增一項'); add.type = 'button';
      add.onclick = () => { value.push(value.length ? blank(value[0]) : ''); changed(); renderEditor(); };
      content.append(add);
    } else {
      for (const [child, item] of Object.entries(value)) content.append(field(child, item, [...path, child]));
    }
    details.append(content); wrapper.append(details); return wrapper;
  }
  const id = `field-${++fieldNumber}`;
  const label = node('label'); label.htmlFor = id; label.append(labelFor(key));
  let control;
  const isLong = typeof value === 'string' && (value.length > 110 || /desc|comment|quote|^p\d|content|summary|tips|intro/i.test(key));
  if (typeof value === 'boolean') {
    control = node('input'); control.type = 'checkbox'; control.checked = value;
    control.onchange = () => setAt(path, control.checked);
  } else if (typeof value === 'number') {
    let lastValid = value;
    control = node('input'); control.type = 'number'; control.step = 'any'; control.value = value;
    control.oninput = () => {
      control.setCustomValidity(control.value === '' ? '請輸入數字。' : '');
      if (control.value !== '' && Number.isFinite(Number(control.value))) {
        lastValid = Number(control.value); setAt(path, lastValid);
      }
    };
    control.onblur = () => { if (control.value === '') { control.value = lastValid; control.setCustomValidity(''); } };
  } else if (value === null) {
    control = node('input'); control.value = 'null'; control.disabled = true;
    wrapper.append(node('p', 'muted', '此欄位為 null，可在整份 JSON 編輯中調整型別。'));
  } else {
    control = node(isLong ? 'textarea' : 'input'); control.value = value;
    control.oninput = () => setAt(path, control.value);
  }
  control.id = id;
  control.dataset.field = key;
  if (/url|link/i.test(key)) control.spellcheck = false;
  wrapper.prepend(label); wrapper.append(control);
  if (typeof value === 'string' && /^(img|image|photo)$/.test(key) && value && !/^(?:javascript|data):/i.test(value)) {
    const image = node('img', 'image-preview');
    image.alt = '目前圖片'; image.loading = 'lazy';
    const relative = value.replace(/^\.\//, '').replace(/^\//, '');
    image.src = relative.startsWith('images/') ? `/site/${relative}` : value;
    image.onerror = () => image.hidden = true;
    wrapper.append(image);
  }
  return wrapper;
}

function renderEditor() {
  const openSections = new Set([...$('fields').querySelectorAll('details[open]')].map((section) => section.dataset.path));
  $('form-panel').hidden = state.raw;
  $('json-panel').hidden = !state.raw;
  $('form-tab').setAttribute('aria-selected', String(!state.raw));
  $('json-tab').setAttribute('aria-selected', String(state.raw));
  if (state.raw) { $('json-editor').value = stringify(state.data); return updateStatus(); }
  $('fields').replaceChildren();
  const value = selectedValue();
  $('record-title').textContent = state.selected === null ? '選擇或新增一筆資料' : titleOf(value, state.selected);
  $('record-key').textContent = state.selected === null ? '' : `資料位置：${state.selected} · ${state.file}`;
  fieldNumber = 0;
  if (state.selected !== null) {
    if (object(value)) for (const [key, item] of Object.entries(value)) $('fields').append(field(key, item, [state.selected, key]));
    else $('fields').append(field('內容', value, [state.selected]));
  }
  for (const section of $('fields').querySelectorAll('details')) section.open = openSections.has(section.dataset.path);
  updateStatus();
}

function renderList() {
  const query = $('search').value.trim().toLowerCase();
  const items = entries().filter(([key, value]) => !query || `${key} ${JSON.stringify(value)}`.toLowerCase().includes(query));
  $('search-count').textContent = `顯示 ${items.length} / ${entries().length} 筆`;
  $('record-list').replaceChildren();
  for (const [key, value] of items) {
    const button = node('button', `record-item${state.selected === key ? ' active' : ''}`);
    button.setAttribute('role', 'listitem');
    button.append(node('strong', '', titleOf(value, key)), node('small', '', object(value) ? [value.id, value.region || value.route_category || value.city, value.tag].filter(Boolean).join(' · ') || String(key) : String(key)));
    button.onclick = () => { state.selected = key; renderList(); renderEditor(); };
    $('record-list').append(button);
  }
  if (!items.length) $('record-list').append(node('div', 'empty', query ? '找不到符合的資料' : '這份資料還沒有項目'));
}

function renderNavigation() {
  $('navigation').replaceChildren(); $('file-select').replaceChildren();
  const groups = Map.groupBy(state.files, (item) => item.group);
  for (const [group, items] of groups) {
    $('navigation').append(node('h2', 'nav-group', group));
    const options = node('optgroup'); options.label = group;
    for (const item of items) {
      const button = node('button', `nav-link${item.file === state.file ? ' active' : ''}`, item.title);
      button.append(node('span', '', item.count)); button.onclick = () => loadFile(item.file);
      $('navigation').append(button);
      const option = node('option', '', item.title); option.value = item.file; options.append(option);
    }
    $('file-select').append(options);
  }
  $('file-select').value = state.file;
}

async function loadFile(file, force = false) {
  if (state.busy) return;
  if (!force && state.dirty && !confirm('目前有未儲存的變更。確定捨棄並切換資料？')) { $('file-select').value = state.file; return; }
  state.busy = true; updateStatus();
  try {
    const result = await api(`/api/data/${file}`);
    Object.assign(state, { file, data: result.data, revision: result.revision, original: stringify(result.data), selected: Object.keys(result.data)[0] ?? null, raw: false, invalid: false });
    if (Array.isArray(result.data) && state.selected !== null) state.selected = Number(state.selected);
    $('search').value = ''; $('json-error').textContent = '';
    const item = meta();
    $('page-title').textContent = item.title;
    $('group-label').textContent = item.group;
    $('file-description').textContent = `public/data/${file} · ${Array.isArray(result.data) ? '列表' : '分類物件'}資料`;
    $('file-note').textContent = item.note; $('file-note').hidden = !item.note;
    item.count = entries().length;
    renderNavigation(); renderList(); renderEditor(); notice('');
    localStorage.setItem('tabi-admin-file', file);
  } catch (error) { notice(error.message); }
  finally { state.busy = false; updateStatus(); }
}

async function save() {
  if (!state.dirty || state.invalid || state.busy) return;
  state.busy = true; updateStatus();
  try {
    const result = await api(`/api/data/${state.file}`, 'PUT', { data: state.data, revision: state.revision });
    state.revision = result.revision; state.original = stringify(result.data);
    meta().count = entries().length; renderNavigation(); renderList();
    notice('已儲存到本機，並保留修改前的備份。推送到 main 後，正式網站才會更新。', true);
  } catch (error) { notice(error.message); }
  finally { state.busy = false; updateStatus(); }
}

let addMode = 'new';
function beginAdd(mode) {
  addMode = mode; $('add-title').textContent = mode === 'duplicate' ? '複製資料' : '新增資料';
  $('new-key-label').textContent = Array.isArray(state.data) ? '新資料 ID（沒有 ID 欄位時可留空）' : '新的分類鍵值';
  $('new-key').required = !Array.isArray(state.data);
  const selected = selectedValue();
  $('new-key').value = mode === 'duplicate' ? `${object(selected) ? selected.id || state.selected : state.selected}_copy` : '';
  $('add-dialog').showModal();
}

$('add-dialog').addEventListener('close', () => {
  if ($('add-dialog').returnValue !== 'add') return;
  const key = $('new-key').value.trim();
  const original = JSON.parse(state.original);
  const template = selectedValue() ?? entries()[0]?.[1] ?? Object.values(original)[0] ?? {};
  const value = addMode === 'duplicate' ? clone(template) : blank(template);
  if (Array.isArray(state.data)) {
    if (object(value) && Object.hasOwn(value, 'id')) {
      if (!key || state.data.some((item) => String(item.id) === key)) return notice('請輸入不重複的 ID，再重新新增。');
      value.id = key;
    }
    state.data.push(value); state.selected = state.data.length - 1;
  } else {
    if (!key || ['__proto__', 'prototype', 'constructor'].includes(key) || Object.hasOwn(state.data, key)) return notice('分類鍵值為空、重複或不允許使用，請重新新增。');
    Object.defineProperty(state.data, key, { value, writable: true, enumerable: true, configurable: true }); state.selected = key;
  }
  $('search').value = ''; changed(); renderList(); renderEditor(); notice('新資料已加入草稿，請補齊內容後儲存。');
});

$('save').onclick = save;
$('search').oninput = renderList;
$('file-select').onchange = (event) => loadFile(event.target.value);
$('add').onclick = () => beginAdd('new');
$('duplicate').onclick = () => beginAdd('duplicate');
$('delete').onclick = () => {
  if (state.selected === null || !confirm(`確定從草稿刪除「${titleOf(selectedValue(), state.selected)}」？儲存後才會修改檔案。`)) return;
  if (Array.isArray(state.data)) state.data.splice(state.selected, 1); else delete state.data[state.selected];
  state.selected = entries()[0]?.[0] ?? null;
  changed(); renderList(); renderEditor();
};
$('form-tab').onclick = () => { if (!state.invalid) { state.raw = false; renderList(); renderEditor(); } };
$('json-tab').onclick = () => { state.raw = true; renderEditor(); };
$('json-editor').oninput = () => {
  try {
    const data = JSON.parse($('json-editor').value);
    if (!data || typeof data !== 'object' || Array.isArray(data) !== Array.isArray(JSON.parse(state.original))) throw new Error('最外層必須保持原有的陣列或物件。');
    state.data = data; state.invalid = false; $('json-error').textContent = '';
    if (!Object.hasOwn(data, state.selected)) state.selected = entries()[0]?.[0] ?? null;
  } catch (error) { state.invalid = true; $('json-error').textContent = error.message; }
  updateStatus();
};
$('reload').onclick = () => { if (!state.dirty || confirm('確定捨棄所有未儲存變更，重新讀取檔案？')) loadFile(state.file, true); };
$('export').onclick = () => {
  const content = state.raw ? $('json-editor').value : stringify(state.data);
  const url = URL.createObjectURL(new Blob([content + '\n'], { type: 'application/json' }));
  const link = node('a'); link.href = url; link.download = state.file; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('history').onclick = async () => {
  try {
    const history = await api(`/api/data/${state.file}/history`);
    $('history-list').replaceChildren();
    if (!history.length) $('history-list').append(node('p', 'empty', '還沒有備份。第一次儲存時會自動建立。'));
    for (const backup of history) {
      const row = node('div', 'history-row');
      row.append(node('span', '', backup.slice(0, 19).replace('T', ' ') + ' UTC'));
      const restore = node('button', 'small', '還原');
      restore.onclick = async () => {
        if (!confirm('確定還原這個版本？未儲存草稿會被捨棄，目前已儲存版本會另行備份。')) return;
        restore.disabled = true;
        try {
          await api(`/api/data/${state.file}/restore`, 'POST', { backup, revision: state.revision });
          $('history-dialog').close(); await loadFile(state.file, true); notice('已還原備份並儲存到本機。', true);
        } catch (error) { $('history-dialog').close(); notice(error.message); }
        finally { restore.disabled = false; }
      };
      row.append(restore); $('history-list').append(row);
    }
    $('history-dialog').showModal();
  } catch (error) { notice(error.message); }
};
$('close-history').onclick = () => $('history-dialog').close();
window.addEventListener('beforeunload', (event) => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); } });

try {
  const result = await api('/api/catalog'); state.files = result.files.sort((a, b) => a.order - b.order); state.token = result.token;
  const saved = localStorage.getItem('tabi-admin-file');
  const first = state.files.find((item) => item.file === saved)?.file || state.files.find((item) => item.file === 'spots.json')?.file || state.files[0]?.file;
  if (first) await loadFile(first); else notice('public/data/ 中沒有可編輯的 JSON。');
} catch (error) { notice(`後台無法啟動：${error.message}`); }
