"""Protect quantities and reviewed names in tagged spans; restore plain text only."""
import html,json,pathlib,re
from html.parser import HTMLParser
GLOSSARY=json.loads((pathlib.Path(__file__).parent/'reviewed-glossary.json').read_text())['entries']
LANGS=['zh-CN','en','ja','ko','th','vi','hi','es']
UNITS={
 'plants':['株','plants','株','그루','ต้น','cây','पौधे','plantas'],
 'people':['人','people','人','명','คน','người','लोग','personas'],
 'visits':['人次','visits','人','명','คน','lượt','आगंतुक','visitantes'],
 'days':['天','days','日','일','วัน','ngày','दिन','días'],
 'years':['年','years','年','년','ปี','năm','वर्ष','años'],
 'months':['个月','months','か月','개월','เดือน','tháng','महीने','meses'],
 'hours':['小时','hours','時間','시간','ชั่วโมง','giờ','घंटे','horas'],
 'minutes':['分钟','minutes','分','분','นาที','phút','मिनट','minutos'],
 'seconds':['秒','seconds','秒','초','วินาที','giây','सेकंड','segundos'],
 'floors':['楼','floors','階','층','ชั้น','tầng','मंज़िल','plantas'],
 'age':['岁','years old','歳','세','ปี','tuổi','वर्ष की आयु','años de edad'],
 'types':['种','varieties','種類','종','ชนิด','loại','प्रकार','variedades'],
 'places':['处','places','か所','곳','แห่ง','địa điểm','स्थल','lugares'],
 'buildings':['馆','venues','館','관','แห่ง','khu','स्थल','recintos'],
 'cars':['节车厢','carriages','両','량','ตู้','toa','डिब्बे','vagones'],
 'fireworks':['发','fireworks','発','발','นัด','quả pháo hoa','पटाखे','fuegos artificiales'],
 'steps':['级','steps','段','계단','ขั้น','bậc','सीढ़ियाँ','peldaños'],
}
SI={'公分':'cm','公釐':'mm','平方公尺':'m²','平方米':'m²','公頃':'ha','公顷':'ha','公尺':'m','公里':'km','米':'m','日圓':'JPY','日元':'JPY','日幣':'JPY','tsubo':'tsubo','坪':'tsubo'}
CLASSIFIERS={'株':'plants','人次':'visits','人':'people','天':'days','年':'years','個月':'months','个月':'months','小時':'hours','小时':'hours','分鐘':'minutes','分钟':'minutes','分':'minutes','秒':'seconds','樓':'floors','楼':'floors','層':'floors','层':'floors','歲':'age','岁':'age','種':'types','种':'types','處':'places','处':'places','館':'buildings','馆':'buildings','節車廂':'cars','发':'fireworks','發':'fireworks','級':'steps','级':'steps'}
UNIT_ALTS='|'.join(re.escape(k) for k in sorted([*CLASSIFIERS,*SI],key=len,reverse=True))
NUM=r'(?:NT\$|TWD\s*|JPY\s*|￥|¥|\$)?\d+(?:[,，]\d{3})*(?:\.\d+)?(?:\s*[萬万億亿])?(?:[¼½¾]|:\d{2})?'
FIGURE=re.compile(NUM+r'(?:\s*(?:折起|折|%|％|'+UNIT_ALTS+r'))?')
def quantity(raw,language):
 i=LANGS.index(language)
 raw=re.sub(r'(?<=\d)\s+(?=[萬万億亿折])','',raw)
 if re.fullmatch(r'\d+(?:\.\d+)?折(?:起)?',raw):
  n=float(raw.replace('折起','').replace('折',''));saved=100-n*(1 if n>10 else 10)
  if language=='zh-CN':return raw.replace('折','折')
  labels=['','%s%% off','%s%%引き','%s%% 할인','ลด %s%%','giảm %s%%','%s%% की छूट','%s%% de descuento']
  text=labels[i]%format(saved,'g')
  if raw.endswith('起'):text=({'en':'up to ','ja':'最大','ko':'최대 ','th':'สูงสุด ','vi':'tối đa ','hi':'अधिकतम ','es':'hasta '}[language])+text
  return text
 match=re.fullmatch('('+NUM+r')\s*('+UNIT_ALTS+r'|%|％)?',raw)
 if not match:return raw
 value,unit=match.groups();value=re.sub(r'([\d,.]+)([萬万億亿])',lambda m:format(float(m[1].replace(',',''))*(10000 if m[2] in '萬万' else 1e8),'.12f').rstrip('0').rstrip('.'),value)
 value=value.replace(',','')
 if not unit:return value
 if unit in '%％':return value+'%'
 if unit in SI:return value.replace(',','')+' '+SI[unit]
 if unit=='年' and re.fullmatch(r'1[5-9]\d{2}|20\d{2}',value):return value+'年' if language in ['zh-CN','ja'] else value
 return value+' '+UNITS[CLASSIFIERS[unit]][i]
def prepare(text,language):
 text=re.sub(r'(\d+(?:\.\d+)?)\s*[~～〜–-]\s*(\d+(?:\.\d+)?)\s*([萬万億亿])',lambda m:format(float(m[1])*(10000 if m[3] in '萬万' else 1e8),'g')+'–'+format(float(m[2])*(10000 if m[3] in '萬万' else 1e8),'g'),text)
 keep={};terms=[]
 for entry in GLOSSARY:
  for term in entry['terms']:terms.append((term,entry['translations'][language]))
 pattern=re.compile('|'.join(re.escape(term) for term,_ in sorted(terms,key=lambda p:-len(p[0])))+r'|ZXQVAR\d+QXZ|'+FIGURE.pattern)
 preferred=dict(terms);parts=[];pos=0
 for match in pattern.finditer(text):
  parts.append(html.escape(text[pos:match.start()],quote=False));raw=match[0];value=preferred.get(raw,quantity(raw,language))
  if language not in ['zh-CN','ja'] and not raw.startswith('ZXQVAR'):value=' '+value+' '
  identity='tabikeep'+str(len(keep));keep[identity]=value
  parts.append('<span class="notranslate" id="'+identity+'">'+html.escape(value,quote=False)+'</span>');pos=match.end()
 parts.append(html.escape(text[pos:],quote=False))
 return ''.join(parts),keep
class Restorer(HTMLParser):
 def __init__(self,keep):super().__init__(convert_charrefs=True);self.keep=keep;self.output=[];self.depth=0;self.seen={}
 def handle_starttag(self,tag,attrs):
  identity=dict(attrs).get('id')
  if self.depth:self.depth+=1;return
  if identity in self.keep:self.depth=1;self.seen[identity]=self.seen.get(identity,0)+1;self.output.append(self.keep[identity])
 def handle_endtag(self,tag):
  if self.depth:self.depth-=1
 def handle_data(self,data):
  if not self.depth:self.output.append(data)
def restore(text,keep,language):
 parser=Restorer(keep);parser.feed(text);parser.close()
 if any(parser.seen.get(key)!=1 for key in keep):raise ValueError('protected span was lost or duplicated')
 value=re.sub(r'\s+',' ',''.join(parser.output)).strip()
 if language=='th':value=re.sub(r'พ\.?ศ\.?\s*(?=1[6-9]\d{2}|20\d{2})','ค.ศ. ',value)
 return value
