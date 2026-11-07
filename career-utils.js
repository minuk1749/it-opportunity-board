import {isDate} from './catalog-utils.js';
export const careerStatuses=['지원 검토','조건 확인','예외 문의','원문 재확인','재공고 감시','지정 대기'];
export const careerEventTypes=['추가','변경','정정','마감','재확인','확인 필요'];
export function safeLink(value) {
  try {return typeof value==='string' && new URL(value).protocol==='https:';} catch {return false;}
}
export function validateCareers(data) {
  const fail=key=>{throw new Error('Invalid careers: '+key);};
  if(!data||!isDate(data.lastResearchDate)||!Number.isFinite(Date.parse(data.updatedAt)))fail('research dates');
  if(!Array.isArray(data.companies)||!data.companies.length||data.companies.length>3000)fail('companies');
  if(!Array.isArray(data.events)||!Array.isArray(data.runs))fail('history');
  const ids=new Set();
  for(const c of data.companies){
    if(!c||!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(c.id)||ids.has(c.id))fail('company id');
    ids.add(c.id);
    for(const k of ['name','region','role','stack','status','eligibility','military','deadline','note'])if(typeof c[k]!=='string')fail(k);
    if(!c.name||!isDate(c.checked)||c.checked>data.lastResearchDate||!careerStatuses.includes(c.status)||typeof c.candidate!=='boolean')fail('company conditions');
    if(!Array.isArray(c.links)||c.links.some(x=>typeof x.label!=='string'||!safeLink(x.url)))fail('company links');
  }
  const events=new Set();
  for(const e of data.events){
    if(!e||typeof e.id!=='string'||!e.id||events.has(e.id)||!ids.has(e.companyId))fail('event id or company');
    events.add(e.id);
    if(!isDate(e.date)||e.date>data.lastResearchDate||!careerEventTypes.includes(e.type))fail('event date or type');
    for(const k of ['title','before','after','action','url','sourceLabel'])if(typeof e[k]!=='string')fail('event '+k);
    if(e.url&&!safeLink(e.url))fail('event url');
  }
  const runs=new Set();
  for(const r of data.runs){
    if(!r||typeof r.id!=='string'||!r.id||runs.has(r.id)||!isDate(r.date)||r.date>data.lastResearchDate||typeof r.summary!=='string'||typeof r.coverage!=='string')fail('run');
    runs.add(r.id);
    if(r.sources?.some(x=>!safeLink(x.url)))fail('run sources');
  }
  if(!data.runs.some(r=>r.date===data.lastResearchDate))fail('latest run missing');
  if(data.automation){
    const a=data.automation;
    if(typeof a.enabled!=='boolean'||a.intervalDays!==7||a.timeZone!=='Asia/Seoul'||!Number.isFinite(Date.parse(a.anchorAt)))fail('automation');
  }
  if(JSON.stringify(data).includes('\ufffd'))fail('encoding');
  return data;
}
export function selectCompanies(data,{view='all',query='',status='',region='',stack='',sort='priority',saved=new Set()}={}) {
  const q=query.trim().toLocaleLowerCase();
  return data.companies.filter(c=>
    (view!=='candidates'||c.candidate)&&(view!=='saved'||saved.has(c.id))&&
    (!status||c.status===status)&&(!region||c.region.startsWith(region))&&
    (!stack||(stack==='java'?/java|spring|kotlin/i.test(c.stack):stack==='node'?/node|nest|typescript|express/i.test(c.stack):/C\+\+|C#|C\/C|게임|보안|OS|Python|QA|SE\b/i.test(c.stack+' '+c.role)))&&
    (!q||[c.name,c.region,c.role,c.stack,c.eligibility,c.military,c.note].join(' ').toLocaleLowerCase().includes(q))
  ).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'ko'):sort==='checked'?b.checked.localeCompare(a.checked)||a.name.localeCompare(b.name,'ko'):careerStatuses.indexOf(a.status)-careerStatuses.indexOf(b.status)||b.checked.localeCompare(a.checked)||a.name.localeCompare(b.name,'ko'));
}
export async function loadCareers({fetcher=fetch,now=Date.now()}={}) {
  const paths=['https://raw.githubusercontent.com/minuk1749/it-opportunity-board/main/careers.json?t='+Math.floor(now/60000),'./careers.json'];
  let error;
  for(let i=0;i<paths.length;i++){
    try{
      const response=await fetcher(paths[i],{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error('HTTP '+response.status);
      return {data:validateCareers(await response.json()),fallback:i>0};
    }catch(e){error=e;}
  }
  throw error;
}

