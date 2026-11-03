import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCatalog,nextScheduledRun,updateIsOverdue,loadCatalog} from './catalog-utils.js';
const data=JSON.parse(readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
const auto={enabled:true,intervalDays:3,timeZone:'Asia/Seoul',anchorAt:'2026-11-06T09:00:00+09:00'};
test('three-day schedule crosses month boundaries without resetting',()=>{
  assert.equal(nextScheduledRun(auto,Date.parse('2026-11-03T11:00:00+09:00')).toISOString(),'2026-11-06T00:00:00.000Z');
  assert.equal(nextScheduledRun(auto,Date.parse('2026-11-06T10:00:00+09:00')).toISOString(),'2026-11-09T00:00:00.000Z');
  assert.equal(nextScheduledRun(auto,Date.parse('2026-11-30T10:00:00+09:00')).toISOString(),'2026-12-03T00:00:00.000Z');
  assert.equal(nextScheduledRun({...auto,enabled:false}),null);
});
test('old data is flagged after a missed scheduled update',()=>{
  const c={...data,automation:auto,verifiedAt:'2026-11-03',lastResearchAt:null};
  assert.equal(updateIsOverdue(c,Date.parse('2026-11-03T12:00:00+09:00')),false);
  assert.equal(updateIsOverdue(c,Date.parse('2026-11-06T12:00:00+09:00')),false);
  assert.equal(updateIsOverdue(c,Date.parse('2026-11-07T12:00:00+09:00')),true);
  assert.equal(updateIsOverdue({...c,lastResearchAt:'2026-11-06T11:00:00+09:00'},Date.parse('2026-11-07T12:00:00+09:00')),false);
});
test('invalid updates are rejected before rendering',()=>{
  assert.equal(validateCatalog(data),data);
  const duplicate=structuredClone(data);duplicate.items.push(duplicate.items[0]);assert.throws(()=>validateCatalog(duplicate));
  const unsafe=structuredClone(data);unsafe.items[0].sources[0].url='javascript:alert(1)';assert.throws(()=>validateCatalog(unsafe));
  const badDate=structuredClone(data);badDate.items[0].deadline='2026-02-30';assert.throws(()=>validateCatalog(badDate));
});
test('latest repository data is preferred over cached site data',async()=>{
  const calls=[];
  const result=await loadCatalog({now:0,fetcher:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>data};}});
  assert.equal(result.fallback,false);assert.equal(calls.length,1);assert(calls[0].url.startsWith('https://raw.githubusercontent.com/minuk1749/it-opportunity-board/main/catalog.json'));assert.equal(calls[0].options.cache,'no-store');
});
test('a network or malformed-data failure safely falls back',async()=>{
  let calls=0;
  const result=await loadCatalog({fetcher:async()=>{calls++;return {ok:true,json:async()=>calls===1?{items:[]}:data};}});
  assert.equal(result.fallback,true);assert.equal(result.catalog.items.length,data.items.length);
  await assert.rejects(loadCatalog({fetcher:async()=>{throw Error('offline');}}));
});
