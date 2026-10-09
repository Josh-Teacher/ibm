import {scoreRound,matchSeeds,randomStream} from './rules.js';
export class PythonClient {
  constructor(label,onStage = ()=>{}) {
    this.label=label; this.pending=new Map(); this.counter=0; this.closed=false;
    this.worker=new Worker(new URL('./worker.js',import.meta.url));
    this.ready=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});
    this.ready.catch(()=>{});
    this.loadTimer=setTimeout(()=>this.stop('Runtime loading timed out after 60 seconds. Check your connection and retry.'),60000);
    this.worker.onmessage=({data:d})=>{
      if(d.stage) onStage(`${label}: ${d.stage}`);
      if(d.ready) {clearTimeout(this.loadTimer);this.resolveReady();}
      if(d.fatal) this.stop(d.fatal);
      if(d.id) {const p=this.pending.get(d.id);if(p){clearTimeout(p.timer);this.pending.delete(d.id);d.error?p.reject(Error(d.error)):p.resolve(d.value);}}
    };
    this.worker.onerror=e=>{e.preventDefault?.();this.stop('Python worker failed: '+e.message);};
  }
  async call(data) {
    await this.ready; if(this.closed) throw Error('Strategy worker stopped.');
    return new Promise((resolve,reject)=>{
      const id=++this.counter;
      const timer=setTimeout(()=>this.stop(`${this.filename} · round ${data.round||0} · execution timeout (3 seconds)`),3000);
      this.pending.set(id,{resolve,reject,timer}); this.worker.postMessage({...data,id});
    });
  }
  init(strategy,seed,settings) {this.filename=strategy.filename;return this.call({type:'init',source:strategy.source,filename:strategy.filename,seed,multiplier:settings.multiplier,historyLimit:settings.historyLimit});}
  stop(reason='Stopped') {
    if(this.closed)return; this.closed=true;clearTimeout(this.loadTimer);this.worker.terminate();this.rejectReady(Error(`${this.label}: ${reason}`));
    for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error(reason));}this.pending.clear();
  }
}
export class MatchEngine {
  constructor(){this.clients=[];this.cancelled=false;}
  cancel(){this.cancelled=true;this.clients.forEach(c=>c.stop('Stopped by instructor.'));}
  async run(pairing,settings,onProgress=()=>{},onStage=()=>{}) {
    this.cancelled=false;
    const result={...pairing,seeds:matchSeeds(settings,pairing),rows:[],status:'running',error:'',endedBy:''};
    const rng=randomStream(result.seeds.ending);
    try {
      this.clients=[];this.clients.push(new PythonClient(pairing.left.filename,onStage));this.clients.push(new PythonClient(pairing.right.filename,onStage));
      await Promise.all(this.clients.map((c,i)=>c.init(i?pairing.right:pairing.left,i?result.seeds.right:result.seeds.left,settings)));
      for(let round=1;round<=settings.rounds;round++) {
        if(this.cancelled)throw Error('Stopped by instructor.');
        const last=result.rows.at(-1);
        const [left,right]=await Promise.all(this.clients.map((c,i)=>c.call({type:'decide',round,previous:last?(i?[last.right,last.left]:[last.left,last.right]):null})));
        result.rows.push(scoreRound(left,right,settings.multiplier,last,round));
        if(round%10===0||round===1)onProgress(round,settings.rounds);
        if(settings.ending==='probability'&&rng()>=settings.continuation/100){result.endedBy='probability';break;}
      }
      result.endedBy ||= settings.ending==='fixed'?'fixed':'cap'; result.status='complete';
      onProgress(result.rows.length,result.rows.length);
    } catch(error){result.status=this.cancelled?'cancelled':'incomplete';result.error=error.message;}
    finally{this.clients.forEach(c=>c.stop());this.clients=[];}
    return result;
  }
}
