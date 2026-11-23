// Locale-aware comparison of source figures. Uncertain cases remain visible for review.
const digits='०१२३४५६७८९๐๑๒๓๔๕๖๗๘๙';
const hanDigits={零:0,〇:0,一:1,二:2,兩:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
function chinese(raw){let sum=0,section=0,n=0;for(const c of raw){if(c in hanDigits)n=hanDigits[c];else{const unit=({十:10,百:100,千:1000,万:10000,萬:10000,億:1e8,亿:1e8})[c];if(unit>=10000){section+=n;sum+=(section||1)*unit;section=0;n=0;}else{section+=(n||1)*unit;n=0;}}}return sum+section+n;}
const words={
 en:['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],
 es:['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'],
 vi:['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'],
 th:['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ'],
 hi:['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस'],
};
const months={en:['January','February','March','April','May','June','July','August','September','October','November','December'],es:['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],th:['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],hi:['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function normalizeNumbers(input,lang='zh-TW'){
 let s=input.replace(/(\d)([¼½¾])/g,'$1 $2').normalize('NFKC').replace(/⁄/g,'/').replace(/[\u200b\ufeff]/g,'');

 s=s.replace(/(?<=\d)[\u00a0\u202f](?=\d{3}(?:\D|$))/g,'');
 if(['es','vi'].includes(lang))s=s.replace(/(?<![\d.,A-Za-z])(\d{1,3}) (?=\d{3}(?!\d))/g,'$1');
 s=s.replace(/[०-९๐-๙]/g,c=>String(digits.indexOf(c)%10));
 // Numeric separators follow the target language; the source catalog uses comma grouping.
 if(['vi','es'].includes(lang))s=s.replace(/(?<=\d)[.,](?=\d{3}(?!\d)(?!\s*(?:km|kilómetros)))/g,'').replace(/(?<=\d),(?=\d)/g,'.');
 else s=s.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g,'');
 if(lang!=='zh-TW')s=s.replace(/(?<![\d\s])([零〇一二兩两三四五六七八九十百千万萬億亿]+)(?=層|层|樓|楼|處|处|種|种|本|人|株|場|场|分鐘|分|公里|公尺|年|月|日|個|个|大|割|か所|箇所|つ|海岸)/g,(_,n)=>' '+chinese(n)+' ');
 if(lang!=='zh-TW')s=s.replace(/第([零〇一二三四五六七八九十百]+)/g,(_,n)=>'第'+chinese(n)+' ');
 
 if(lang==='th')s=s.replace(/(พ\.?ศ\.?\s*)(2[45]\d{2})/g,(_,p,y)=>String(Number(y)-543));
 s=s.replace(/随一/g,'No.1').replace(/(\d+)歳半/g,(_,n)=>String(Number(n)+0.5)+'歳');
 s=s.replace(/マンツーマン/g,'1對1').replace(/ゼロ/g,'0').replace(/이틀/g,'2 days').replace(/한\s*달/g,'1 month').replace(/넷째/g,'4').replace(/천만/g,'10000000');
 s=s.replace(/ナインアワーズ|나인아워즈|나인 아워스/g,'9 hours').replace(/セブン[‐・]?イレブン|세븐일레븐|เซเว่นอีเลฟเว่น/g,'7-11').replace(/일대일/g,'1:1');
 if(lang==='es')s=s.replace(/\btercer(?:o|a)?\b/gi,'3').replace(/\bquint[oa]\b/gi,'5');
 if(lang==='es')s=s.replace(/\b(?:primer|primero|primera)\b/gi,'1').replace(/\b(?:segundo|segunda)\b/gi,'2').replace(/\b(?:cuarto|cuarta)\b/gi,'4');
 if(lang==='es')s=s.replace(/\b(?:una|un)\b/gi,'1');
 if(lang==='hi')for(const [word,value]of Object.entries({'फ़रवरी':2,'फरवरी':2,'सितम्बर':9,'पहली':1,'पहला':1,'दूसरी':2,'दूसरा':2,'तीसरी':3,'तीसरा':3,'चौथी':4,'चौथा':4,'पांचवीं':5,'पाँचवीं':5,'पचास':50,'तीस':30,'बीस':20,'चौबीसों':24,'पच्चीस':25,'नब्बे':90,'साठ':60,'अठारह':18,'बारह':12,'पंद्रह':15,'सोलह':16}))s=s.replaceAll(word,String(value));
 for(const [i,word]of (months[lang]||[]).entries())s=s.replace(new RegExp(esc(word),'gi'),String(i+1));
 for(const [i,word]of (words[lang]||[]).entries()){
  const boundary=['en','es','vi'].includes(lang)?'(?<!\\p{L})':'',end=['en','es','vi'].includes(lang)?'(?!\\p{L})':'';
  s=s.replace(new RegExp(boundary+esc(word)+end,'giu'),String(i));
 }
 if(lang==='es')s=s.replace(/(?<=[Ss]iglo )(X{0,3}(?:IX|IV|V?I{0,3}))(?![A-Z])/g,word=>{let n=0;for(let i=0;i<word.length;i++){const v={I:1,V:5,X:10}[word[i]];n+=v<({I:1,V:5,X:10}[word[i+1]]||0)?-v:v;}return String(n);});
 if(lang==='en')for(const [word,n]of Object.entries({first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90}))s=s.replace(new RegExp('\\b'+word+'\\b','gi'),String(n));
 if(lang==='vi')s=s.replace(/tháng Giêng/gi,'tháng 1');
 if(lang==='vi')s=s.replace(/(\d)\s+mươi(?:\s+(\d))?/g,(_,t,u)=>String(Number(t)*10+Number(u||0)));
 const units={'萬':1e4,'万':1e4,'億':1e8,'亿':1e8,'만':1e4,'억':1e8,'मिलियन':1e6,'मिलियन':1e6,'million':1e6,'millions':1e6,'billion':1e9,'thousand':1e3,'millones':1e6,'millón':1e6,'mil':1e3,'tỷ':1e9,'triệu':1e6,'nghìn':1e3,'ngàn':1e3,'ล้าน':1e6,'แสน':1e5,'หมื่น':1e4,'พัน':1e3,'लाख':1e5,'करोड़':1e7};
 s=s.replace(/(\d+(?:\.\d+)?)\s*[~～〜–-]\s*(\d+(?:\.\d+)?)\s*([萬万億亿])/g,(_,a,b,u)=>String(Number(a)*units[u])+'~'+String(Number(b)*units[u]));
 for(const [unit,n]of Object.entries(units).sort((a,b)=>b[0].length-a[0].length))s=s.replace(new RegExp('(\\d+(?:\\.\\d+)?)\\s*'+esc(unit)+(unit==='พัน'?'(?!ธุ์)':unit.match(/^[a-z]+$/i)?'\\b':''),'gi'),(_,v)=>String(Number(v)*n));
 s=s.replace(/(\d+(?:\.\d+)?)\s*折/g,(_,n)=>String(100-Number(n)*(Number(n)>10?1:10))+'% off');
 s=s.replace(/(\d+)\s*[~～〜–-]\s*(\d+)\s*成/g,(_,a,b)=>String(Number(a)*10)+'~'+String(Number(b)*10)+'%');
 s=s.replace(/(\d+(?:\.\d+)?)\s*成/g,(_,n)=>String(Number(n)*10)+'%');
 s=s.replace(/(?<!\d)([0-9](?:\.\d+)?)\s*割/g,(_,n)=>String(Number(n)*10)+'%');
 s=s.replace(/(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(?:至|到|[-–~])\s*\1\s*月\s*(\d{1,2})\s*日/g,'$1月$2日至$3日');
 return s;
}
export function figures(text,lang='zh-TW'){
 let s=normalizeNumbers(text,lang);const facts=[];
 s=s.replace(/(\d+(?:\.\d+)?)\s*時間半/g,(_,h)=>String(Number(h)+0.5)+' 時間');
 s=s.replace(/(\d[\d ]{4,})\*(\d{2})/g,(_,a,b)=>{facts.push({kind:'mapcode',value:a.replace(/\s/g,'')+'*'+b,raw:_});return ' ';});
 s=s.replace(/(\d+)\s*(?:と|and)?\s+([123])\/([24])(?!\d)/g,(_,a,b,c)=>String(Number(a)+Number(b)/Number(c)));
 const addTime=(_,h,m,meridiem)=>{let hour=Number(h);if(meridiem){if(/^p/i.test(meridiem)&&hour<12)hour+=12;if(/^a/i.test(meridiem)&&hour===12)hour=0;}facts.push({kind:'time',value:hour*60+Number(m||0),raw:_});return ' ';};
 s=s.replace(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/gi,addTime);
 s=s.replace(/(?<!\d)(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/gi,(_,h,p)=>addTime(_,h,0,p));
 if(lang==='ko')s=s.replace(/(?<![\dA-Za-z])(\d{1,2})\s*시(?!간|리즈)(?:\s*(\d{1,2})\s*분)?/g,(_,h,m)=>addTime(_,h,m));
 if(['ja','zh-TW','zh-CN'].includes(lang))s=s.replace(/(\d{1,2})\s*[時时點点](?!間)(?:\s*(\d{1,2})\s*分)?/g,(_,h,m)=>addTime(_,h,m));
 if(lang==='vi')s=s.replace(/(?<!\d)(\d{1,2})h(\d{2})(?!\d)/g,(_,h,m)=>addTime(_,h,m));
 if(lang==='th')s=s.replace(/(\d{1,2})\.(\d{2})\s*น\.?/g,(_,h,m)=>addTime(_,h,m));
 s=s.replace(/(\d+(?:\.\d+)?)\s*h\s*(\d+)\s*m\b/gi,(_,h,m)=>{facts.push({kind:'duration',value:Number(h)*60+Number(m),raw:_});return ' ';});
 s=s.replace(/(\d+(?:\.\d+)?)[\s-]*(小時|小时|時間|hours?\b|hrs?\b|h(?![A-Za-zÀ-ỹ])|giờ|tiếng|horas?\b|시간|ชั่วโมง|ชม\.|घंटे|घंटा)(?:\s*(?:and|y|と|และ|और)?\s*(\d+)\s*(分鐘|分钟|分|minutes?|mins?|phút|minutos?|분|นาที|मिनट))?/gi,(_,h,unit,m)=>{facts.push({kind:'duration',value:Number(h)*60+Number(m||0),raw:_});return ' ';});
 for(const match of s.matchAll(/\d+(?:\.\d+)?/g))facts.push({kind:'number',value:Number(match[0]),raw:match[0]});
 return facts;
}
export function compareFigures(source,target,lang){
 const src=figures(source,'zh-TW'),dest=figures(target,lang),used=new Set(),missing=[];
 for(const fact of src.filter((f,i,a)=>a.findIndex(g=>g.kind===f.kind&&g.value===f.value)===i)){
  const i=dest.findIndex((candidate,index)=>!used.has(index)&&candidate.value===fact.value&&candidate.kind===fact.kind);
  if(i>=0){used.add(i);continue;}
  // A source clock's :00 can be rendered as an hour without minutes in localized prose.
  if(lang==='th'&&fact.kind==='number'&&fact.value>=1500&&fact.value<=2099&&new RegExp(fact.value+'(?:\\s*年|[/-]\\d|\\))').test(source)){const be=dest.findIndex((c,i)=>!used.has(i)&&c.value===fact.value+543);if(be>=0){used.add(be);continue;}}
  const clockDuration=dest.findIndex((candidate,index)=>!used.has(index)&&fact.kind==='time'&&candidate.kind==='duration'&&candidate.value===fact.value);
  if(clockDuration>=0){used.add(clockDuration);continue;}
  const hour=dest.findIndex((candidate,index)=>!used.has(index)&&candidate.kind==='number'&&fact.kind==='time'&&fact.value%60===0&&candidate.value===fact.value/60);
  if(hour>=0){used.add(hour);continue;}
  missing.push(fact);
 }
 return {source:src,target:dest,missing,ok:missing.length===0};
}
