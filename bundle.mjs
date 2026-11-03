import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const data=JSON.stringify(JSON.parse(read('catalog.json'))).replace(/</g,'\\u003c');
const utils=read('catalog-utils.js').replace(/^export /gm,'');
const app=utils+'\n'+read('app.js').replace(/^import .*from '\.\/catalog-utils\.js';\n/,'');
const html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',`<style>${read('styles.css')}</style>`).replace('<script src="./app.js" type="module"></script>','').replace('</body>',`<script type="application/json" id="embedded-catalog">${data}</script><script type="module">${app}</script></body>`);
writeFileSync(new URL('../it-opportunity-preview.html',import.meta.url),html,'utf8');
console.log('Standalone HTML ready.');
