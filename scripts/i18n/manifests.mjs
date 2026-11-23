import fs from 'node:fs';
import '../../public/js/translation_memory.js';
const root='public/data/site_i18n/';const {entries}=JSON.parse(fs.readFileSync(root+'index.json'));
const source=JSON.parse(fs.readFileSync('public/manifest.json'));
fs.mkdirSync(root+'manifests',{recursive:true});
for(const lang of ['zh-TW','zh-CN','en','ja','ko','th','vi','hi','es']){
 const messages=lang==='zh-TW'?{}:JSON.parse(fs.readFileSync(root+lang+'.json')).messages;
 const t=TabiTranslationMemory.create(entries,messages);
 const manifest={...source,name:t.text(source.name),short_name:t.text(source.short_name),description:t.text(source.description),lang,start_url:'../../../index.html?lang='+lang,scope:'../../../',id:'../../../index.html'};
 fs.writeFileSync(root+'manifests/'+lang+'.json',JSON.stringify(manifest,null,2)+'\n');
}
console.log('Generated nine localized install manifests.');
