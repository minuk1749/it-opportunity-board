import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const files=['catalog-utils.js','career-utils.js','careers.js','app.js'];
const modules=Object.fromEntries(files.map(name=>[name,read(name)]));
const boot=`const modules=${json(modules)};const urls={};for(const name of ${json(files)}){let source=modules[name];for(const [dep,url] of Object.entries(urls))source=source.replaceAll("'./"+dep+"'","'"+url+"'");urls[name]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));}const app=document.createElement('script');app.type='module';app.src=urls['app.js'];document.body.append(app);`;
const html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',`<style>${read('styles.css')}</style>`).replace('<link rel="stylesheet" href="./careers.css">',`<style>${read('careers.css')}</style>`).replace('<script src="./app.js" type="module"></script>','').replace('</body>',`<script type="application/json" id="embedded-catalog">${json(JSON.parse(read('catalog.json')))}</script><script type="application/json" id="embedded-careers">${json(JSON.parse(read('careers.json')))}</script><script>${boot}</script></body>`);
writeFileSync(new URL('../it-opportunity-careers-preview.html',import.meta.url),html,'utf8');
console.log('Standalone activity + careers preview ready.');

