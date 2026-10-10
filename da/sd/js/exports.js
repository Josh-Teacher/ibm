import {VERSION,normalizeSettings,scoreRound,matchSeeds} from './rules.js';
import {Tournament} from './tournament.js';
function csvCell(value) {
  let text=String(value??'');if(typeof value==='string'&&/^[=+@\-\t\r]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function csv(rows){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
export function roundsCSV(tournament,partial=null){
  const s=tournament.settings;
  const rows=[['rules_version','master_seed','format','multiplier','history_limit','ending','continuation_percent','round_cap','match','repeat','match_status','credited','left_strategy','left_faction','left_sha256','right_strategy','right_faction','right_sha256','seed_left','seed_right','seed_ending','round','left_decision','right_decision','left_points','right_points','left_total','right_total','ended_by']];
  for(const m of [...tournament.matches,...(partial&&!tournament.matches.includes(partial)?[partial]:[])])for(const r of m.rows)rows.push([VERSION,s.seed,s.format,s.multiplier,s.historyLimit,s.ending,s.continuation,s.rounds,m.index,m.repeat,m.status,tournament.matches.includes(m),m.left.name,m.left.faction,m.left.hash,m.right.name,m.right.faction,m.right.hash,m.seeds.left,m.seeds.right,m.seeds.ending,r.round,r.left,r.right,r.pointsLeft,r.pointsRight,r.totalLeft,r.totalRight,m.endedBy]);
  return csv(rows);
}
export function standingsCSV(tournament){
  const standings=tournament.standings();
  const rows=[['rank','strategy','faction','points','average_per_match','average_per_round','matches','strategy_rounds','share_percent','match_wins','match_ties','advancement_status']];
  for(const t of standings.teams)rows.push([t.rank,t.name,t.faction,t.points,t.averageMatch,t.averageRound,t.matches,t.rounds,t.rounds?t.shares/t.rounds*100:0,t.wins,t.ties,tournament.settings.format==='survival'?(tournament.alive.has(t.id)?'surviving':'eliminated'):'no elimination']);
  rows.push([]);rows.push(['faction','total_points','strategies','strategy_rounds','average_per_round','share_percent']);
  for(const [f,t]of Object.entries(standings.factions))rows.push([f,t.points,t.strategies,t.rounds,t.rounds?t.points/t.rounds:0,t.rounds?t.shares/t.rounds*100:0]);
  return csv(rows);
}
const metadata=s=>({id:s.id,name:s.name,faction:s.faction,filename:s.filename,hash:s.hash,demo:Boolean(s.demo)});
export function replayJSON(tournament,partial=null,labels={}){
  const match=m=>({...m,left:metadata(m.left),right:metadata(m.right)});
  return JSON.stringify({version:VERSION,created:tournament.created,settings:tournament.settings,labels,status:tournament.status,
    roster:tournament.roster.map(metadata),queue:tournament.settings.format==='duels'?tournament.schedule.filter(m=>m.repeat===1).map(m=>({left:m.left.id,right:m.right.id})):[],
    matches:tournament.matches.map(match),partial:partial&&!tournament.matches.includes(partial)?match(partial):null},null,2);
}
export function parseReplay(text){
  const data=JSON.parse(text);if(data.version!==VERSION)throw Error('This replay uses an unsupported rules version.');
  if(!Array.isArray(data.roster)||data.roster.length>1000||!Array.isArray(data.matches)||data.matches.length>5000)throw Error('Invalid replay roster or match list.');
  const roster=data.roster.map(s=>{
    if(!s||typeof s.id!=='string'||typeof s.name!=='string'||!['f1','f2'].includes(s.faction)||typeof s.hash!=='string'||!/^[0-9a-f]{64}$/i.test(s.hash))throw Error('Invalid strategy metadata.');
    return {...metadata(s),source:''};
  });
  const settings=normalizeSettings(data.settings),tournament=new Tournament(roster,settings,data.queue);
  const validate=(m,complete)=>{
    const left=roster.find(s=>s.id===m.left?.id),right=roster.find(s=>s.id===m.right?.id);
    if(!left||!right||!Array.isArray(m.rows)||m.rows.length>settings.rounds||!Number.isInteger(m.index)||m.index<1||!Number.isInteger(m.repeat)||m.repeat<1)throw Error('Invalid replay match.');
    if(complete&&(m.status!=='complete'||!m.rows.length))throw Error('Completed replay matches require completed rounds.');
    if(complete&&settings.ending==='fixed'&&m.rows.length!==settings.rounds)throw Error('A completed fixed-length match must contain its configured round count.');
    if(complete&&settings.ending==='probability'&&!['cap','probability'].includes(m.endedBy))throw Error('Invalid probabilistic ending record.');
    if(complete&&m.endedBy==='cap'&&m.rows.length!==settings.rounds)throw Error('A capped match must reach the round cap.');
    let previous=null;
    const rows=m.rows.map((r,i)=>{const checked=scoreRound(r.left,r.right,settings.multiplier,previous,i+1);for(const key of ['round','pointsLeft','pointsRight','totalLeft','totalRight'])if(!Number.isFinite(r[key])||Math.abs(r[key]-checked[key])>1e-8)throw Error('A replay score does not match its decisions and payoff matrix.');previous=checked;return checked;});
    return {...m,left,right,rows,seeds:matchSeeds(settings,{...m,left,right})};
  };
  for(const input of data.matches){
    const m=validate(input,true),next=tournament.nextPair(m.left.id,m.right.id);
    if(!next||next.left.id!==m.left.id||next.right.id!==m.right.id||next.repeat!==m.repeat)throw Error('Replay pairings do not follow the tournament format.');
    const advancement=m.advancement;tournament.commit(m);
    if(tournament.pendingTie&&advancement)tournament.advance(advancement.winner,m,true);
    if(tournament.pendingTie&&input!==data.matches.at(-1))throw Error('A tied elimination match has no advancement decision.');
  }
  const partial=data.partial?validate(data.partial,false):null;
  if(partial&&partial.index!==tournament.matches.length+1)throw Error('Invalid partial match order.');
  if(typeof data.created==='string')tournament.created=data.created;
  if(['stopped','incomplete'].includes(data.status)&&tournament.status!=='complete'&&!tournament.pendingTie)tournament.status=data.status;
  return {tournament,partial,labels:data.labels&&typeof data.labels==='object'?data.labels:{}};
}
export function download(text,filename,type='text/csv;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
