const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = value => typeof value === 'string' && datePattern.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
export function validateCatalog(value) {
  const fail = message => { throw new Error('Invalid catalog: '+message); };
  if (!value || typeof value !== 'object' || !isDate(value.verifiedAt)) fail('verifiedAt');
  if (!Array.isArray(value.items) || value.items.length > 1500) fail('items');
  const ids = new Set();
  for (const item of value.items) {
    if (!item || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(item.id) || ids.has(item.id)) fail('duplicate or invalid id');
    ids.add(item.id);
    for (const key of ['name','summary','eligibility','deadlineTime','location','team','period','cost','caution']) if (typeof item[key] !== 'string') fail(key);
    if (!item.name.trim() || !item.summary.trim() || !item.eligibility.trim()) fail('empty content');
    if (!['hackathon','bootcamp','contest'].includes(item.category) || !['online','offline','hybrid'].includes(item.mode)) fail('category or mode');
    if (!isDate(item.deadline) || typeof item.uncertain !== 'boolean') fail('deadline or uncertain');
    if (!Array.isArray(item.fields) || !item.fields.length || !item.fields.every(key=>['ai','web','cloud','security','product','hardware'].includes(key))) fail('fields');
    if (!Array.isArray(item.sources) || !item.sources.length || item.sources.some(source=>typeof source.label !== 'string' || typeof source.url !== 'string' || !source.url.startsWith('https://') || new URL(source.url).protocol !== 'https:')) fail('sources');
    if (item.status !== undefined && !['open','upcoming','closed','cancelled'].includes(item.status)) fail('status');
    if (item.lastVerifiedAt !== undefined && !isDate(item.lastVerifiedAt)) fail('lastVerifiedAt');
    if (JSON.stringify(item).includes('\ufffd')) fail('text encoding');
  }
  if (value.automation) {
    const a=value.automation;
    if (typeof a.enabled !== 'boolean' || !Number.isInteger(a.intervalDays) || a.intervalDays<1 || a.intervalDays>30 || !Number.isFinite(Date.parse(a.anchorAt)) || a.timeZone !== 'Asia/Seoul') fail('automation');
  }
  if (value.lastResearchAt != null && !Number.isFinite(Date.parse(value.lastResearchAt))) fail('lastResearchAt');
  if (value.updateHistory !== undefined) {
    if (!Array.isArray(value.updateHistory) || value.updateHistory.length>50) fail('updateHistory');
    for (const entry of value.updateHistory) {
      if (!isDate(entry.date) || !['setup','research'].includes(entry.kind) || typeof entry.summary!=='string') fail('history entry');
      for (const key of ['added','changed','closed']) if (entry[key] !== undefined && (!Number.isInteger(entry[key]) || entry[key]<0)) fail('history count');
    }
  }
  return value;
}
export function nextScheduledRun(automation, now=Date.now()) {
  if (!automation?.enabled) return null;
  const anchor=Date.parse(automation.anchorAt), period=automation.intervalDays*86400000;
  if (!Number.isFinite(anchor) || !Number.isFinite(period) || period<=0) return null;
  return new Date(now<=anchor ? anchor : anchor+(Math.floor((now-anchor)/period)+1)*period);
}
export function updateIsOverdue(catalog,now=Date.now()) {
  const next=nextScheduledRun(catalog.automation,now);
  if (!next) return false;
  const due=next.getTime()-catalog.automation.intervalDays*86400000;
  const last=Date.parse(catalog.lastResearchAt || catalog.verifiedAt+'T00:00:00+09:00');
  return due>=Date.parse(catalog.automation.anchorAt) && now-due>86400000 && last<due;
}
export async function loadCatalog({fetcher=fetch,now=Date.now()}={}) {
  const paths=[`https://raw.githubusercontent.com/minuk1749/it-opportunity-board/main/catalog.json?t=${Math.floor(now/60000)}`,'./catalog.json'];
  let lastError;
  for(let i=0;i<paths.length;i++) {
    try {
      const response=await fetcher(paths[i],{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok) throw new Error('HTTP '+response.status);
      return {catalog:validateCatalog(await response.json()),fallback:i>0};
    } catch(error) {lastError=error;}
  }
  throw lastError;
}
