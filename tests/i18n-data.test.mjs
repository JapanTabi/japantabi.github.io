import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {compareFigures} from '../scripts/i18n/numeric-facts.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
test('locale number equivalence keeps magnitudes, fractions, discounts and clocks',()=>{
 for(const [source,target,lang]of [
 ['40萬株','400,000 plants','en'],['3 折','70% off','en'],['95 折','5% off','en'],
 ['2,446級石階','2.446 peldaños','es'],['9¾月台','Platform 9 3/4','en'],
 ['2026年11月23日','23 พฤศจิกายน พ.ศ. 2569','th'],['2.5 小時','2時間半','ja'],
 ['1 小時 45 分','1 hour and 45 minutes','en'],['24h新雪','24 ชม. หิมะใหม่','th'],
 ['119 救護車','119 ambulance','en'],['551 蓬萊','551 Horai','en'],
 ['E8 系','E8 시리즈','ko'],['8種','8 พันธุ์','th'],['14:30','14h30','vi'],
 ['第 1、第 2 航廈 B1F','제1,2터미널 B1F','ko'],['42.195公里','42.195 kilómetros','es']
 ])assert.equal(compareFigures(source,target,lang).ok,true,`${source}: ${target}`);
 for(const [source,target,lang]of [['40萬株','40 plants','en'],['3 折','30% off','en'],['2,446級石階','2,446,000 years','en'],['每年僅7天','연중무휴','ko'],['9¾月台','Platform 9','en'],['20分鐘','2 minutes','en']])assert.equal(compareFigures(source,target,lang).ok,false,`${source}: ${target}`);
});
test('canonical spot identities and aliases are unambiguous',()=>{
 const spots=read('public/data/spots.json'),aliases=read('public/data/spot_aliases.json').aliases;
 const ids=new Set(spots.map(s=>s.id));assert.equal(ids.size,spots.length);assert.equal(spots.length,565);
 for(const entry of aliases)assert.ok(ids.has(entry.canonical.id));
 assert.equal(spots.find(s=>s.id==='maruyama_park_sakura').region,'hokkaido');
 assert.equal(spots.find(s=>s.id==='kyoto_maruyama_park_sakura').region,'kansai');
 assert.ok(spots.every(s=>!s.bloomStatus||s.bloomStatus==='季節景觀參考，非即時花況'));
});
test('travel rules and merchant references retain the reviewed facts',()=>{
 const html=fs.readFileSync('src/japan_entry_rules.html','utf8');
 for(const text of ['2026 年 11 月 1 日','未稅購買金額合計須達 5,000 日圓','購買日起 90 日內','10%','8%','輸入確認'])assert.ok(html.includes(text),text);
 const coupons=read('public/data/coupons.json');assert.equal(coupons.length,6);
 for(const c of coupons){assert.equal(new URL(c.coupon_url).protocol,'https:');assert.ok(!new URL(c.coupon_url).hostname.endsWith('.coupon'));assert.equal(c.verification.offerVerified,false);}
 const festivals=read('public/data/festivals.json');assert.match(festivals.find(f=>f.id==='yodogawa').schedule,/2026\/10\/17|2026-10-17|2026 年 10 月 17 日/);
 for(const f of festivals)assert.ok(f.official_url.startsWith('https://'));
});
