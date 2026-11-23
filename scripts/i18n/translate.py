#!/usr/bin/env python3
"""Build static catalogs from public source copy. Editorial translations take priority.
The browser never contacts a translation service. This generator checkpoints each batch.
"""
import html,concurrent.futures,json,pathlib,re,sys,threading,time,urllib.parse,urllib.request
from protected_translation import prepare, restore, GLOSSARY
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'public/data/site_i18n'
source=json.loads((OUT/'source.json').read_text())['entries'];memory=json.loads((ROOT/'scripts/i18n/editorial-memory.json').read_text())
languages=['zh-CN','en','ja','ko','th','vi','hi','es'];lock=threading.Lock();catalogs={};started=time.time();completed=0;errors=[]
TERMS={
'中文教練':['中文教练','Chinese-speaking instructor','中国語対応インストラクター','중국어 가능 강사','ครูฝึกที่พูดภาษาจีน','huấn luyện viên nói tiếng Trung','चीनी भाषा बोलने वाला प्रशिक्षक','instructor que habla chino'],
'中文司導':['中文司导','Chinese-speaking driver-guide','中国語対応ドライバーガイド','중국어 가능 운전 가이드','คนขับรถและไกด์ที่พูดภาษาจีน','tài xế kiêm hướng dẫn viên nói tiếng Trung','चीनी भाषा बोलने वाला चालक-गाइड','conductor y guía que habla chino'],
'中文司機':['中文司机','Chinese-speaking driver','中国語対応ドライバー','중국어 가능 운전기사','คนขับรถที่พูดภาษาจีน','tài xế nói tiếng Trung','चीनी भाषा बोलने वाला चालक','conductor que habla chino'],
'英文菜單':['英文菜单','English-language menu','英語メニュー','영어 메뉴','เมนูภาษาอังกฤษ','thực đơn tiếng Anh','अंग्रेज़ी भाषा का मेनू','menú en inglés']}
ph=re.compile(r'ZXQVAR\d+QXZ')
review_queue={}
if '--review-queue' in sys.argv:
 for row in json.loads(pathlib.Path(sys.argv[sys.argv.index('--review-queue')+1]).read_text()):review_queue.setdefault(row['language'],set()).add(row['id'])
def save(lang):
 tmp=OUT/(lang+'.tmp');tmp.write_text(json.dumps({'version':1,'language':lang,'method':'machine-assisted; editorial memory retained','messages':catalogs[lang]},ensure_ascii=False,separators=(',',':'))+'\n');tmp.replace(OUT/(lang+'.json'))
for lang in languages:
 path=OUT/(lang+'.json');old=json.loads(path.read_text()).get('messages',{}) if path.exists() else {}
 catalogs[lang]={k:re.sub(r'\s+',' ',v).strip() for k,v in old.items() if k in source}
 for key,entry in source.items():
  if '--refresh-terms' in sys.argv and key not in memory.get(lang,{}) and (any(term in entry['source'] for term in TERMS) or re.search(r'\d+h\d+m|[\d.,]+\s*萬?坪',entry['source'])):catalogs[lang].pop(key,None)
 catalogs[lang].update({k:v for k,v in memory.get(lang,{}).items() if k in source})
 for key,entry in source.items():
  if key in memory.get(lang,{}):continue
  if key in review_queue.get(lang,set()) or ('--refresh-glossary' in sys.argv and any(term in entry['source'] for e in GLOSSARY for term in e['terms'])):catalogs[lang].pop(key,None)
def translate(items,lang):
 values=[];protections=[]
 for key in items:
  text,protected=prepare(source[key]['source'],lang)
  values.append(('q',text));protections.append(protected)
 url='https://clients5.google.com/translate_a/t?'+urllib.parse.urlencode({'client':'dict-chrome-ex','sl':'zh-TW','tl':lang})
 req=urllib.request.Request(url,data=urllib.parse.urlencode(values).encode(),headers={'Content-Type':'application/x-www-form-urlencoded','User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=45) as response:data=json.loads(response.read())
 if len(data)!=len(items):raise ValueError('batch response length mismatch')
 result={}
 for i,key in enumerate(items):
  value=data[i] if isinstance(data[i],str) else data[i][0]
  value=restore(value,protections[i],lang)
  if not value.strip():raise ValueError('empty translation: '+key)
  if sorted(ph.findall(value))!=sorted(ph.findall(source[key]['source'])):continue
  result[key]=value.strip()
 return result
def translate_preserving_segments(key,lang):
 # Last-resort translation of prose segments keeps reviewed quantities intact even
 # when the remote service drops an HTML protection span.
 prepared,keep=prepare(source[key]['source'],lang)
 segments=re.split(r'<span class="notranslate" id="(tabikeep\d+)">.*?</span>',prepared)
 prose=[(i,html.unescape(v)) for i,v in enumerate(segments) if i%2==0 and v.strip()]
 if prose:
  req=urllib.request.Request('https://clients5.google.com/translate_a/t?'+urllib.parse.urlencode({'client':'dict-chrome-ex','sl':'zh-TW','tl':lang}),data=urllib.parse.urlencode([('q',v) for _,v in prose]).encode(),headers={'Content-Type':'application/x-www-form-urlencoded','User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=45) as response:data=json.loads(response.read())
  if len(data)!=len(prose):raise ValueError('segment response mismatch')
  for (i,_),value in zip(prose,data):segments[i]=html.unescape(value if isinstance(value,str) else value[0])
 for i in range(1,len(segments),2):segments[i]=keep[segments[i]]
 return re.sub(r'\s+',' ',''.join(segments)).strip()
jobs=[]
for lang in languages:
 batch=[];chars=0
 for key,entry in source.items():
  if key in catalogs[lang]:continue
  prepared_cost=len(prepare(entry['source'],lang)[0])
  if batch and (len(batch)>=100 or chars+prepared_cost>6500):jobs.append((lang,batch));batch=[];chars=0
  batch.append(key);chars+=prepared_cost
 if batch:jobs.append((lang,batch))
print(json.dumps({'strings':len(source),'batches':len(jobs),'existing':{l:len(d) for l,d in catalogs.items()}}),flush=True)
def work(job):
 global completed
 lang,items=job
 for attempt in range(4):
  try:
   result=translate(items,lang)
   with lock:
    catalogs[lang].update(result);completed+=1;save(lang)
    if completed%5==0:print(json.dumps({'done':completed,'total':len(jobs),'seconds':round(time.time()-started),'counts':{l:len(d) for l,d in catalogs.items()}}),flush=True)
   return
  except Exception as e:
   print('RETRY',lang,len(items),type(e).__name__,str(e)[:160],flush=True)
   if isinstance(e,urllib.error.HTTPError) and e.code==429:time.sleep(60)
   elif attempt<3:time.sleep(2**attempt)
   if isinstance(e,ValueError) and len(items)>1:
    middle=len(items)//2;work((lang,items[:middle]));work((lang,items[middle:]));return
 if len(items)==1:
  try:
   value=translate_preserving_segments(items[0],lang)
   with lock:catalogs[lang][items[0]]=value;save(lang)
   return
  except Exception as e:print('SEGMENT FAILED',lang,str(e),flush=True)
 with lock:errors.append(lang+': '+str(items))
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(work,jobs))
for lang in languages:save(lang)
remaining={l:len(set(source)-set(d)) for l,d in catalogs.items()};print(json.dumps({'remaining':remaining,'failedBatches':len(errors),'seconds':round(time.time()-started)}),flush=True)
if any(remaining.values()):raise SystemExit(1)
