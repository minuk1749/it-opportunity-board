const $ = (s, root = document) => root.querySelector(s);
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories = {
  hackathon:{name:'해커톤',en:'HACKATHON',desc:'팀과 함께 아이디어를 실제 서비스로.',icon:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20"/>'},
  bootcamp:{name:'부트캠프',en:'BOOTCAMP',desc:'집중해서 배우고, 프로젝트로 성장하기.',icon:'<path d="m1 8 11-5 11 5-11 5zM5 10v7c5 4 9 4 14 0v-7M23 8v9"/>'},
  contest:{name:'공모전',en:'COMPETITION',desc:'나의 아이디어와 결과물로 도전하기.',icon:'<path d="M7 3h10v7a5 5 0 0 1-10 0zm0 2H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4m-5 2v6m-5 0h10"/>'}
};
const fields={ai:{name:'AI · 데이터',icon:'✳',desc:'생성형 AI, 에이전트, 데이터 분석'},web:{name:'웹 · 앱 개발',icon:'⌘',desc:'백엔드, 풀스택, 서비스 개발'},cloud:{name:'클라우드',icon:'☁',desc:'클라우드 인프라와 운영'},security:{name:'보안',icon:'⌑',desc:'시스템 보안과 취약점 분석'},product:{name:'기획 · 디자인',icon:'◇',desc:'아이디어, 창업, UX/UI'},hardware:{name:'반도체 · 하드웨어',icon:'▦',desc:'디스플레이와 제조 데이터'}};
const modes={all:'전체 방식',online:'온라인',offline:'오프라인',hybrid:'온·오프라인'};
const main=$('#main'),dialog=$('#detail');
let catalog, saved=new Set(), filters={query:'',mode:'all',uncertain:false,closed:false,sort:'deadline'}, activeId=null, toastTimer;
try{const stored=JSON.parse(localStorage.getItem('next-opportunity-saved')||'[]');if(Array.isArray(stored))saved=new Set(stored.filter(x=>typeof x==='string'));}catch{}
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
const days = date => Math.round((Date.parse(date+'T00:00:00+09:00')-Date.parse(today()+'T00:00:00+09:00'))/86400000);
const deadlineLabel = item => {
  let d=days(item.deadline);
  if(d<0)return {text:'마감일 지남',class:'closed',closed:true};
  if(d===0){const t=item.deadlineTime.match(/^(\d{1,2}):(\d{2})/);if(t&&Date.now()>=Date.parse(item.deadline+'T00:00:00+09:00')+(Number(t[1])*60+Number(t[2]))*60000)return{text:'마감 시간 지남',class:'closed',closed:true};}
  return {text:d===0?'오늘 마감':d===1?'내일 마감':`D-${d}`,class:d<=3?'urgent':'new',closed:false};
};
const dateLabel = d => `${Number(d.slice(5,7))}.${d.slice(8,10)}`;
const badge = item => {const b=deadlineLabel(item);return `<span class="pill ${b.class}">${b.text}</span>`;};
const icon = c => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${categories[c].icon}</svg>`;
const count = category => catalog.items.filter(x=>x.category===category).length;
const steps = n => `<div class="steps" aria-label="탐색 단계">${["종류 선택","분야 선택","공고 확인"].map((v,i)=>`${i?' <span aria-hidden="true">—</span> ':''}<${i+1===n?'b':'span'}>${String(i+1).padStart(2,'0')} ${v}</${i+1===n?'b':'span'}>`).join('')}</div>`;
const crumbs = links => `<nav class="crumb" aria-label="현재 위치"><a href="#/">홈</a>${links.map(([name,href])=>`<span aria-hidden="true">/</span>${href?`<a href="${href}">${name}</a>`:`<span aria-current="page">${name}</span>`}`).join('')}</nav>`;
const note = () => `<div class="notice"><span aria-hidden="true">ⓘ</span><span><strong>${catalog.verifiedAt} 수록 기준.</strong> 참가 자격·모집 상태는 신청 전 원문에서 확인하세요. ‘조건 확인’은 휴학생 자격, 카드 발급, 필수 참석 장소 등 추가 확인이 필요한 공고입니다.</span></div>`;
function route(){const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);return {section:parts[0]||'home',field:parts[1]||null};}
function render(){
  if(!catalog)return;
  const r=route();updateSavedCount();
  if(r.section==='home')renderHome();
  else if(categories[r.section]&&!r.field)renderFields(r.section);
  else if(categories[r.section]||['all','saved'].includes(r.section))renderResults(r);
  else{location.hash='#/';return;}
  document.title=(r.section==='home'?'다음 기회 — IT 활동 탐색':`${categories[r.section]?.name|| (r.section==='saved'?'저장한 기회':'전체 공고')} | 다음 기회`);
}
function renderHome(){
 const open=catalog.items.filter(x=>!deadlineLabel(x).closed);
 const soon=[...open].sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,4);
 main.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h1>다음 경험을 만드는<br><span class="accent">나에게 맞는 기회.</span></h1><p>해커톤부터 부트캠프, 공모전까지.<br>관심 분야를 따라가며 도전하고 싶은 활동을 찾아보세요.</p><div class="scope-tags"><span>서울 · 경기 · 온라인</span><span>대학생 · 휴학생 대상 탐색</span></div></div><aside class="hero-aside" aria-label="공고 현황"><div class="aside-top"><span>OPPORTUNITY INDEX</span><span>↗</span></div><div class="big-stat">${catalog.items.length}<span>개의 기회</span></div><span style="font-size:12px;color:var(--muted)">한곳에서 살펴보고, 나의 다음을 준비해요.</span><div class="aside-foot"><span>수록 기준 ${catalog.verifiedAt.replaceAll('-','.')}</span><span>3 CATEGORIES</span></div></aside></section><section aria-labelledby="category-title"><div class="section-heading"><div><h2 id="category-title">어떤 경험을 찾고 있나요?</h2><p>종류를 선택하면 관심 분야별로 좁혀 볼 수 있어요.</p></div><a class="text-link" href="#/all">전체 보기 ↗</a></div><div class="category-grid">${Object.entries(categories).map(([key,c])=>`<a class="category-card ${key}" href="#/${key}"><div class="category-top"><span class="category-icon">${icon(key)}</span><span class="category-count">${count(key)}개 공고</span></div><h2>${c.name}</h2><p>${c.desc}</p><span class="category-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section><div class="section-break"></div><section aria-labelledby="soon-title"><div class="section-heading"><div><h2 id="soon-title">먼저 살펴볼 마감 일정</h2><p>수록된 마감일이 가까운 순서예요.</p></div><span style="font-size:11px;color:var(--muted)">한국시간 기준</span></div><div class="soon-grid">${soon.map(x=>`<button class="mini-card" data-open="${x.id}">${badge(x)}<h3>${escape(x.name)}</h3><p>${categories[x.category].name} · ${dateLabel(x.deadline)} 마감</p></button>`).join('')||'<p>마감일이 남은 공고가 없어요. 전체 공고에서 지난 기록을 볼 수 있어요.</p>'}</div></section>${note()}`;
}
function renderFields(category){const c=categories[category];const items=catalog.items.filter(x=>x.category===category);
 main.innerHTML=`${crumbs([[c.name,null]])}${steps(2)}<div class="page-heading"><div class="eyebrow">${c.en}</div><h1>어떤 분야에 관심 있나요?</h1><p>${c.name} ${items.length}개 중 원하는 분야를 골라보세요.<br>여러 분야를 다루는 공고는 각 분야에 함께 표시돼요.</p></div><div class="field-grid">${Object.entries(fields).filter(([key])=>items.some(x=>x.fields.includes(key))).map(([key,f])=>`<a class="field-card" href="#/${category}/${key}"><span class="field-icon" aria-hidden="true">${f.icon}</span><span><strong>${f.name}</strong><small>${items.filter(x=>x.fields.includes(key)).length}개 공고 · ${f.desc}</small></span><span class="chevron" aria-hidden="true">↗</span></a>`).join('')}</div><a class="all-field" href="#/${category}/all">${c.name} 전체 보기 <span>→</span></a>${note()}`;
}
function baseItems(r){return catalog.items.filter(x=>(r.section==='all'||r.section==='saved'&&saved.has(x.id)||x.category===r.section)&&(!r.field||r.field==='all'||x.fields.includes(r.field)));}
function filteredItems(r){let list=baseItems(r).filter(x=>(filters.mode==='all'||x.mode===filters.mode)&&(!filters.uncertain||!x.uncertain)&&(filters.closed||!deadlineLabel(x).closed)&&[x.name,x.summary,x.eligibility,x.location,...x.fields.map(f=>fields[f]?.name||f)].join(' ').toLowerCase().includes(filters.query.trim().toLowerCase()));return list.sort((a,b)=>filters.sort==='name'?a.name.localeCompare(b.name,'ko'):a.deadline.localeCompare(b.deadline)||a.name.localeCompare(b.name,'ko'));}
function renderResults(r){
 const category=categories[r.section];const title=r.section==='saved'?'저장한 기회':r.section==='all'?'모든 기회를 한눈에':`${category.name}, ${fields[r.field]?.name||'전체 분야'}`;
 const crumbLinks=category?[[category.name,`#/${r.section}`],[fields[r.field]?.name||'전체 분야',null]]:[[title,null]];
 main.innerHTML=`${crumbs(crumbLinks)}${category?steps(3):''}<div class="page-heading"><div class="eyebrow">${r.section==='saved'?'YOUR COLLECTION':'FIND YOUR OPPORTUNITY'}</div><h1>${title}</h1><p>${r.section==='saved'?'관심 있는 공고를 모아두고 천천히 비교해 보세요. 저장 목록은 이 브라우저에 보관돼요.':'마감일과 참가 조건을 비교하고, 자세히 보기에서 요약과 신청 링크를 확인하세요.'}</p></div><div class="toolbar"><label class="search-wrap"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="이름, 기술, 지역으로 검색" aria-label="공고 검색" value="${escape(filters.query)}"></label><select id="sort" aria-label="정렬 방식"><option value="deadline"${filters.sort==='deadline'?' selected':''}>마감일 가까운 순</option><option value="name"${filters.sort==='name'?' selected':''}>이름순</option></select></div><div class="results-layout"><aside class="filters" aria-label="공고 필터"><div class="filter-group"><h3>참여 방식</h3><div class="filter-options">${Object.entries(modes).map(([key,name])=>`<button class="filter-btn ${filters.mode===key?'selected':''}" data-mode="${key}" aria-pressed="${filters.mode===key}">${name}</button>`).join('')}</div></div><div class="filter-group"><h3>추가 조건</h3><label class="check-label"><input id="confirmed" type="checkbox"${filters.uncertain?' checked':''}>조건 확인 공고 제외</label><label class="check-label"><input id="closed" type="checkbox"${filters.closed?' checked':''}>마감일 지난 공고 포함</label></div><button class="reset-btn" data-reset>필터 초기화</button></aside><section aria-label="공고 목록"><div class="result-meta"><span id="result-count" aria-live="polite"></span><span>${catalog.verifiedAt.replaceAll('-','.')} 수록</span></div><div id="results" class="result-list"></div></section></div>${note()}`;
 renderList(r);
 $('#search').addEventListener('input',e=>{filters.query=e.target.value;renderList(r);});
 $('#sort').addEventListener('change',e=>{filters.sort=e.target.value;renderList(r);});
 $('#confirmed').addEventListener('change',e=>{filters.uncertain=e.target.checked;renderList(r);});
 $('#closed').addEventListener('change',e=>{filters.closed=e.target.checked;renderList(r);});
}
function renderList(r){const items=filteredItems(r);$('#result-count').innerHTML=`<strong>${items.length}개</strong>의 공고 · 전체 ${baseItems(r).length}개`;
 $('#results').innerHTML=items.map(x=>`<article class="result-card"><div class="card-top">${badge(x)}<span class="pill">${categories[x.category].name}</span><span class="pill">${modes[x.mode]}</span>${x.uncertain?'<span class="pill caution">조건 확인</span>':''}</div><button class="save-btn" data-save="${x.id}" aria-label="${escape(x.name)} ${saved.has(x.id)?'저장 해제':'저장'}" aria-pressed="${saved.has(x.id)}">${saved.has(x.id)?'★':'☆'}</button><h2 style="margin:0;line-height:1.5"><button class="card-title" data-open="${x.id}">${escape(x.name)}</button></h2><p class="card-summary">${escape(x.summary)}</p><div class="card-bottom"><div class="card-meta"><span>◷ ${dateLabel(x.deadline)} 마감</span><span>⌖ ${escape(x.location)}</span></div><button class="detail-btn" data-open="${x.id}">자세히 보기 ↗</button></div></article>`).join('')||`<div class="empty"><h2>${r.section==='saved'&&saved.size===0?'아직 저장한 기회가 없어요':'조건에 맞는 공고가 없어요'}</h2><p>${r.section==='saved'&&saved.size===0?'공고의 별표를 눌러 나만의 목록을 만들어 보세요.':'필터를 초기화하거나 마감일 지난 공고를 포함해 보세요.'}</p>${r.section==='saved'&&saved.size===0?'<a class="all-field" href="#/all">전체 공고 둘러보기 →</a>':'<button data-reset>필터 초기화</button>'}</div>`;
}
function updateSavedCount(){$('#saved-count').textContent=saved.size;}
function save(id){if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem('next-opportunity-saved',JSON.stringify([...saved]));showToast(saved.has(id)?'저장한 기회에 추가했어요.':'저장을 해제했어요.');}catch{showToast('현재 브라우저에서는 임시로만 저장돼요.');}updateSavedCount();const r=route();if($('#results'))renderList(r);if(activeId===id)updateDetailSave(id);}
function updateDetailSave(id){const b=$('[data-detail-save]',dialog);if(b){b.textContent=saved.has(id)?'★ 저장됨':'☆ 저장하기';b.setAttribute('aria-pressed',String(saved.has(id)));}}
function showToast(s){clearTimeout(toastTimer);$('#toast').textContent=s;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function openDetail(id){const x=catalog.items.find(x=>x.id===id);if(!x)return;activeId=id;
 const row=(label,value,full=false)=>`<div class="detail-item${full?' full':''}"><dt>${label}</dt><dd>${escape(value)}</dd></div>`;
 $('#detail-body').innerHTML=`<div class="detail-content"><div class="detail-top"><div class="card-top" style="margin:0;padding:0">${badge(x)}<span class="pill">${categories[x.category].name}</span>${x.uncertain?'<span class="pill caution">조건 확인</span>':''}</div><button class="close-btn" data-close aria-label="상세 정보 닫기" autofocus>×</button></div><h2 id="detail-title">${escape(x.name)}</h2><p class="detail-summary">${escape(x.summary)}</p><dl class="detail-grid">${row('신청 · 제출 마감',`${x.deadline} · ${x.deadlineTime}`)}${row('진행 방식 · 장소',x.location)}${row('참가 자격',x.eligibility,true)}${row('진행 일정',x.period)}${row('팀 구성',x.team)}${row('비용 · 지원 조건',x.cost,true)}</dl>${x.caution?`<div class="notice"><span aria-hidden="true">ⓘ</span><span><strong>참가 전 확인</strong><br>${escape(x.caution)}</span></div>`:''}<div class="detail-actions"><a class="primary-link" href="${escape(x.sources[0].url)}" target="_blank" rel="noopener noreferrer">공고 · 신청 페이지 <span aria-hidden="true">↗</span></a><button class="detail-save" data-detail-save="${x.id}" aria-pressed="${saved.has(x.id)}">${saved.has(x.id)?'★ 저장됨':'☆ 저장하기'}</button></div><div class="source-links">${x.sources.map((s,i)=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">출처 ${i+1} · ${escape(s.label)} ↗</a>`).join('')}</div><p class="detail-foot">${catalog.verifiedAt} 조사 내용 기준 · 시각 미공개 마감은 해당 날짜로 표시됩니다.<br>조기 마감과 세부 자격 변경은 원문에서 확인해 주세요.</p></div>`;
 if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
document.addEventListener('click',e=>{const target=e.target.closest('button');if(!target)return;
 if(target.dataset.open)openDetail(target.dataset.open);
 if(target.dataset.save)save(target.dataset.save);
 if(target.dataset.detailSave)save(target.dataset.detailSave);
 if(target.hasAttribute('data-close'))dialog.close();
 if(target.dataset.mode){filters.mode=target.dataset.mode;render();}
 if(target.hasAttribute('data-reset')){filters={query:'',mode:'all',uncertain:false,closed:false,sort:'deadline'};render();}
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{activeId=null;});
window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();filters={query:'',mode:'all',uncertain:false,closed:false,sort:'deadline'};render();window.scrollTo(0,0);main.focus({preventScroll:true});});
try{const response=await fetch('./catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('목록을 불러올 수 없습니다.');catalog=await response.json();const ids=new Set(catalog.items.map(x=>x.id));saved=new Set([...saved].filter(id=>ids.has(id)));$('#footer-note').textContent=`수록 기준 ${catalog.verifiedAt} · 공고 ${catalog.items.length}개 · 데이터 업데이트는 게시 시 반영됩니다.`;render();}catch(error){main.innerHTML='<div class="empty"><h1>목록을 불러오지 못했어요.</h1><p>네트워크 연결을 확인하고 페이지를 새로고침해 주세요.</p><button id="reload">다시 시도</button></div>';$('#reload').onclick=()=>location.reload();console.error(error);}
