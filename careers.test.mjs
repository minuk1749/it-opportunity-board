import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCareers,selectCompanies,loadCareers,safeLink} from './career-utils.js';
import {nextScheduledRun,updateIsOverdue} from './catalog-utils.js';
const data=JSON.parse(readFileSync(new URL('careers.json',import.meta.url),'utf8'));
const filterFixture={companies:[{...data.companies[0],id:'sample',name:'예시기업',region:'서울',stack:'Java Spring',status:'지원 검토',candidate:true},{...data.companies[0],id:'watch',name:'감시기업',region:'수원',stack:'Python',status:'재공고 감시',candidate:false}]};
test('company history retains identity and rejects unsafe or orphaned data',()=>{
  assert.equal(validateCareers(data),data);
  const duplicate=structuredClone(data);duplicate.companies.push(duplicate.companies[0]);assert.throws(()=>validateCareers(duplicate));
  const orphan=structuredClone(data);orphan.events[0].companyId='missing';assert.throws(()=>validateCareers(orphan));
  const unsafe=structuredClone(data);unsafe.companies[0].links[0].url='javascript:alert(1)';assert.throws(()=>validateCareers(unsafe));
  const bad=structuredClone(data);bad.companies[0].checked='2026-02-30';assert.throws(()=>validateCareers(bad));
  assert.equal(safeLink('https://example.com'),true);assert.equal(safeLink('data:text/html,hi'),false);
});
test('candidate selection includes candidates in other statuses and respects saved filters',()=>{
  const candidate=filterFixture.companies[0];
  assert(candidate);
  assert(selectCompanies(filterFixture,{view:'candidates'}).some(c=>c.id===candidate.id));
  assert.equal(selectCompanies(filterFixture,{view:'saved',saved:new Set([candidate.id])})[0].id,candidate.id);
  assert.equal(selectCompanies(filterFixture,{view:'saved',saved:new Set()}).length,0);
});
test('search combines region, technology and status without hiding history',()=>{
  const result=selectCompanies(filterFixture,{query:'예시기업',region:'서울',stack:'java',status:'지원 검토'});
  assert.equal(result.length,1);assert.equal(result[0].id,'sample');
  assert.equal(selectCompanies(filterFixture,{query:'예시기업',region:'화성'}).length,0);
  assert(selectCompanies(filterFixture,{status:'재공고 감시'}).length>0);
});
test('weekly schedule remains separate from the three-day event schedule',()=>{
  const now=Date.parse('2026-11-07T12:00:00+09:00');
  assert.equal(nextScheduledRun(data.automation,now).toISOString(),'2026-11-09T00:00:00.000Z');
  assert.equal(nextScheduledRun(data.automation,Date.parse('2026-11-09T10:00:00+09:00')).toISOString(),'2026-11-16T00:00:00.000Z');
  assert.equal(updateIsOverdue({automation:data.automation,lastResearchAt:'2026-11-02T09:26:07+09:00'},now),false);
  assert.equal(updateIsOverdue({automation:data.automation,lastResearchAt:'2026-11-02T09:26:07+09:00'},Date.parse('2026-11-10T12:00:00+09:00')),true);
});
test('invalid remote data falls back to validated local history and never changes research dates',async()=>{
  let calls=0;const result=await loadCareers({fetcher:async()=>({ok:true,json:async()=>++calls===1?{}:data})});
  assert.equal(result.fallback,true);assert.equal(result.data.updatedAt,data.updatedAt);assert.equal(result.data.lastResearchDate,data.lastResearchDate);
  await assert.rejects(loadCareers({fetcher:async()=>{throw Error('offline');}}));
});
test('fresh source is loaded independently of event data',async()=>{
  const calls=[];const result=await loadCareers({now:0,fetcher:async url=>{calls.push(url);return {ok:true,json:async()=>data};}});
  assert.equal(result.fallback,false);assert.equal(calls.length,1);assert(calls[0].endsWith('/careers.json?t=0'));
});

