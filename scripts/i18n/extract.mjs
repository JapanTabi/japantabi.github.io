import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse,parseFragment} from 'parse5';
import {parse as parseJS} from 'acorn-loose';
export const normalize=s=>String(s).replace(/\s+/g,' ').trim();
export const idFor=s=>'s'+crypto.createHash('sha256').update(normalize(s)).digest('hex').slice(0,16);
const entries=new Map();
function output(file, text) {
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) throw new Error('Translation source changed: run npm run i18n:extract and npm run i18n:translate (' + file + ')');
  } else fs.writeFileSync(file, text);
}
const HAN=/[\u3400-\u9fff]/u;
const excluded=new Set(['script','style','noscript','code','pre']);
function add(raw,file,kind){const text=normalize(raw);if(/(?:style=|onclick=|class=|_blank|font-weight:|border-radius:)/.test(text))return;if(!HAN.test(text)||/^(https?:|data:|\/\/)/i.test(text)||text.length>12000)return;const id=idFor(text);if(!entries.has(id))entries.set(id,{source:text,uses:[]});const e=entries.get(id);if(e.uses.length<8&&!e.uses.some(u=>u.file===file&&u.kind===kind))e.uses.push({file,kind});}
function html(source,file,fragment=false){const doc=fragment?parseFragment(source):parse(source);function walk(n,blocked=false,controlled=false){blocked=blocked||excluded.has(n.tagName);controlled=controlled||(n.attrs||[]).some(a=>a.name==='data-i18n');if(!blocked&&n.nodeName==='#text')add(n.value,file,n.parentNode?.tagName==='title'?'metadata':controlled?'ui':'text');if(!blocked)for(const a of n.attrs||[]){if(['alt','title','placeholder','aria-label'].includes(a.name)||n.tagName==='meta'&&a.name==='content')add(a.value,file,'attribute');if(/^on[a-z]+$/.test(a.name))js(a.value,file);}if(n.tagName==='script'&&!fragment)js((n.childNodes||[]).map(c=>c.value||'').join(''),file);for(const c of n.childNodes||[])walk(c,blocked,controlled);if(n.content)walk(n.content,blocked,controlled);}walk(doc);}
function string(s,file,kind){if(!HAN.test(s))return;if(/<\/?[a-z][^>]*>/i.test(s))html(s,file,true);else {add(s,file,kind);if(s.includes('\n'))s.split('\n').forEach(line=>add(line,file,kind));}}
function js(source,file){let ast;try{ast=parseJS(source,{ecmaVersion:'latest',sourceType:'module'})}catch{return;}function walk(n,parent){if(!n||typeof n!=='object')return;if(n.type==='Literal'&&typeof n.value==='string'){if(!(parent?.type==='Property'&&parent.key===n&&!parent.computed))string(n.value,file,'script');}else if(n.type==='TemplateLiteral'){let s='';n.quasis.forEach((q,i)=>{s+=(q.value.cooked??q.value.raw);if(i<n.expressions.length)s+='ZXQVAR'+i+'QXZ';});string(s,file,'template');for(const q of n.quasis)string(q.value.cooked??q.value.raw,file,'fragment');}for(const [k,v]of Object.entries(n)){if(k==='quasis')continue;if(Array.isArray(v))v.forEach(c=>walk(c,n));else if(v&&typeof v==='object')walk(v,n);}}walk(ast);}
function* files(root){for(const e of fs.readdirSync(root,{withFileTypes:true})){const p=path.join(root,e.name);if(e.isDirectory())yield*files(p);else yield p;}}
const excludedData=/(?:translations|i18n|special_edition_articles|spot_geo_coords)/;
for(const file of files('src'))if(file.endsWith('.html'))html(fs.readFileSync(file,'utf8'),file);
for(const file of files('public/js'))if(file.endsWith('.js')&&!file.endsWith('site_i18n.js'))js(fs.readFileSync(file,'utf8'),file);
for(const file of files('public/data')){if(file.includes('/site_i18n/'))continue;if(file.endsWith('.js'))js(fs.readFileSync(file,'utf8'),file);if(file.endsWith('.json')&&!excludedData.test(path.basename(file))){function walk(v,k=''){if(typeof v==='string'){if(!/^(id|key|val|url|.*Url|.*_url|img|image|cover|mapcode|name_ja|name_en|name_jp|nameJp|user|comment)$/i.test(k))string(v,file,'data');}else if(v&&typeof v==='object')for(const [key,c]of Object.entries(v))walk(c,key);}walk(JSON.parse(fs.readFileSync(file,'utf8')));}}
// Preserve existing editorial translations by using their exact source strings as memory.
const memory={};function seed(source,copies){const text=normalize(source);if(!text)return;const id=idFor(text);for(const [lang,translation]of Object.entries(copies)){if(typeof translation==='string'&&translation.trim())(memory[lang]??={})[id]=normalize(translation);}}
const ui=JSON.parse(fs.readFileSync('public/data/ui_translations.json'));for(const [k,v]of Object.entries(ui['zh-TW']))seed(v,Object.fromEntries(Object.entries(ui).map(([l,d])=>[l,d[k]])));
const spots=JSON.parse(fs.readFileSync('public/data/spot_translations.json'));for(const e of Object.values(spots.entries))for(const [k,v]of Object.entries(e.source.fields)){add(v,'public/data/spots.json','data');seed(v,Object.fromEntries(Object.entries(e.translations).map(([l,d])=>[l,d[k]])));}
const showcases=JSON.parse(fs.readFileSync('public/data/home_showcase_translations.json'));for(const [group,records]of Object.entries(showcases['zh-TW']))for(const [id,fields]of Object.entries(records))for(const [k,v]of Object.entries(fields))seed(v,Object.fromEntries(Object.entries(showcases).map(([l,d])=>[l,d[group]?.[id]?.[k]])));
const overrides=JSON.parse(fs.readFileSync('scripts/i18n/reviewed-overrides.json','utf8'));
for(const entry of overrides.entries)if(entries.has(idFor(entry.source)))seed(entry.source,entry.translations);
const manifest=JSON.parse(fs.readFileSync('public/manifest.json','utf8'));
for(const key of ['name','short_name','description'])add(manifest[key],'public/manifest.json','metadata');
const sorted=Object.fromEntries([...entries.entries()].sort(([a],[b])=>a.localeCompare(b)));
output('public/data/site_i18n/source.json',JSON.stringify({version:1,sourceLanguage:'zh-TW',entries:sorted},null,2)+'\n');
output('public/data/site_i18n/index.json',JSON.stringify({version:1,entries:Object.entries(sorted).map(([id,e])=>[id,e.source])})+'\n');
output('scripts/i18n/editorial-memory.json',JSON.stringify(memory)+'\n');
console.log(JSON.stringify({strings:entries.size,characters:[...entries.values()].reduce((n,e)=>n+e.source.length,0),memory:Object.fromEntries(Object.entries(memory).map(([l,d])=>[l,Object.keys(d).length]))}));
