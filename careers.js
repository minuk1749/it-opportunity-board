import {loadCareers,validateCareers,selectCompanies,careerStatuses,safeLink} from './career-utils.js';
import {nextScheduledRun,updateIsOverdue} from './catalog-utils.js';
const q=(s,root=document)=>root.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opt=(v,label,current)=>`<option value="${esc(v)}"${v===current?' selected':''}>${esc(label)}</option>`;
const initial=()=>({query:'',status:'',region:'',stack:'',sort:'priority'});
let data=null,filters=initial(),saved=new Set(),onChange=()=>{},notify=()=>{},busy=false,failed=false,fallback=false,lastFetch=0,active=null,historyDate='';
try{const s=JSON.parse(localStorage.getItem('next-opportunity-careers-saved')||'[]');if(Array.isArray(s))saved=new Set(s.filter(x=>typeof x==='string'));}catch{}
const view=()=>location.hash.split('/')[2]||'all';
export const isCareerRoute=()=>/^#\/careers(?:\/|$)/.test(location.hash);
const badge=c=>`<span class="pill ${c.status==='지원 검토'?'new':['재공고 감시','지정 대기'].includes(c.status)?'closed':'caution'}">${esc(c.status)}</span>`;
const href=(url,label,cls='')=>safeLink(url)?`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
export function careerBanner(){
  return `<a href="#/careers" class="career-banner"><span class="career-banner-icon" aria-hidden="true">↗</span><div><span class="career-kicker">CAREER / 산업기능요원</span><h2>배운 것을, 일하는 경험으로.</h2><p>보충역 채용부터 신규 지정 후보까지, 조건과 변경 이력을 한곳에서.</p></div><span class="career-banner-count">${data?data.companies.length+'개 회사 기록':'채용 보드 열기'}<b aria-hidden="true">→</b></span></a>`;
}
export function renderCareerStatus(){
  const panel=q('#update-status');if(!panel)return;
  panel.hidden=false;
  if(!data){panel.innerHTML=`<div class="update-status-main"><span class="update-tag">채용 조사 자료 ${failed?'연결 확인 필요':'불러오는 중'}</span><a href="#/all">활동 공고 보기 →</a></div>`;return;}
  const next=nextScheduledRun(data.automation);
  const overdue=updateIsOverdue({automation:data.automation,lastResearchAt:data.updatedAt});
  const date=next?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',weekday:'short',hour:'numeric',minute:'2-digit'}).format(next):'';
  panel.innerHTML=`<div class="update-status-main"><div><span class="update-tag${failed||overdue?' delayed':''}">↻ ${failed?'새 자료 연결 확인 필요':overdue?'채용 갱신 확인 필요':data.automation?.enabled?'매주 월요일 채용 조사':'채용 조사 기록'}</span><span class="update-date">마지막 조사 <strong>${esc(data.lastResearchDate)}</strong></span>${next?`<span class="update-date">다음 예정 <strong>${esc(date)} 전후</strong> · 한국시간</span>`:''}</div><button class="refresh-data" data-career-refresh ${busy?'disabled':''}>${busy?'불러오는 중…':'최신 채용 목록 불러오기 ↻'}</button></div><p class="update-description">${failed?'새 자료를 불러오지 못해 마지막 자료를 유지해요.':overdue?'예정 시각 이후 새 조사 기록이 없어요. 마지막 조사일을 확인해 주세요.':fallback?'현재 사이트에 보관된 자료를 표시해요. 최신 자료 연결은 다시 확인해 주세요.':'채용은 매주 월요일 오전 9시 전후, 해커톤·부트캠프·공모전은 3일마다 별도로 조사해요.'}</p>`;
  q('#footer-note').textContent=`채용 마지막 조사 ${data.lastResearchDate} · 회사 기록 ${data.companies.length}개 · 회사별 확인일은 서로 달라요.`;
}
export async function refreshCareers(manual=false){
  if(busy||(!manual&&(document.hidden||q('#detail')?.open||q('#career-search')===document.activeElement||Date.now()-lastFetch<60000)))return;
  busy=true;if(isCareerRoute())renderCareerStatus();
  try{
    const embedded=q('#embedded-careers');
    const result=embedded?{data:validateCareers(JSON.parse(embedded.textContent)),fallback:false}:await loadCareers();
    if(result.fallback&&data)throw Error('Retaining current career records');
    const changed=JSON.stringify(data)!==JSON.stringify(result.data);
    data=result.data;fallback=result.fallback;failed=false;lastFetch=Date.now();
    if(changed)onChange();
    if(manual)notify(fallback?'보관된 채용 자료예요. 조사일을 확인해 주세요.':changed?'채용 자료를 반영했어요.':'현재 게시된 최신 채용 자료예요.');
  }catch(error){
    failed=true;if(!data)onChange();
    if(manual)notify('채용 자료를 불러오지 못했어요. 기존 자료는 유지해요.');
    console.warn('Career refresh failed',error.message);
  }finally{busy=false;if(isCareerRoute())renderCareerStatus();}
}
export function renderCareerPage(){
  const main=q('#main');
  if(!data){main.innerHTML=`<div class="empty"><h1>${failed?'채용 자료를 불러오지 못했어요.':'채용 기록을 불러오고 있어요…'}</h1>${failed?'<button class="refresh-data" data-career-refresh>다시 시도</button>':''}</div>`;return;}
  const current=view(),candidates=data.companies.filter(c=>c.candidate).length;
  const statusCount=s=>data.companies.filter(c=>c.status===s).length;
  main.innerHTML=`<nav class="crumb" aria-label="현재 위치"><a href="#/">홈</a><span>/</span><span aria-current="page">산업기능요원 채용</span></nav><section class="career-heading"><div><div class="eyebrow">YOUR NEXT CAREER</div><h1>다음 커리어,<br><span class="accent">조건부터 차근차근.</span></h1><p>보충역 신규 편입을 준비하는 IT 채용 보드.<br>회사별 지원 조건과 조사할 때마다 달라진 내용을 살펴보세요.</p><div class="scope-tags"><span>서울 · 판교 · 용인 · 수원 · 화성</span><span>Java / Spring 우선 · IT 직무 폭넓게</span></div></div><aside class="career-summary"><div class="career-kicker">RESEARCH SNAPSHOT</div><strong>${data.companies.length}<small>개 회사 기록</small></strong><p>현재 채용 · 재공고 감시 · 지정 후보 포함</p><div><span>지원 검토 <b>${statusCount('지원 검토')}</b></span><span>신규 지정 후보 <b>${candidates}</b></span></div><small>마지막 조사 ${esc(data.lastResearchDate)}</small></aside></section><div class="career-tabs" role="navigation" aria-label="채용 보기">${[['all','회사 목록'],['updates','날짜별 업데이트'],['candidates',`신규 지정 후보 ${candidates}`],['saved',`저장한 회사 ${saved.size}`]].map(([k,label])=>`<a href="#/careers${k==='all'?'':'/'+k}" class="${current===k?'selected':''}"${current===k?' aria-current="page"':''}>${label}</a>`).join('')}</div><div id="career-content"></div>`;
  if(current==='updates')renderHistory();else renderCompanies(current);
}
function renderCompanies(current){
  q('#career-content').innerHTML=`${current==='candidates'?'<div class="notice"><span>ⓘ</span><span><strong>1차 선정 후보는 최종 지정 완료가 아니에요.</strong><br>일반 채용 여부와 보충역 신규 편입 수용을 각각 확인해야 해요. 최종 결과를 확인한 회사만 상태를 바꿉니다.</span></div>':''}<div class="career-list-intro"><div><h2>${current==='saved'?'관심 있는 회사를 모아두세요':current==='candidates'?'지정 결과와 채용을 함께 추적해요':'회사를 비교하고, 다음 행동을 정하세요'}</h2><p>${current==='saved'?'이 브라우저에 저장한 회사예요. 활동 공고의 저장 목록과 별도로 보관돼요.':'아래 상태는 마지막 조사 때의 판단이에요. 현재 접수 여부와 경로별 마감일은 상세에서 확인하세요.'}</p></div><details class="career-legend"><summary>상태는 어떻게 구분하나요?</summary><dl><dt>지원 검토</dt><dd>기존 조사에서 지원 검토 대상으로 분류. 현재 접수와 편입 일정 확인 필요.</dd><dt>조건 확인 · 원문 재확인</dt><dd>학력·직무·접수·편입 등 추가 확인이 남은 기록.</dd><dt>예외 문의</dt><dd>필수 학력·경력 등 조건 미충족. 예외 수용 근거 필요.</dd><dt>재공고 감시</dt><dd>확인한 공고의 마감·기한 경과 등으로 재모집을 추적.</dd><dt>지정 대기</dt><dd>신규 지정 후보. 최종 지정과 채용을 별도 확인.</dd></dl></details></div><div class="toolbar career-toolbar"><label class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="career-search" placeholder="회사, 기술, 근무지로 검색" aria-label="채용 회사 검색" value="${esc(filters.query)}"></label><label class="career-select"><span>정렬</span><select id="career-sort">${[['priority','검토 순서'],['checked','최근 확인순'],['name','회사 이름순']].map(([v,l])=>opt(v,l,filters.sort)).join('')}</select></label></div><div class="career-filter-row"><label class="career-select"><span>상태</span><select id="career-status">${opt('','전체 상태',filters.status)}${careerStatuses.map(s=>opt(s,s,filters.status)).join('')}</select></label><label class="career-select"><span>근무지</span><select id="career-region">${['','서울','판교','용인','수원','화성'].map(v=>opt(v,v||'전체 근무지',filters.region)).join('')}</select></label><label class="career-select"><span>기술·직무</span><select id="career-stack">${[['','전체 기술'],['java','Java · Spring · Kotlin'],['node','Node.js · TypeScript'],['other','게임 · 보안 · 기타 IT']].map(([v,l])=>opt(v,l,filters.stack)).join('')}</select></label><button class="reset-btn" data-career-reset>필터 초기화</button></div><div class="result-meta"><span id="career-result-count" aria-live="polite"></span><span>회사별 원문 확인일 표시</span></div><div id="career-results" class="career-results"></div><details class="career-coverage"><summary>조사 범위와 남은 확인 사항</summary><p>${esc(data.coverage)}</p><p>전체 회사가 마지막 조사일에 재검증된 것은 아니에요. 특정 플랫폼의 마감과 회사 전체 채용 종료는 다를 수 있어요.</p></details>`;
  renderCompanyList(current);
  q('#career-search').addEventListener('input',e=>{filters.query=e.target.value;renderCompanyList(current);});
  for(const key of ['sort','status','region','stack'])q('#career-'+key).addEventListener('change',e=>{filters[key]=e.target.value;renderCompanyList(current);});
}
function renderCompanyList(current=view()){
  const list=selectCompanies(data,{...filters,view:current,saved});
  q('#career-result-count').innerHTML=`<strong>${list.length}개</strong> 회사 · 누적 기록 ${data.companies.length}개`;
  const latest=new Map(data.events.filter(e=>e.date===data.lastResearchDate).map(e=>[e.companyId,e]));
  q('#career-results').innerHTML=list.map(c=>`<article class="career-card"><div class="card-top">${badge(c)}${c.candidate?'<span class="pill">신규 지정 후보</span>':''}${latest.has(c.id)?`<span class="career-change">${esc(latest.get(c.id).type)} · ${esc(latest.get(c.id).date.slice(5).replace('-','.'))}</span>`:''}</div><button class="save-btn" data-career-save="${c.id}" aria-label="${esc(c.name)} ${saved.has(c.id)?'저장 해제':'저장'}" aria-pressed="${saved.has(c.id)}">${saved.has(c.id)?'★':'☆'}</button><h2><button class="card-title" data-career-open="${c.id}">${esc(c.name)}</button></h2><p class="career-role">${esc(c.role)}</p><p class="career-stack">${esc(c.stack)}</p><dl class="career-card-facts"><div><dt>근무지</dt><dd>${esc(c.region)}</dd></div><div><dt>마감 · 접수</dt><dd>${esc(c.deadline)}</dd></div></dl><div class="card-bottom"><span class="career-checked">원문 확인 ${esc(c.checked)}</span><button class="detail-btn" data-career-open="${c.id}">조건 · 출처 보기 ↗</button></div></article>`).join('')||`<div class="empty"><h2>${current==='saved'&&!saved.size?'아직 저장한 회사가 없어요':'조건에 맞는 기록이 없어요'}</h2><p>${current==='saved'&&!saved.size?'회사 카드의 별표를 눌러 저장해 보세요.':'해당 조건의 채용이 없다고 단정하는 것은 아니에요. 필터를 넓혀 기존 조사 기록을 살펴보세요.'}</p><button data-career-reset>필터 초기화</button></div>`;
}
function eventCard(e){
  const company=data.companies.find(c=>c.id===e.companyId);
  return `<article class="career-event"><div class="career-event-meta"><span class="pill ${e.type==='마감'?'closed':e.type==='추가'?'new':'caution'}">${esc(e.type)}</span><button data-career-open="${e.companyId}">${esc(company?.name||e.companyId)} ↗</button></div><h3>${esc(e.title)}</h3><dl><div><dt>이전</dt><dd>${esc(e.before)}</dd></div><div><dt>변경 후</dt><dd>${esc(e.after)}</dd></div><div class="career-action"><dt>다음 행동</dt><dd>${esc(e.action)}</dd></div></dl>${href(e.url,e.sourceLabel||'근거 원문','text-link')}</article>`;
}
function renderHistory(){
  const runs=[...data.runs].sort((a,b)=>b.date.localeCompare(a.date));
  if(!runs.some(r=>r.date===historyDate))historyDate=runs[0]?.date;
  q('#career-content').innerHTML=`<div class="career-list-intro"><div><h2>무엇이 달라졌는지, 날짜별로.</h2><p>추가·변경·정정·마감 기록을 이전 내용과 나란히 확인하세요.</p></div></div><div class="career-history-layout"><nav class="career-run-nav" aria-label="조사일 선택">${runs.map(r=>`<button data-career-date="${r.date}" aria-pressed="${r.date===historyDate}" class="${r.date===historyDate?'selected':''}"><strong>${esc(r.date)}</strong><span>${esc(r.summary)}</span></button>`).join('')}</nav><section id="career-history-detail" aria-live="polite"></section></div>`;
  renderRun();
}
function renderRun(){
  const run=data.runs.find(r=>r.date===historyDate);if(!run)return;
  const events=data.events.filter(e=>e.date===run.date);
  q('#career-history-detail').innerHTML=`<header class="career-run-heading"><span class="career-kicker">RESEARCH LOG / ${esc(run.date)}</span><h2>${esc(run.summary)}</h2><details><summary>이날의 조사 범위 · 확인 한계</summary><p>${esc(run.coverage)}</p>${(run.sources||[]).map(s=>href(s.url,s.label,'text-link')).join(' ')}</details></header><div class="career-event-list">${events.map(eventCard).join('')||'<div class="notice">해당 날짜는 기준 기록입니다. 개별 변경 이력이 저장되지 않은 내용은 추정하지 않았어요.</div>'}</div>`;
}
function openCompany(id){
  const c=data?.companies.find(c=>c.id===id);if(!c)return;active=id;
  const row=(label,text)=>`<div class="detail-item full"><dt>${label}</dt><dd>${esc(text)}</dd></div>`;
  const history=data.events.filter(e=>e.companyId===id).sort((a,b)=>b.date.localeCompare(a.date));
  q('#detail-body').innerHTML=`<div class="detail-content"><div class="detail-top"><div class="card-top">${badge(c)}${c.candidate?'<span class="pill">신규 지정 후보 · 최종 지정 미확정</span>':''}</div><button class="close-btn" data-close aria-label="회사 상세 닫기" autofocus>×</button></div><h2 id="detail-title">${esc(c.name)}</h2><p class="detail-summary">${esc(c.role)}</p><div class="notice career-detail-notice">회사 원문 확인일 <strong>${esc(c.checked)}</strong> · 현재 접수와 편입 조건은 지원 전 다시 확인하세요.</div><dl class="detail-grid">${row('실제 근무지',c.region)}${row('직무 · 기술',c.stack)}${row('신입 · 학력 · 휴학생 조건',c.eligibility)}${row('병역지정 · 보충역 신규 편입',c.military)}${row('플랫폼별 모집 상태 · 마감',c.deadline)}${row('걸림돌 · 확인할 내용',c.note)}</dl><div class="detail-actions"><button class="detail-save" data-career-save="${c.id}" aria-pressed="${saved.has(c.id)}">${saved.has(c.id)?'★ 저장됨':'☆ 회사 저장하기'}</button></div><h3 class="career-source-title">공고와 근거 원문</h3><div class="career-source-links">${c.links.map(s=>href(s.url,s.label)).join('')||'<p>기존 기록에 직접 링크가 없어요. 확인된 링크만 표시합니다.</p>'}</div>${history.length?`<details class="career-company-history"><summary>이 회사의 변경 이력 · ${history.length}건</summary>${history.map(e=>`<div><strong>${esc(e.date)} · ${esc(e.type)}</strong><p>${esc(e.title)}</p><p>이전: ${esc(e.before)}<br>변경 후: ${esc(e.after)}<br>다음 행동: ${esc(e.action)}</p>${href(e.url,e.sourceLabel||'출처','text-link')}</div>`).join('')}</details>`:''}<p class="detail-foot">자료를 다시 불러와도 원문 확인일은 바뀌지 않아요.<br>지원 검토·조건 확인은 합격이나 편입 가능 확정을 의미하지 않아요.</p></div>`;
  const dialog=q('#detail');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
function saveCompany(id){
  if(saved.has(id))saved.delete(id);else saved.add(id);
  try{localStorage.setItem('next-opportunity-careers-saved',JSON.stringify([...saved]));notify(saved.has(id)?'저장한 회사에 추가했어요.':'회사 저장을 해제했어요.');}catch{notify('현재 브라우저에서 임시로 저장해요.');}
  if(isCareerRoute())renderCareerPage();
  if(active===id&&q('#detail').open)openCompany(id);
}
export async function initCareers(callbacks){
  onChange=callbacks.onChange;notify=callbacks.notify;
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-career-refresh'))refreshCareers(true);
    if(b.dataset.careerOpen)openCompany(b.dataset.careerOpen);
    if(b.dataset.careerSave)saveCompany(b.dataset.careerSave);
    if(b.hasAttribute('data-career-reset')){filters=initial();renderCareerPage();}
    if(b.dataset.careerDate){historyDate=b.dataset.careerDate;renderHistory();q('[data-career-date="'+historyDate+'"]')?.focus();}
  });
  q('#detail').addEventListener('close',()=>{active=null;});
  window.addEventListener('hashchange',()=>{filters=initial();if(isCareerRoute())renderCareerPage();});
  setInterval(()=>refreshCareers(),5*60*1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCareers();});
  await refreshCareers();
}

