/** Optional single-file, offline preview built from real Python-generated T1 records. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Worker as Thread} from 'node:worker_threads';
import {build} from 'esbuild';
import {loadRoster} from '../js/roster.js';
import {Tournament} from '../js/tournament.js';
import {MatchEngine} from '../js/engine.js';
import {replayJSON,parseReplay} from '../js/exports.js';
const root=fileURLToPath(new URL('../',import.meta.url));
globalThis.fetch=async url=>new Response(fs.readFileSync(fileURLToPath(url)));
class WebWorker{
  constructor(url){this.worker=new Thread(new URL('../tests/node-worker-bridge.cjs',import.meta.url),{workerData:{url:url.href}});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',e=>this.onerror?.({message:e.message,preventDefault(){}}));}
  postMessage(data){this.worker.postMessage(data);}terminate(){this.worker.terminate();}
}
globalThis.Worker=WebWorker;
let replay;
const recordPath=path.join(root,'demo/tournament-replay.json');
if(process.argv.includes('--reuse-records')){replay=fs.readFileSync(recordPath,'utf8');parseReplay(replay);}
else {const tournament=new Tournament(await loadRoster(undefined,true),{format:'t1',seed:'tournament-1-demo'});for(const pair of tournament.schedule){const result=await new MatchEngine().run(pair,tournament.settings);if(result.status!=='complete')throw Error(result.error);tournament.commit(result);process.stdout.write(`Demo match ${pair.index}/${tournament.schedule.length}: ${result.rows.length} rounds\n`);}replay=replayJSON(tournament,null,{f1:'Faction 1',f2:'Faction 2'});fs.writeFileSync(recordPath,replay);}
const bundled=await build({entryPoints:[path.join(root,'js/app.js')],bundle:true,format:'iife',globalName:'TournamentPreview',write:false,minify:false,target:'es2022',logLevel:'silent'});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${fs.readFileSync(path.join(root,'styles.css'),'utf8')}</style>`);
html=html.replace('<script defer src="vendor/gsap.min.js"></script>','').replace('<script type="module" src="js/app.js"></script>','');
html=html.replace('<title>Space Dilemma · Tournament Viewer</title>','<title>Space Dilemma · Offline demo replay</title>');
html=html.replace('href="README.md"','href="https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages"').replace('Setup &amp; rules ↗','GitHub Pages setup ↗');
const scriptSafe=text=>text.replace(/<\/script/gi,'<\\/script');
html=html.replace('</body>',`<script id="embedded-replay" type="application/json">${replay.replaceAll('<','\\u003c')}</script>\n<script>${scriptSafe(fs.readFileSync(path.join(root,'vendor/gsap.min.js'),'utf8'))}</script>\n<script>${scriptSafe(bundled.outputFiles[0].text)}</script>\n</body>`);
const out=path.join(root,'../Space_Dilemma_Tournament_Preview.html');fs.writeFileSync(out,html);process.stdout.write(`Created ${path.basename(out)}\n`);
