import {FORMAT_NAMES,normalizeSettings,expectedRounds,points} from './rules.js';
import {Tournament,aggregate} from './tournament.js';
import {loadRoster} from './roster.js';
import {MatchEngine} from './engine.js';
import {Playback} from './playback.js';
import {roundsCSV,standingsCSV,replayJSON,parseReplay,download} from './exports.js';
import {registerViewerTools} from './webmcp.js';

const $=id=>document.getElementById(id);
const state={roster:[],settings:normalizeSettings({}),queue:[],tournament:null,current:null,prepared:null,active:false,computing:false,replaying:false,imported:false,epoch:0,autoTimer:null};
const engine=new MatchEngine();
const playback=new Playback(matchFinished,updatePlaybackControls);
const descriptions={t1:'Tournament 1 fixes 100 rounds, full history, and multiplier 1.0. Each cross-faction pairing plays once.',cross:'Every Faction 2 strategy plays every Faction 1 strategy. Rank by accumulated payoff.',full:'Every strategy plays every other strategy, including its own faction. Add self-play to include an independent twin.',survival:'The winner stays. The loser drops out. Select the next opposing survivor until one faction has no strategies left.',duels:'Choose and queue your cross-faction pairs. All strategies remain in the tournament.'};

function say(message,kind='idle'){$('status').textContent=message;$('status-light').className='status-light'+(kind==='error'?' error':kind==='active'?' active':'');}
function openDialog(el){if(!el.open)el.showModal();}
function closeDialog(el){if(el.open)el.close();}
function labels(){return {f1:$('label-f1').value.trim()||'Faction 1',f2:$('label-f2').value.trim()||'Faction 2'};}
function applyPresentation(){const names=labels();for(const f of ['f1','f2'])$(`${f}-title`).textContent=names[f];if(playback.match)for(const side of ['left','right']){const name=names[playback.match[side].faction].toUpperCase();$(`${side}-faction`).textContent=name;$(`cell-${side}`).querySelector('.cell-kicker').textContent=name;}document.body.dataset.profile=$('profile').value;const gentle=$('reduce-motion').checked;document.body.classList.toggle('gentle',gentle);playback.setGentle(gentle);}
function inputSettings(){return normalizeSettings({format:$('format').value,rounds:$('rounds').value,multiplier:$('multiplier').value,ending:$('ending').value,continuation:$('continuation').value,historyLimit:$('history-limit').value,repeats:$('repeats').value,selfPlay:$('self-play').checked,seed:$('seed').value});}
function putSettings(s){for(const [id,key]of [['format','format'],['rounds','rounds'],['multiplier','multiplier'],['ending','ending'],['continuation','continuation'],['history-limit','historyLimit'],['repeats','repeats'],['seed','seed']])$(id).value=s[key];$('self-play').checked=s.selfPlay;updateSettingsFields();}
function updateSettingsFields(){
  const format=$('format').value,locked=format==='t1';
  if(locked){$('rounds').value=100;$('multiplier').value=1;$('ending').value='fixed';$('history-limit').value=0;$('repeats').value=1;$('self-play').checked=false;}
  for(const id of ['rounds','multiplier','ending','history-limit','repeats'])$(id).disabled=locked||(id==='repeats'&&format==='survival');
  if(format==='survival')$('repeats').value=1;
  const probabilistic=$('ending').value==='probability';$('continuation-label').hidden=!probabilistic;$('expected-rounds').hidden=!probabilistic;$('rounds-label').textContent=probabilistic?'Maximum rounds (hard cap)':'Rounds per match';
  $('self-play-label').hidden=format!=='full';$('queue-settings').hidden=format!=='duels';$('format-help').textContent=descriptions[format];
  const mean=expectedRounds(Number($('continuation').value),Number($('rounds').value));
  $('expected-rounds').textContent=mean?`Expected length: ${Number.isFinite(mean.uncapped)?points(mean.uncapped)+' rounds without a cap':'unlimited without a cap'}. With your ${$('rounds').value}-round cap: ${points(mean.capped)} rounds on average. Every match plays at least one round.`:'Enter a valid continuation percentage and round cap.';
  const kk=2*Number($('multiplier').value);$('kk-preview').textContent=`${points(kk)} / ${points(kk)}`;
}
function updateRuleTags(revealed=Boolean(state.tournament)){
  const s=state.tournament?.settings??state.settings;
  $('tournament-name').textContent=s.format==='t1'?'Tournament 01':'Custom tournament';
  $('format-tag').textContent=s.format==='t1'||s.format==='cross'?'CROSS-FACTION':s.format==='full'?'FULL ROUND ROBIN':s.format==='survival'?'WINNER STAYS':'SELECTED MATCHES';
  $('round-tag').textContent=s.ending==='fixed'?`${s.rounds} ROUNDS`:`${s.continuation}% CONTINUE · CAP ${s.rounds}`;
  $('multiplier-tag').textContent=revealed?`MULTIPLIER · ${points(s.multiplier)}×`:'MULTIPLIER · SEALED';$('seed-footer').textContent=`SEED · ${s.seed}`;
}
function setControls(){
  $('start').disabled=state.active||state.computing||state.imported||!state.roster.length;
  $('start').textContent=state.tournament?'Run again ↗':'Reveal & start ↗';$('stop').hidden=!state.active;
  $('competition-settings').disabled=state.active||state.computing||state.imported;$('apply-settings').textContent=state.active||state.imported?'Apply presentation →':'Apply setup →';
  $('reload-roster').disabled=state.active||state.computing;$('demo-roster').disabled=state.active||state.computing;$('add-pair').disabled=state.active||state.computing;
  const hasRecords=Boolean(state.tournament&&(state.tournament.matches.length||state.current&&state.current.status!=='running'));
  for(const id of ['export-rounds','export-scores','export-json'])$(id).disabled=!hasRecords;
  $('import-json').disabled=state.active||state.computing;
  const s=state.tournament?.settings??state.settings;
  $('pairing-bar').hidden=!(['survival'].includes(s.format)||Boolean(state.tournament&&state.active&&!state.computing&&playback.finished));
  $('next-match').disabled=!state.active||state.computing||state.tournament?.status==='complete'||Boolean(state.current&&!playback.finished);
  $('next-match').textContent=state.tournament?.pendingTie?'Resolve tie →':'Next match →';
  $('next-match').onclick=()=>state.tournament?.pendingTie?openDialog($('tie-dialog')):runNextMatch();
  $('pairing-help').textContent=s.format==='survival'?'Winner remains. Select the next opposing survivor.':'Ready for the next scheduled encounter.';
  $('pair-left').disabled=s.format!=='survival'||state.computing||state.tournament?.champion?.faction==='f2';
  $('pair-right').disabled=s.format!=='survival'||state.computing||state.tournament?.champion?.faction==='f1';
  updatePlaybackControls();
}
function updatePlaybackControls(){
  const available=Boolean(playback.match?.rows.length&&!state.computing);
  $('play-pause').disabled=!available;$('play-pause').textContent=playback.finished?'↻':playback.paused?'▶':'Ⅱ';$('play-pause').setAttribute('aria-label',playback.finished?'Replay match':playback.paused?'Play match':'Pause playback');
  $('step').disabled=!available||playback.finished;$('skip-match').disabled=!available||playback.finished;$('replay').disabled=!available;
}
function resetCompetition(){
  state.epoch++;engine.cancel();playback.stop();clearTimeout(state.autoTimer);state.active=false;state.computing=false;state.tournament=null;state.current=null;state.prepared=null;state.imported=false;state.replaying=false;
  playback.match=null;playback.cursor=0;playback.finished=false;
  $('left-name').textContent='Select a strategy';$('right-name').textContent='Select a strategy';$('left-score').textContent='0';$('right-score').textContent='0';$('left-share').textContent='— SHARED';$('right-share').textContent='— SHARED';$('history-rows').replaceChildren();$('history-empty').hidden=false;$('history-count').textContent='0 ARCHIVED';$('round-number').textContent='—';$('round-limit').textContent=`/ ${state.settings.rounds}`;$('round-ring').style.strokeDashoffset='276.46';$('chart-left').setAttribute('d','');$('chart-right').setAttribute('d','');$('live-tag').textContent='AWAITING LAUNCH';$('match-counter').textContent='STANDBY';$('match-summary').textContent='S = Share · K = Keep';$('winner-heading').textContent='Every decision counts.';
  playback.pendingCells();updateRuleTags(false);renderAll();
}
async function fetchRoster(demo){
  $('roster-status').textContent='Loading strategy files…';$('reload-roster').disabled=true;$('demo-roster').disabled=true;
  try{const roster=await loadRoster(undefined,demo);resetCompetition();state.roster=roster;state.queue=[];$('demo-badge').hidden=!demo;$('roster-status').textContent=`${roster.filter(s=>s.faction==='f2').length} left / ${roster.filter(s=>s.faction==='f1').length} right${demo?' · example strategies only':''}`;say(roster.length?`${demo?'Demo':'Faction'} roster loaded. Configure the tournament, then reveal & start.`:'No strategies listed yet. Add .py files to f1/ and f2/, run tools/build_manifest.py, and reload.');renderAll();}
  catch(error){$('roster-status').textContent=error.message;say(error.message,'error');}
  finally{setControls();}
}
function renderRosters(){
  const totals=state.tournament?.standings()??aggregate(state.roster,[]),active=playback.match?[playback.match.left.id,playback.match.right.id]:[];
  for(const f of ['f2','f1']){
    const roster=state.roster.filter(s=>s.faction===f),list=$(`${f}-roster`);list.replaceChildren();$(`${f}-count`).textContent=roster.length;$(`${f}-empty`).hidden=roster.length>0;
    $(`${f}-total`).textContent=points(totals.factions[f].points);
    const survivors=roster.filter(s=>!state.tournament||state.tournament.alive.has(s.id)).length;
    $(`${f}-survivors`).textContent=state.tournament?.settings.format==='survival'?`${survivors} / ${roster.length} strategies surviving`:`${totals.factions[f].rounds.toLocaleString()} strategy-rounds completed`;
    $(`${f}-note`).textContent=active.some(id=>roster.some(s=>s.id===id))?'Current signal active':'Awaiting next encounter';
    for(let i=0;i<roster.length;i++){
      const s=roster[i],li=document.createElement('li'),top=document.createElement('div');top.className='team-top';
      const idx=document.createElement('span');idx.className='team-index';idx.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.className='team-name';name.textContent=s.name;const flag=document.createElement('span');flag.className='team-state';
      const eliminated=state.tournament?.settings.format==='survival'&&!state.tournament.alive.has(s.id);
      if(active.includes(s.id)){li.classList.add('active');flag.textContent=playback.finished?'LAST':'LIVE';}if(eliminated){li.classList.add('eliminated');flag.textContent='OUT';}
      top.append(idx,name,flag);li.append(top);const stat=document.createElement('div');stat.className='team-points';const team=totals.teams.find(t=>t.id===s.id);const score=document.createElement('span');score.textContent=`${points(team?.points??0)} PTS`;const n=document.createElement('span');n.textContent=`${team?.matches??0} MATCHES`;stat.append(score,n);li.append(stat);li.title=s.filename;list.append(li);
    }
  }
}
function renderStandings(){
  const standings=state.tournament?.standings()??aggregate(state.roster,[]),body=$('standings-body');body.replaceChildren();
  if(!standings.teams.length){const row=body.insertRow(),cell=row.insertCell();cell.colSpan=8;cell.className='empty-state';cell.textContent='Standings will appear when strategies are loaded.';return;}
  for(const s of standings.teams){const row=body.insertRow();const values=[s.matches?s.rank:'—',s.name,labels()[s.faction],points(s.points),s.matches?points(s.averageMatch):'—',s.rounds?points(s.averageRound):'—',s.matches,s.rounds?`${points(s.shares/s.rounds*100)}%`:'—'];values.forEach((v,i)=>{const cell=row.insertCell();cell.textContent=v;if(i===2)cell.className=`faction-label faction-${s.faction}`;});}
  const survival=state.tournament?.settings.format==='survival';$('scoring-note').textContent=survival?'The surviving faction wins. Payoffs are still recorded; strategies reset before each match. Unequal match counts make point rankings descriptive.':'Ranked by total payoff. Match wins carry no bonus. Completed matches enter the standings after playback. Self-play credits the mean of the two seats once.';
  if(state.tournament?.status==='complete')$('winner-heading').textContent=state.tournament.winner==='tie'?'The factions finish level.':`${labels()[state.tournament.winner]} wins${survival?' by survival':''}.`;
}
function optionSelect(id,faction,surviving=false){
  const el=$(id),previous=el.value;el.replaceChildren();
  for(const s of state.roster.filter(s=>s.faction===faction&&(!surviving||!state.tournament||state.tournament.alive.has(s.id)))){const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;el.append(opt);}
  if([...el.options].some(o=>o.value===previous))el.value=previous;
  if(surviving&&state.tournament?.champion?.faction===faction)el.value=state.tournament.champion.id;
}
function renderPairing(){optionSelect('pair-left','f2',true);optionSelect('pair-right','f1',true);optionSelect('queue-left','f2');optionSelect('queue-right','f1');}
function renderQueue(){const ol=$('match-queue');ol.replaceChildren();for(let i=0;i<state.queue.length;i++){const q=state.queue[i],li=document.createElement('li'),span=document.createElement('span');span.textContent=`${i+1}. ${state.roster.find(s=>s.id===q.left)?.name??'?'} × ${state.roster.find(s=>s.id===q.right)?.name??'?'}`;const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.disabled=state.active;remove.onclick=()=>{state.queue.splice(i,1);renderQueue();renderMap();};li.append(span,remove);ol.append(li);}}
function renderMap(){
  const s=state.tournament?.settings??state.settings,box=$('schedule-view'),visible=playback.match??state.current;box.replaceChildren();$('map-title').textContent=s.format==='survival'?'The last faction standing':s.format==='duels'?'Your selected encounters':'The encounter grid';$('map-subtitle').textContent=descriptions[s.format];
  if(!state.roster.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Load a roster to see the tournament map.';box.append(p);return;}
  if(['t1','cross','full'].includes(s.format)){
    const rows=s.format==='full'?state.roster:state.roster.filter(s=>s.faction==='f2'),columns=s.format==='full'?state.roster:state.roster.filter(s=>s.faction==='f1');const table=document.createElement('table');table.className='matrix';table.setAttribute('aria-label','Tournament matchup grid');const head=table.createTHead().insertRow();head.append(document.createElement('th'));
    for(const team of columns){const th=document.createElement('th');th.scope='col';th.className=s.format==='full'?`faction-label faction-${team.faction}`:'column-title';th.textContent=team.name;head.append(th);}
    const body=table.createTBody();for(let i=0;i<rows.length;i++){const row=body.insertRow(),th=document.createElement('th');th.scope='row';th.className=s.format==='full'?`faction-label faction-${rows[i].faction}`:'row-title';th.textContent=rows[i].name;row.append(th);
      for(let j=0;j<columns.length;j++){const left=rows[i],right=columns[j],td=row.insertCell(),button=document.createElement('button');button.type='button';const usable=s.format!=='full'||(j>i||j===i&&s.selfPlay);if(!usable){button.textContent='·';button.className='unavailable';button.disabled=true;td.append(button);continue;}
        const matches=state.tournament?.matches.filter(m=>(m.left.id===left.id&&m.right.id===right.id)||(m.left.id===right.id&&m.right.id===left.id))??[];const active=visible&&((visible.left.id===left.id&&visible.right.id===right.id)||(visible.left.id===right.id&&visible.right.id===left.id));
        if(matches.length){button.classList.add('complete');const l=matches.reduce((sum,m)=>sum+m.rows.at(-1)[m.left.id===left.id?'totalLeft':'totalRight'],0),r=matches.reduce((sum,m)=>sum+m.rows.at(-1)[m.left.id===left.id?'totalRight':'totalLeft'],0);const score=document.createElement('span');score.textContent=`${points(l)} : ${points(r)}`;const small=document.createElement('small');small.textContent=`${matches.length} / ${s.repeats} played`;button.append(score,small);button.onclick=()=>replayMatch(matches.at(-1));}
        else {button.textContent=active?'ON AIR':'—';button.disabled=true;}if(active)button.classList.add('current');button.setAttribute('aria-label',`${left.name} versus ${right.name}: ${button.textContent}${matches.length?'. Replay completed match.':''}`);td.append(button);
      }}box.append(table);return;
  }
  if(s.format==='survival'){const header=document.createElement('div');header.className='survival-header';for(const f of ['f2','f1']){const meter=document.createElement('div');meter.className=`survival-meter faction-${f}`;const name=document.createElement('span');name.textContent=labels()[f];meter.append(name);for(const team of state.roster.filter(t=>t.faction===f)){const dot=document.createElement('span');dot.className='survival-dot'+(state.tournament&&!state.tournament.alive.has(team.id)?' out':'');dot.title=team.name;meter.append(dot);}header.append(meter);}box.append(header);}
  const list=document.createElement('div');list.className='encounter-list';const encounters=state.tournament?(s.format==='duels'?state.tournament.schedule:state.tournament.matches):state.queue.map((q,i)=>({left:state.roster.find(t=>t.id===q.left),right:state.roster.find(t=>t.id===q.right),index:i+1,repeat:1}));
  for(const encounter of encounters){if(!encounter.left||!encounter.right)continue;const played=state.tournament?.matches.find(m=>m.index===encounter.index),card=document.createElement('article');card.className='encounter-card'+(visible?.index===encounter.index?' active':'');const tag=document.createElement('p');tag.className='eyebrow';tag.textContent=`MATCH ${String(encounter.index).padStart(2,'0')}`;card.append(tag);for(const side of ['left','right']){const name=document.createElement('strong');name.className=`${encounter[side].faction}-name`;name.textContent=encounter[side].name;card.append(name);}const result=document.createElement('span');result.textContent=played?`${points(played.rows.at(-1).totalLeft)} : ${points(played.rows.at(-1).totalRight)}`:'Scheduled';card.append(result);if(played){if(played.advancement){const advance=document.createElement('p');advance.className='eyebrow';advance.textContent=`${state.roster.find(t=>t.id===played.advancement.winner).name} advances${played.advancement.instructorDecision?' · instructor choice':''}`;card.append(advance);}const btn=document.createElement('button');btn.type='button';btn.textContent='Replay ↻';btn.onclick=()=>replayMatch(played);card.append(btn);}list.append(card);}
  if(!list.children.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent=s.format==='survival'?'A winner can stay at the frontier and face every opposing strategy. Choose the first pair above.':'Add matches to your queue in Setup.';list.append(empty);}box.append(list);
}
function renderAll(){applyPresentation();renderRosters();renderStandings();renderPairing();renderQueue();renderMap();setControls();}

function stageTournament(){
  try{if(state.imported)throw Error('Load your faction folders before starting a new tournament.');state.settings=inputSettings();state.prepared=new Tournament(state.roster,state.settings,state.queue);$('reveal-value').textContent=Number(state.settings.multiplier).toFixed(2)+'×';$('reveal-kk').textContent=points(2*state.settings.multiplier);$('reveal-pair').textContent=`${points(2*state.settings.multiplier)} / ${points(2*state.settings.multiplier)}`;openDialog($('reveal-dialog'));}
  catch(error){say(error.message,'error');$('settings-message').textContent=error.message;openDialog($('settings-dialog'));}
}
async function launchTournament(){
  if(!state.prepared)return;const prepared=state.prepared;resetCompetition();state.tournament=prepared;state.active=true;state.replaying=false;state.tournament.status='running';closeDialog($('reveal-dialog'));updateRuleTags(true);renderAll();await runNextMatch();
}
async function runNextMatch(){
  if(!state.active||state.computing||state.tournament?.pendingTie)return;
  clearTimeout(state.autoTimer);state.replaying=false;const pairing=state.tournament.nextPair($('pair-left').value,$('pair-right').value);if(!pairing)return;
  const epoch=state.epoch;state.computing=true;state.current={...pairing,rows:[],status:'running'};playback.load(state.current,state.tournament.settings,{autoplay:false});$('round-limit').textContent=`/ ${state.tournament.settings.rounds}`;$('match-counter').textContent=`MATCH ${pairing.index} / ${state.tournament.totalMatches}${state.settings.format==='survival'?' MAX':''}`;$('live-tag').textContent='CALCULATING';say(`Preparing ${pairing.left.name} × ${pairing.right.name}…`,'active');setControls();renderRosters();renderMap();
  const result=await engine.run(pairing,state.tournament.settings,(n,cap)=>say(`Calculating match ${pairing.index}: ${n} / ${cap} rounds…`,'active'),stage=>say(stage,'active'));
  if(epoch!==state.epoch)return;state.computing=false;state.current=result;
  if(result.status!=='complete'){state.active=false;state.tournament.status='incomplete';say(`${result.error} ${result.rows.length} completed rounds preserved; this match is excluded from standings.`,'error');}
  else say(`Match ${result.index} on air · ${result.left.name} × ${result.right.name}`,'active');
  playback.load(result,state.tournament.settings,{autoplay:result.status==='complete'&&state.active});renderRosters();renderMap();setControls();
}
function scheduleNext(){clearTimeout(state.autoTimer);if(state.active&&!state.replaying&&$('auto-next').checked&&!state.tournament.pendingTie&&state.tournament.status!=='complete')state.autoTimer=setTimeout(()=>runNextMatch(),1500);}
function matchFinished(match){
  if(!state.tournament||state.replaying||state.imported)return;
  if(match.status==='complete'&&!state.tournament.matches.some(m=>m.index===match.index)){
    state.tournament.commit(match);renderAll();
    if(state.tournament.pendingTie){const last=match.rows.at(-1);$('tie-message').textContent=`${match.left.name} and ${match.right.name} each earned ${points(last.totalLeft)} points.`;$('advance-left').textContent=`Advance ${match.left.name}`;$('advance-right').textContent=`Advance ${match.right.name}`;say('Tied elimination match. Choose which strategy advances.');openDialog($('tie-dialog'));return;}
    if(state.tournament.status==='complete'){state.active=false;say(state.tournament.winner==='tie'?'Tournament complete · the factions finish level.':`Tournament complete · ${labels()[state.tournament.winner]} wins.`);setControls();return;}
    say(`Match ${match.index} archived. ${$('auto-next').checked?'Next encounter in a moment.':'Select Next match to continue.'}`,'active');scheduleNext();
  }
  setControls();
}
function replayMatch(match){
  if(state.computing)return;clearTimeout(state.autoTimer);
  // Archive the current complete record before changing views so it is never silently discarded.
  if(state.current?.status==='complete'&&!state.tournament.matches.some(m=>m.index===state.current.index)&&!state.replaying){playback.finish();clearTimeout(state.autoTimer);if(state.tournament.pendingTie)return;}
  state.replaying=true;playback.load(match,state.tournament.settings);renderRosters();renderMap();setControls();say(`Replaying match ${match.index} from its recorded decisions.`,state.active?'active':'idle');
}
function advanceTie(side){
  const match=state.tournament?.pendingTie;if(!match)return;
  state.tournament.advance(match[side].id);closeDialog($('tie-dialog'));renderAll();
  if(state.tournament.status==='complete'){state.active=false;say(`Tournament complete · ${labels()[state.tournament.winner]} wins by survival.`);setControls();}
  else{say(`${match[side].name} advances. Choose the next opposing strategy.`,'active');scheduleNext();}
}
function stopTournament(){state.active=false;clearTimeout(state.autoTimer);engine.cancel();playback.stop();if(state.tournament&&state.tournament.status!=='complete')state.tournament.status='stopped';say('Tournament stopped. Completed matches and recorded rounds remain available.');setControls();}

$('open-settings').onclick=()=>{setControls();openDialog($('settings-dialog'));};$('close-settings').onclick=()=>closeDialog($('settings-dialog'));
$('settings-form').onsubmit=event=>{event.preventDefault();try{applyPresentation();if(!state.active&&!state.computing&&!state.imported){const next=inputSettings();if(JSON.stringify(next)!==JSON.stringify(state.settings)){state.settings=next;resetCompetition();}updateRuleTags();}renderAll();closeDialog($('settings-dialog'));$('settings-message').textContent='';}catch(error){$('settings-message').textContent=error.message;}};
for(const id of ['format','ending','multiplier','rounds','continuation'])$(id).addEventListener('input',updateSettingsFields);
$('format').addEventListener('input',()=>{if($('format').value==='survival')$('auto-next').checked=false;});
$('reload-roster').onclick=()=>fetchRoster(false);$('demo-roster').onclick=()=>fetchRoster(true);
$('new-seed').onclick=()=>{$('seed').value=crypto.randomUUID().slice(0,18);};
$('add-pair').onclick=()=>{if(!$('queue-left').value||!$('queue-right').value){$('settings-message').textContent='Load both factions first.';return;}state.queue.push({left:$('queue-left').value,right:$('queue-right').value});renderQueue();renderMap();};
$('start').onclick=stageTournament;$('launch').onclick=launchTournament;$('cancel-launch').onclick=()=>closeDialog($('reveal-dialog'));$('stop').onclick=stopTournament;$('next-match').onclick=runNextMatch;
$('play-pause').onclick=()=>{if(playback.finished){clearTimeout(state.autoTimer);state.replaying=true;}playback.toggle();};$('step').onclick=()=>playback.step();$('skip-match').onclick=()=>playback.finish();$('replay').onclick=()=>{clearTimeout(state.autoTimer);state.replaying=state.tournament?.matches.some(m=>m.index===playback.match?.index)||state.imported;playback.load(playback.match,state.tournament.settings);setControls();};
$('speed').oninput=()=>{playback.setSpeed($('speed').value);$('speed-value').value=`${$('speed').value}×`;};$('auto-next').onchange=()=>{if(!$('auto-next').checked)clearTimeout(state.autoTimer);else if(playback.finished)scheduleNext();};
$('advance-left').onclick=()=>advanceTie('left');$('advance-right').onclick=()=>advanceTie('right');$('tie-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDialog($('tie-dialog'));say('Elimination is paused at a tie. Open the tie decision to continue.');const button=$('next-match');button.disabled=false;button.textContent='Resolve tie →';button.onclick=()=>openDialog($('tie-dialog'));});
$('export-rounds').onclick=()=>download(roundsCSV(state.tournament,state.current),'space-dilemma-rounds.csv');$('export-scores').onclick=()=>download(standingsCSV(state.tournament),'space-dilemma-standings.csv');$('export-json').onclick=()=>download(replayJSON(state.tournament,state.current,labels()),'space-dilemma-replay.json','application/json');
function openReplay(text,{autoplay=false,first=false}={}){const result=parseReplay(text);resetCompetition();state.tournament=result.tournament;state.settings=state.tournament.settings;state.roster=state.tournament.roster;state.imported=true;state.replaying=true;for(const f of ['f1','f2'])if(typeof result.labels[f]==='string')$(`label-${f}`).value=result.labels[f].slice(0,40);putSettings(state.settings);applyPresentation();state.current=first?(state.tournament.matches.find(m=>m.rows.some(r=>r.left!==r.right))??state.tournament.matches[0]):result.partial??state.tournament.matches.at(-1);updateRuleTags(true);if(state.current)playback.load(state.current,state.settings,{autoplay});$('match-counter').textContent=`REPLAY · ${state.tournament.matches.length} MATCHES`;$('demo-badge').hidden=!state.roster.some(s=>s.demo);renderAll();say('Saved replay opened. Playback uses recorded decisions; no Python download is needed.');}
$('import-json').onchange=async()=>{const file=$('import-json').files[0];if(!file)return;try{if(file.size>50*1024*1024)throw Error('Replay file exceeds 50 MiB.');openReplay(await file.text());}catch(error){say(error.message,'error');}finally{$('import-json').value='';}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{say('Full-screen mode is unavailable. Use your browser’s full-screen control.');}};
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','BUTTON','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();$('play-pause').click();}});
window.addEventListener('beforeunload',()=>engine.cancel());
const media=window.matchMedia('(prefers-reduced-motion: reduce)');$('reduce-motion').checked=media.matches;
updateSettingsFields();renderAll();
// The optional single-file preview embeds an actual Python-generated demo replay.
const embedded=document.getElementById('embedded-replay');
if(embedded){try{openReplay(embedded.textContent,{autoplay:true,first:true});say('DEMO REPLAY · Recorded Python tournament. Click a completed encounter to watch it.');for(const id of ['reload-roster','demo-roster'])$(id).hidden=true;$('roster-status').textContent='Offline preview. Load student strategies in the hosted site.';}catch(error){say(error.message,'error');}}
else fetchRoster(false);

export const viewer={state,playback,fetchRoster,stageTournament,launchTournament,runNextMatch,stopTournament,applyPresentation,renderAll,openReplay};
registerViewerTools(viewer);
