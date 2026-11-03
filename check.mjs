import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
assert(catalog.items.length>=30);
assert.equal(new Set(catalog.items.map(x=>x.id)).size,catalog.items.length);
for(const x of catalog.items){assert(['hackathon','bootcamp','contest'].includes(x.category));assert(['online','offline','hybrid'].includes(x.mode));assert(/^\d{4}-\d{2}-\d{2}$/.test(x.deadline));assert(x.name&&x.summary&&x.eligibility);assert(x.fields.length);for(const s of x.sources)assert(new URL(s.url).protocol==='https:');assert(!JSON.stringify(x).includes('\ufffd'));}
console.log(`Validated ${catalog.items.length} records: unique IDs, dates, categories, links, text encoding.`);
