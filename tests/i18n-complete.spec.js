import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {parse} from 'parse5';
const source=JSON.parse(fs.readFileSync('public/data/site_i18n/source.json')).entries;
const langs=['zh-TW','zh-CN','en','ja','ko','th','vi','hi','es'];
const pages=fs.readdirSync('src').filter(p=>p.endsWith('.html'));
const messages=Object.fromEntries(langs.map(l=>[l,l==='zh-TW'?{}:JSON.parse(fs.readFileSync('public/data/site_i18n/'+l+'.json')).messages]));
const fixtures=Object.fromEntries(pages.map(page=>[page,Object.entries(source).filter(([,e])=>e.uses.some(u=>u.file==='src/'+page&&u.kind==='text')&&e.source.length>=25&&!e.source.includes('ZXQVAR')).sort((a,b)=>b[1].source.length-a[1].source.length).slice(0,2)]));
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort());});
for(const lang of langs){
 test(`whole-site paragraphs, metadata and article links: ${lang}`,async({page})=>{
  test.setTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const name of pages){
   await page.goto(name+'?lang='+lang);
   await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language',lang);
   for(const [id,e] of fixtures[name]){
    const copy=lang==='zh-TW'?e.source:messages[lang][id];
    expect(copy,`${lang} ${name}: missing fixture`).toBeTruthy();
    // Hidden guide paragraphs must be localized before opening the reader/modal as well.
    await expect.poll(() => page.evaluate(value => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) if (walker.currentNode.nodeValue.replace(/\s+/g, ' ').trim() === value) return true;
      return false;
    }, copy), {message: `${name} ${lang}: translated source paragraph`}).toBe(true);
   }
  }
  await page.goto('articles.html?lang='+lang);
  await expect(page.locator('#grid .card')).toHaveCount(10);
  const links=await page.locator('#grid .acts a.primary').evaluateAll(list=>list.map(a=>a.href));
  for(const url of links){expect(new URL(url).searchParams.get('lang')).toBe(lang);const response=await page.request.get(url);expect(response.ok(),url).toBe(true);}
  expect(errors).toEqual([]);
 });
}
test('newly rendered data, native form values, source restore and original user comments',async({page})=>{
 await page.goto('./?lang=en');await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','en');
 const spot=JSON.parse(fs.readFileSync('public/data/spots.json')).find(s=>s.id==='ashikaga_fuji');
 await page.locator('#subContextPillsContainer [data-id="fuji_wisteria"]').click();
 const sourceEntry=Object.entries(source).find(([,e])=>e.source===spot.title);
 await expect(page.locator('#spot-card-ashikaga_fuji .card-title-header h3')).toHaveText(messages.en[sourceEntry[0]]);
 await page.evaluate(()=>{
  const form=document.createElement('div');form.id='language-form-test';
  const select=document.createElement('select');select.innerHTML='<option>東京</option><option value="osaka">大阪</option>';
  const input=document.createElement('input');input.value='東京';input.placeholder='請選擇景點';
  const comment=document.createElement('p');comment.className='feed-comment-text';comment.textContent='東京';
  const textarea=document.createElement('textarea');textarea.placeholder='東京';textarea.value='東京';
  form.append(select,input,comment,textarea);document.body.append(form);
 });
 await expect(page.locator('#language-form-test option').first()).toHaveText('Tokyo');
 await expect(page.locator('#language-form-test select')).toHaveValue('東京');
 await expect(page.locator('#language-form-test input')).toHaveValue('東京');
 await expect(page.locator('#language-form-test textarea')).toHaveValue('東京');
 await expect(page.locator('#language-form-test textarea')).toHaveAttribute('placeholder','Tokyo');
 await expect(page.locator('#language-form-test .feed-comment-text')).toHaveText('東京');
 await page.evaluate(()=>TabiLang.set('zh-TW'));
 await expect(page.locator('#language-form-test option').first()).toHaveText('東京');
});
test('localized HTML contains translated content without JavaScript and can switch back to source',async({page,baseURL})=>{
 const response=await page.request.get('en/japan_entry_rules.html');expect(response.ok()).toBe(true);
 const html=await response.text();expect(html).toContain('data-page-language="en"');expect(html).toContain('hreflang="ja"');
 const [id]=fixtures['japan_entry_rules.html'][0];expect(html).toContain(messages.en[id]);
 await page.goto('en/japan_entry_rules.html');
 await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','en');
 await page.evaluate(()=>TabiLang.set('zh-TW'));await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','zh-TW');
 await expect.poll(()=>page.evaluate(value=>{
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())if(walker.currentNode.nodeValue.replace(/\s+/g,' ').trim()===value)return true;
  return false;
 },fixtures['japan_entry_rules.html'][0][1].source)).toBe(true);
 const title=await page.title();expect(title).toContain('日本入境');
 const responses=[];page.on('response',r=>{if(r.status()===404)responses.push(r.url());});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','zh-TW');expect(responses).toEqual([]);
});
test('provider locales preserve currencies and affiliate parameters',async({page})=>{
 await page.goto('./?lang=vi');
 const urls=await page.evaluate(()=>({
  trip:TabiBookingLocale.url('https://tw.trip.com/hotels/list?Allianceid=9507030&SID=325761227&trip_sub1=test&curr=TWD','vi'),
  klook:TabiBookingLocale.url('https://www.klook.com/zh-TW/search/result/?aid=123436&query=Tokyo','es'),
  opaque:TabiBookingLocale.url('https://www.trip.com/t/fgyJcXow1X2','ja'),
  untrusted:TabiBookingLocale.url('https://trip.com.evil.invalid/path','en')
 }));
 expect(new URL(urls.trip).hostname).toBe('vn.trip.com');expect(new URL(urls.trip).searchParams.get('locale')).toBe('vi-VN');
 expect(new URL(urls.trip).searchParams.get('curr')).toBe('TWD');expect(new URL(urls.trip).searchParams.get('Allianceid')).toBe('9507030');expect(new URL(urls.trip).searchParams.get('trip_sub1')).toBe('test');
 expect(new URL(urls.klook).pathname).toMatch(/^\/es\//);expect(new URL(urls.klook).searchParams.get('aid')).toBe('123436');
 expect(urls.opaque).toBe('https://www.trip.com/t/fgyJcXow1X2');expect(urls.untrusted).toBe('https://trip.com.evil.invalid/path');
 await page.evaluate(()=>{
  TabiLang.set('en');
  for(const [id,currency]of [['booking-default',''],['booking-explicit','&selected_currency=JPY']]){
   const a=document.createElement('a');a.id=id;a.href='https://www.booking.com/searchresults.zh-tw.html?aid=2422002'+currency;a.textContent=id;
   a.addEventListener('click',event=>event.preventDefault());document.body.append(a);
  }
 });
 await page.locator('#booking-default').click();await page.locator('#booking-explicit').click();
 expect(new URL(await page.locator('#booking-default').getAttribute('href')).searchParams.get('selected_currency')).toBe('TWD');
 expect(new URL(await page.locator('#booking-explicit').getAttribute('href')).searchParams.get('selected_currency')).toBe('JPY');

});

test('late full catalog responses cannot overwrite a newer language',async({page})=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/data/site_i18n/en.json',async route=>{await gate;await route.continue();});
 await page.goto('japan_entry_rules.html?lang=zh-TW');await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','zh-TW');
 await Promise.all([page.waitForRequest('**/data/site_i18n/en.json'),page.evaluate(()=>TabiLang.set('en'))]);
 await page.evaluate(()=>TabiLang.set('ja'));await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','ja');
 const title=await page.title();const response=page.waitForResponse('**/data/site_i18n/en.json');release();await response;
 await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','ja');expect(await page.title()).toBe(title);
});
test('a failed full catalog restores source content and exposes fallback state',async({page})=>{
 await page.route('**/data/site_i18n/en.json',route=>route.fulfill({status:503,body:'Unavailable'}));
 await page.goto('japan_entry_rules.html?lang=en');await expect(page.locator('html')).toHaveAttribute('data-site-i18n-state','fallback');
 await expect(page.locator('html')).toHaveAttribute('data-site-i18n-language','zh-TW');await expect(page).toHaveTitle(/日本入境與免稅指南/);
 await page.evaluate(()=>{const p=document.createElement('p');p.id='fallback-dynamic';p.textContent='東京';document.body.append(p);});
 await expect(page.locator('#fallback-dynamic')).toHaveText('東京');
 await expect(page.locator('html')).toHaveAttribute('data-site-i18n-state','fallback');
});


test('all static language pages expose localized metadata before JavaScript',async({request})=>{
 test.setTimeout(120000);
 function metadata(html){
  const result={alternates:[]};
  function visit(node){
   const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
   if(node.tagName==='title')result.title=(node.childNodes||[]).map(n=>n.value||'').join('').trim();
   if(node.tagName==='meta')result[attrs.name||attrs.property]=attrs.content;
   if(node.tagName==='link'&&attrs.rel==='alternate')result.alternates.push(attrs.hreflang);
   for(const child of node.childNodes||[])visit(child);
  }
  visit(parse(html));return result;
 }
 const byText=new Map(Object.entries(source).map(([id,e])=>[e.source,id]));
 const originals=Object.fromEntries(pages.map(p=>[p,metadata(fs.readFileSync('src/'+p,'utf8'))]));
 for(const lang of langs)for(const name of pages){
  const response=await request.get(lang+'/'+name);expect(response.ok(),lang+'/'+name).toBe(true);
  const actual=metadata(await response.text());
  for(const key of ['title','description','og:title','og:description','twitter:title','twitter:description']){
   const raw=originals[name][key];expect(raw,`${name} ${key}`).toBeTruthy();
   const expected=lang==='zh-TW'?raw:messages[lang][byText.get(raw.replace(/\s+/g,' ').trim())];
   expect(expected,`${lang} ${name} ${key} dictionary`).toBeTruthy();expect(actual[key],`${lang} ${name} ${key}`).toBe(expected);
  }
  expect(actual['og:locale']).toBe({'zh-TW':'zh_TW','zh-CN':'zh_CN',en:'en_US',ja:'ja_JP',ko:'ko_KR',th:'th_TH',vi:'vi_VN',hi:'hi_IN',es:'es_ES'}[lang]);
  expect(actual.alternates).toEqual(expect.arrayContaining([...langs,'x-default']));
 }
});
