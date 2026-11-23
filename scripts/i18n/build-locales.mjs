import fs from 'node:fs';
import path from 'node:path';
import {parse,serialize} from 'parse5';
import '../../public/js/translation_memory.js';
const root=path.resolve('dist');
const {entries}=JSON.parse(fs.readFileSync(path.join(root,'data/site_i18n/index.json'),'utf8'));
const languages=['zh-TW','zh-CN','en','ja','ko','th','vi','hi','es'];
const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
const originals=new Map(pages.map(name=>[name,fs.readFileSync(path.join(root,name),'utf8')]));
const skip=new Set(['script','style','noscript','code','pre','textarea']);
const attr=(node,key)=>(node.attrs||[]).find(a=>a.name===key)?.value;
function set(node,key,value){const current=node.attrs.find(a=>a.name===key);if(current)current.value=value;else node.attrs.push({name:key,value});}
function elem(tag,attrs={},parent){return{nodeName:tag,tagName:tag,attrs:Object.entries(attrs).map(([name,value])=>({name,value})),namespaceURI:'http://www.w3.org/1999/xhtml',childNodes:[],parentNode:parent};}
for(const language of languages){
 const messages=language==='zh-TW'?{}:JSON.parse(fs.readFileSync(path.join(root,'data/site_i18n',language+'.json'),'utf8')).messages;
 const memory=TabiTranslationMemory.create(entries,messages);
 fs.mkdirSync(path.join(root,language),{recursive:true});
 for(const name of pages){
  const doc=parse(originals.get(name));let head;
  function walk(node,blocked=false){
   if(node.tagName==='html'){set(node,'lang',language);set(node,'data-page-language',language);}
   if(node.tagName==='head')head=node;
   blocked=blocked||skip.has(node.tagName)||attr(node,'translate')==='no'||attr(node,'data-i18n-skip')!==undefined||/\blang-menu-opt\b|\bbtn-trans-choice\b/.test(attr(node,'class')||'');
   if(!blocked&&node.attrs){
    if(node.tagName==='meta'&&attr(node,'property')==='og:locale')set(node,'content',({'zh-TW':'zh_TW','zh-CN':'zh_CN',en:'en_US',ja:'ja_JP',ko:'ko_KR',th:'th_TH',vi:'vi_VN',hi:'hi_IN',es:'es_ES'})[language]);
    const names=['title','alt','placeholder','aria-label'];
    if(node.tagName==='meta'&&/^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description)$/.test(attr(node,'name')||attr(node,'property')||''))names.push('content');
    for(const key of names){const original=attr(node,key);if(!original)continue;const translated=memory.text(original);if(translated!==original){set(node,'data-tabi-source-'+key,original);set(node,key,translated);}}
    if(node.tagName==='link'&&attr(node,'rel')==='manifest')set(node,'href','data/site_i18n/manifests/'+language+'.json');
    if(node.tagName==='a'){
     const href=attr(node,'href');
     if(href&&!/^(?:https?:|mailto:|tel:|javascript:|\/\/|#)/.test(href)){
      const url=new URL(href,'https://tabi.invalid/');const file=url.pathname.replace(/^\//,'');
      if(pages.includes(file)){url.searchParams.set('lang',language);set(node,'href',language+'/'+file+url.search+url.hash);}
     }
    }
   }
   for(const child of [...(node.childNodes||[])]){
    if(!blocked&&child.nodeName==='#text'&&language!=='zh-TW'){
     const original=child.value,translated=memory.text(original);
     if(node.tagName==='option'&&attr(node,'value')===undefined)set(node,'value',original.trim());
     if(translated!==original){
      if(node.tagName==='title'||node.tagName==='option')set(node,'data-tabi-source-text',original);
      else{const comment={nodeName:'#comment',data:'tabi:'+Buffer.from(original,'utf8').toString('base64'),parentNode:node};node.childNodes.splice(node.childNodes.indexOf(child),0,comment);}
      child.value=translated;
     }
    }else walk(child,blocked);
   }
   if(node.content)walk(node.content,blocked);
  }
  walk(doc);
  const base=elem('base',{href:'../'},head);head.childNodes.unshift(base);
  head.childNodes.push(elem('link',{rel:'canonical',href:language+'/'+name},head));
  for(const lang of languages)head.childNodes.push(elem('link',{rel:'alternate',hreflang:lang,href:lang+'/'+name},head));
  head.childNodes.push(elem('link',{rel:'alternate',hreflang:'x-default',href:name},head));
  fs.writeFileSync(path.join(root,language,name),serialize(doc));
 }
}
// Root pages advertise static, crawler-readable language versions as well.
for(const name of pages){const doc=parse(originals.get(name));let head;function find(n){if(n.tagName==='head')head=n;for(const c of n.childNodes||[])find(c);}find(doc);for(const lang of languages)head.childNodes.push(elem('link',{rel:'alternate',hreflang:lang,href:lang+'/'+name},head));fs.writeFileSync(path.join(root,name),serialize(doc));}
console.log(`Generated ${pages.length*languages.length} localized HTML pages with titles, descriptions and language links.`);
