import fs from 'node:fs';
import {compareFigures} from './numeric-facts.mjs';
const root='public/data/site_i18n/';
const source=JSON.parse(fs.readFileSync(root+'source.json')).entries;
const index=JSON.parse(fs.readFileSync(root+'index.json')).entries;
const languages=['zh-CN','en','ja','ko','th','vi','hi','es'];
const placeholders=t=>(t.match(/ZXQVAR\d+QXZ/g)||[]).sort().join(',');
const errors=[],review=[],catalogs={};let numericComparisons=0;
for(const lang of languages){
 const {messages}=JSON.parse(fs.readFileSync(root+lang+'.json'));catalogs[lang]=messages;
 for(const [id,entry]of Object.entries(source)){
  const value=messages[id];
  if(typeof value!=='string'||!value.trim()){errors.push(lang+' missing '+id);continue;}
  if(placeholders(value)!==placeholders(entry.source))errors.push(lang+' changed template variables '+id);
  if(/ZXQ(?:NUM|TERM)\d+QXZ|tabikeep\d|class="notranslate"/.test(value))errors.push(lang+' unexpanded protection token '+id);
  if(/\d(?:\.\d+)?e\+\d+/.test(value))errors.push(lang+' scientific notation in travel copy '+id);
  if(/\d/.test(entry.source)){
   numericComparisons++;
   const comparison=compareFigures(entry.source,value,lang);
   if(!comparison.ok)review.push({language:lang,id,source:entry.source,translation:value,missing:comparison.missing});
  }
 }
 for(const id of Object.keys(messages))if(!source[id])errors.push(lang+' stale key '+id);
}
if(index.length!==Object.keys(source).length)errors.push('index size mismatch');
const baseline=JSON.parse(fs.readFileSync('docs/i18n/numeric-review-baseline.json'));
const resolutions=baseline.map(row=>{
 const current=catalogs[row.language]?.[row.id];
 const status=!source[row.id]?'source-retired':!compareFigures(row.source,current||'',row.language).ok?'unresolved':compareFigures(row.source,row.translation,row.language).ok?'format-equivalent':'translation-corrected';
 return {language:row.language,id:row.id,source:row.source,previousTranslation:row.translation,currentTranslation:current??null,status};
});
const summary={strings:Object.keys(source).length,languages:9,numericComparisons,errors:errors.length,numericReview:review.length,baseline:baseline.length,resolutions:Object.fromEntries([...new Set(resolutions.map(r=>r.status))].map(s=>[s,resolutions.filter(r=>r.status===s).length]))};
fs.mkdirSync('docs/i18n',{recursive:true});
fs.writeFileSync('docs/i18n/numeric-review.json',JSON.stringify(review,null,2)+'\n');
fs.writeFileSync('docs/i18n/numeric-resolutions.json',JSON.stringify({summary,resolutions},null,2)+'\n');
console.log(JSON.stringify(summary));
if(errors.length||review.length){console.error(errors.slice(0,30).join('\n'));if(review.length)console.error('Unresolved numeric differences: see docs/i18n/numeric-review.json');process.exitCode=1;}
